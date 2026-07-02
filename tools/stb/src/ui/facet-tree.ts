// src/ui/facet-tree.ts
import type { Facets, FacetValue, Layer, Gradient } from '@/metadata/types';
import type { Oklch } from '@/color/oklch';
import { toOklch, oklchToHex } from '@/color/oklch';
import type { ColorFormat } from '@/color/format';
import { FACET_PROPS } from '@/metadata/facets';
import { openColorPicker } from '@/ui/color-picker';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';
import { deriveDarkOklch } from '@/color/derive-dark';

const GROUPS = ['text', 'surface', 'spacing'] as const;
const propsOf = (g: string) => Object.entries(FACET_PROPS).filter(([k]) => k.startsWith(g + '.'));

export interface FacetTreeOptions {
  facets: Facets;
  /** Parallel dark-mode overrides, rendered as a second value column beside each color row. */
  darkFacets?: Facets;
  previewHost: HTMLElement;
  onEdit: (key: string, value: FacetValue) => void;
  /** Dark-mode counterpart of onEdit; fired when the dark swatch is edited directly. */
  onDarkEdit?: (key: string, value: FacetValue) => void;
  /** Fired when the per-row "derive dark from light" button is clicked. Caller computes
   *  deriveDarkOklch and routes the result through its own dark-edit path. */
  deriveDark?: (key: string) => void;
  onAddGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  onRemoveGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  /** Returns the token name mapped to this element's property, or null if none. */
  tokenForKey?: (key: string) => string | null;
  /** Resolves the literal FacetValue to detach TO (token's current value). */
  resolveLiteral?: (key: string, token: string) => FacetValue;
  onContentEdit?: (text: string) => void;
  onAssetEdit?: (file: File) => void;
  /** Live color-format accessor (hex/rgb/oklch), read when a color picker opens so the
   *  picker's text field matches the format chosen in the top bar. */
  colorFormat?: () => ColorFormat;
  /** Background composite (Task 8/9): backstop color + bottom-up layer stack. */
  onBackstop?: (value: FacetValue) => void;
  onAddLayer?: (layer: Layer) => void;
  onSetLayer?: (index: number, layer: Layer) => void;
  /** Dark-mode counterpart of onSetLayer, for gradient stop dark-swatch/derive edits. */
  onSetLayerDark?: (index: number, layer: Layer) => void;
  onRemoveLayer?: (index: number) => void;
  onReorderLayer?: (from: number, to: number) => void;
  /** Font-family fallback list (Task 10): ordered comma-list, same kind-1 shape as background.layers. */
  onAddFont?: (value: FacetValue) => void;
  onSetFont?: (index: number, value: FacetValue) => void;
  onRemoveFont?: (index: number) => void;
  onReorderFont?: (from: number, to: number) => void;
  /** Spacing composite (Task 11): T/R/B/L padding/margin + row/column gap positional tuples. */
  onSetSide?: (group: 'padding' | 'margin', side: 'top' | 'right' | 'bottom' | 'left', value: FacetValue) => void;
  onSetGap?: (slot: 'row' | 'column', value: FacetValue) => void;
}

const FONT_WEIGHTS = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

interface GroupEntry {
  group: string;
  branch: HTMLElement;
  leaves: HTMLElement;
  collapsed: boolean;
}

/** Swatch hex for a color-carrying FacetValue — literal may be a resolved Oklch
 *  object or a raw string (gradient stops round-trip either shape). Returns
 *  null for a token reference or a missing value (empty swatch). */
function swatchHex(v: FacetValue | undefined): string | null {
  if (!v || 'token' in v) return null;
  return typeof v.literal === 'object' ? oklchToHex(v.literal as Oklch) : v.literal;
}

function setCollapsed(entry: GroupEntry, collapsed: boolean): void {
  entry.collapsed = collapsed;
  entry.branch.classList.toggle('stb-facet-collapsed', collapsed);
  entry.leaves.hidden = collapsed;
}

export function mountFacetTree(host: HTMLElement, opts: FacetTreeOptions): { destroy(): void } {
  host.classList.add('stb-facet-tree');
  host.innerHTML = '';
  let focusedGroup: string | null = null;

  // Control bar — rendered first so it is the top child
  const bar = document.createElement('div');
  bar.className = 'stb-facet-bar';

  const btnExpandAll = document.createElement('button');
  btnExpandAll.type = 'button';
  btnExpandAll.className = 'stb-facet-expand-all';
  btnExpandAll.textContent = 'Expand all';

  const btnCollapseAll = document.createElement('button');
  btnCollapseAll.type = 'button';
  btnCollapseAll.className = 'stb-facet-collapse-all';
  btnCollapseAll.textContent = 'Collapse all';

  const btnIsolate = document.createElement('button');
  btnIsolate.type = 'button';
  btnIsolate.className = 'stb-facet-isolate';
  btnIsolate.textContent = 'Isolate';

  bar.appendChild(btnExpandAll);
  bar.appendChild(btnCollapseAll);
  bar.appendChild(btnIsolate);

  // "+ add group" select — lists only the GROUPS not yet present in facets
  const addSelect = document.createElement('select');
  addSelect.className = 'stb-facet-add';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '+ add group';
  placeholder.disabled = true;
  addSelect.appendChild(placeholder);
  for (const g of GROUPS) {
    if (!opts.facets[g]) {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      addSelect.appendChild(opt);
    }
  }
  addSelect.value = '';
  addSelect.addEventListener('change', () => {
    const g = addSelect.value as 'text' | 'surface' | 'spacing';
    if (g) {
      opts.onAddGroup?.(g);
      addSelect.value = '';
    }
  });
  bar.appendChild(addSelect);

  host.appendChild(bar);

  const groupEntries: GroupEntry[] = [];

  // Standalone content leaf — not part of any style group
  if (opts.facets.content) {
    const leaf = document.createElement('div');
    leaf.className = 'stb-facet-leaf';
    leaf.dataset.key = 'content';
    const lab = document.createElement('span');
    lab.className = 'stb-facet-leaf-label';
    lab.textContent = 'content';
    leaf.appendChild(lab);
    const ta = document.createElement('textarea');
    ta.value = opts.facets.content.text;
    ta.addEventListener('input', () => opts.onContentEdit?.(ta.value));
    leaf.appendChild(ta);
    host.appendChild(leaf);
  }

  // Standalone asset leaf — not part of any style group. Only for genuine
  // <img>-role elements: a background composite (below) owns asset display
  // for anything with a background facet, superseding this slot.
  if (opts.facets.asset && !opts.facets.background) {
    const leaf = document.createElement('div');
    leaf.className = 'stb-facet-leaf';
    leaf.dataset.key = 'asset';
    const lab = document.createElement('span');
    lab.className = 'stb-facet-leaf-label';
    lab.textContent = 'asset';
    leaf.appendChild(lab);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) opts.onAssetEdit?.(file);
    });
    leaf.appendChild(input);
    host.appendChild(leaf);
  }

  // Background composite — bottom-up stack rendered top-to-bottom in the DOM:
  // the backstop color row first, then each layer in array order (last =
  // topmost, matching the authoring model; the emitter reverses for CSS).
  if (opts.facets.background) {
    const background = opts.facets.background;
    const layers = background.layers ?? [];

    const colorRow = document.createElement('div');
    colorRow.className = 'stb-facet-bg-row';
    colorRow.dataset.stbBgRow = 'color';
    const colorLab = document.createElement('span');
    colorLab.className = 'stb-facet-leaf-label';
    colorLab.textContent = 'backstop';
    colorRow.appendChild(colorLab);

    const colorLit = background.color && 'literal' in background.color && typeof background.color.literal === 'object'
      ? background.color.literal as Oklch
      : null;
    const colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.className = 'stb-facet-swatch';
    if (colorLit) colorBtn.style.backgroundColor = oklchToHex(colorLit);
    colorBtn.addEventListener('click', () => openColorPicker({
      previewHost: opts.previewHost,
      initial: colorLit ? oklchToHex(colorLit) : '#000000',
      format: opts.colorFormat?.() ?? 'hex',
      onChange: (value) => opts.onBackstop?.({ literal: toOklch(value) }),
    }));
    colorRow.appendChild(colorBtn);

    // Dark counterpart, mirroring the leaf color-loop's light/dark/derive pattern
    // (locked layout: light, dark, derive) — routes through onDarkEdit/deriveDark
    // keyed on 'background.color', same as any other FACET_PROPS color leaf.
    const colorDark = opts.darkFacets?.background?.color;
    const colorLitDark = colorDark && 'literal' in colorDark && typeof colorDark.literal === 'object'
      ? colorDark.literal as Oklch
      : null;
    const colorDarkBtn = document.createElement('button');
    colorDarkBtn.type = 'button';
    colorDarkBtn.className = 'stb-facet-swatch-dark';
    if (colorLitDark) {
      colorDarkBtn.style.backgroundColor = oklchToHex(colorLitDark);
    } else {
      colorDarkBtn.classList.add('stb-facet-swatch-empty');
    }
    colorDarkBtn.addEventListener('click', () => openColorPicker({
      previewHost: opts.previewHost,
      initial: colorLitDark ? oklchToHex(colorLitDark) : '#000000',
      format: opts.colorFormat?.() ?? 'hex',
      onChange: (value) => opts.onDarkEdit?.('background.color', { literal: toOklch(value) }),
    }));
    colorRow.appendChild(colorDarkBtn);

    const colorDeriveBtn = document.createElement('button');
    colorDeriveBtn.type = 'button';
    colorDeriveBtn.className = 'stb-facet-derive-dark';
    colorDeriveBtn.textContent = '↓';
    colorDeriveBtn.title = 'Derive dark from light';
    colorDeriveBtn.disabled = !colorLit;
    colorDeriveBtn.addEventListener('click', () => { if (colorLit) opts.deriveDark?.('background.color'); });
    colorRow.appendChild(colorDeriveBtn);

    host.appendChild(colorRow);

    layers.forEach((layer, i) => {
      const row = document.createElement('div');
      row.className = 'stb-facet-bg-row';
      row.dataset.stbBgRow = 'layer';

      if (layer.kind === 'image') {
        const lab = document.createElement('span');
        lab.className = 'stb-facet-leaf-label';
        lab.textContent = layer.ref || '(no image)';
        row.appendChild(lab);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', () => {
          const file = input.files?.[0];
          if (!file) return;
          const ref = assetRefFor(file.name);
          setBrandingAsset(ref, file, file.name);
          opts.onSetLayer?.(i, { kind: 'image', ref });
        });
        row.appendChild(input);
      } else {
        // Gradient layer: inline editor covering what Stratos themes today —
        // type, ONE angle/position field, and a color-stop list. Anything more
        // exotic (shape/size/fromAngle/repeating) already round-trips through
        // gradientCss and the model if present; it is preserved (not edited)
        // by spreading the existing gradient and overriding only the fields
        // these controls own — exotic values go through scopedBlock instead.
        // Held in a `let` updated by every setGradient call: re-render is
        // suppressed while a text input is focused, so consecutive edits to two
        // different gradient fields land on the SAME mounted row — each patch
        // must build on the latest written gradient, not the mount-time snapshot,
        // or the second edit clobbers the first.
        let gradient = layer.gradient;
        const rebuild = (patch: Partial<Gradient>): Gradient => ({ ...gradient, ...patch }) as Gradient;
        // Type switch rebuilds the gradient per target arm rather than spreading,
        // so arm-specific fields (angle/shape/size/fromAngle) can't leak into an
        // arm that doesn't own them. Shared fields carry: stops, repeating, and
        // position where the target supports it (radial/conic).
        const convertType = (g: Gradient, type: Gradient['type']): Gradient => {
          if (type === g.type) return g;
          const base = { stops: g.stops, ...(g.repeating !== undefined ? { repeating: g.repeating } : {}) };
          if (type === 'linear') return { type, ...base };
          const pos = 'position' in g && g.position !== undefined ? { position: g.position } : {};
          return { type, ...base, ...pos };
        };
        const setGradient = (g: Gradient) => {
          gradient = g;
          opts.onSetLayer?.(i, { kind: 'gradient', gradient: g });
        };

        // Dark counterpart of this layer, if one has been forked already (copy-on-
        // first-dark-edit, applied in main.ts). Read fresh on every mount so it
        // tracks state changes the same way the light `gradient` local does.
        const darkLayers = opts.darkFacets?.background?.layers;
        const isDarkForked = !!darkLayers;
        const darkLayer = darkLayers?.[i];
        const darkGradient = darkLayer?.kind === 'gradient' ? darkLayer.gradient : null;
        // Once the dark array is forked, the dark side is authoritative. If a
        // structural light edit (add/remove/reorder) has since broken index
        // correspondence — this index is missing or not a gradient on the dark
        // side — there is no correct dark value to show or seed from: re-seeding
        // from the CURRENT light gradient would silently clobber whatever real
        // dark fork exists elsewhere in the array once main.ts's array-level
        // setLayer writes it back. Surface the mismatch instead of guessing.
        const darkMismatch = isDarkForked && !darkGradient;
        // Seed for the first dark edit: the existing dark gradient if this layer
        // has already been forked, otherwise (unforked case only) a structural
        // copy of the CURRENT light gradient so the fork starts from what's on
        // screen, not the mount-time snapshot. Once forked, light and dark
        // gradients are independent — later edits to one never touch the other.
        const seedDarkGradient = (): Gradient =>
          darkGradient ?? (JSON.parse(JSON.stringify(gradient)) as Gradient);
        const setDarkStop = (si: number, color: FacetValue) => {
          if (darkMismatch) return;
          const seed = seedDarkGradient();
          const stops = seed.stops.map((s, idx) => (idx === si ? { ...s, color } : s));
          opts.onSetLayerDark?.(i, { kind: 'gradient', gradient: { ...seed, stops } as Gradient });
        };

        const editor = document.createElement('div');
        editor.className = 'stb-facet-bg-gradient';

        const typeSel = document.createElement('select');
        typeSel.className = 'stb-facet-bg-gradient-type';
        for (const t of ['linear', 'radial', 'conic'] as const) {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          typeSel.appendChild(opt);
        }
        typeSel.value = gradient.type;
        typeSel.addEventListener('change', () => {
          setGradient(convertType(gradient, typeSel.value as Gradient['type']));
        });
        editor.appendChild(typeSel);

        // One angle/position field: linear owns `angle`, radial/conic own `position`.
        const posInput = document.createElement('input');
        posInput.type = 'text';
        posInput.className = 'stb-facet-bg-gradient-pos';
        posInput.placeholder = gradient.type === 'linear' ? 'angle' : 'position';
        posInput.value = gradient.type === 'linear' ? (gradient.angle ?? '') : (gradient.position ?? '');
        posInput.addEventListener('input', () => {
          const patch: Partial<Gradient> = gradient.type === 'linear'
            ? { angle: posInput.value }
            : { position: posInput.value };
          setGradient(rebuild(patch));
        });
        editor.appendChild(posInput);

        const stopsEl = document.createElement('div');
        stopsEl.className = 'stb-facet-bg-gradient-stops';
        gradient.stops.forEach((stop, si) => {
          const stopRow = document.createElement('div');
          stopRow.className = 'stb-facet-bg-gradient-stop';

          const stopHex = swatchHex(stop.color);
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.className = 'stb-facet-swatch';
          if (stopHex) swatch.style.backgroundColor = stopHex;
          swatch.addEventListener('click', () => openColorPicker({
            previewHost: opts.previewHost,
            initial: stopHex ?? '#000000',
            format: opts.colorFormat?.() ?? 'hex',
            onChange: (value) => {
              const stops = gradient.stops.map((s, idx) =>
                idx === si ? { ...s, color: { literal: toOklch(value) } } : s);
              setGradient(rebuild({ stops }));
            },
          }));
          stopRow.appendChild(swatch);

          // Dark counterpart of this stop, mirroring the leaf color-loop's
          // light/dark/derive layout.
          const darkStop = darkGradient?.stops[si];
          const darkStopHex = swatchHex(darkStop?.color);
          const darkSwatch = document.createElement('button');
          darkSwatch.type = 'button';
          darkSwatch.className = 'stb-facet-swatch-dark';
          if (darkStopHex) {
            darkSwatch.style.backgroundColor = darkStopHex;
          } else {
            darkSwatch.classList.add('stb-facet-swatch-empty');
          }
          // Forked-but-mismatched rows are disabled, not re-seeded: see darkMismatch above.
          darkSwatch.disabled = darkMismatch;
          darkSwatch.addEventListener('click', () => {
            if (darkMismatch) return;
            openColorPicker({
              previewHost: opts.previewHost,
              initial: darkStopHex ?? '#000000',
              format: opts.colorFormat?.() ?? 'hex',
              onChange: (value) => setDarkStop(si, { literal: toOklch(value) }),
            });
          });
          stopRow.appendChild(darkSwatch);

          // Per-stop derive: only meaningful when the light stop resolves to a
          // literal Oklch — a token stop has nothing to derive from.
          const stopOklch: Oklch | null = stop.color && !('token' in stop.color)
            ? (typeof stop.color.literal === 'object' ? stop.color.literal as Oklch : toOklch(stop.color.literal))
            : null;
          const stopDeriveBtn = document.createElement('button');
          stopDeriveBtn.type = 'button';
          stopDeriveBtn.className = 'stb-facet-derive-dark';
          stopDeriveBtn.textContent = '↓';
          stopDeriveBtn.title = 'Derive dark from light';
          stopDeriveBtn.disabled = !stopOklch || darkMismatch;
          stopDeriveBtn.addEventListener('click', () => {
            if (!stopOklch || darkMismatch) return;
            setDarkStop(si, { literal: deriveDarkOklch(stopOklch, { role: 'background' }) });
          });
          stopRow.appendChild(stopDeriveBtn);

          const stopPos = document.createElement('input');
          stopPos.type = 'text';
          stopPos.className = 'stb-facet-bg-gradient-stop-pos';
          stopPos.placeholder = 'position';
          stopPos.value = stop.position ?? '';
          stopPos.addEventListener('input', () => {
            const stops = gradient.stops.map((s, idx) => {
              if (idx !== si) return s;
              const { position: _drop, ...rest } = s;
              return stopPos.value ? { ...rest, position: stopPos.value } : rest;
            });
            setGradient(rebuild({ stops }));
          });
          stopRow.appendChild(stopPos);

          const removeStopBtn = document.createElement('button');
          removeStopBtn.type = 'button';
          removeStopBtn.className = 'stb-facet-bg-gradient-stop-remove';
          removeStopBtn.textContent = '×';
          removeStopBtn.disabled = gradient.stops.length <= 1;
          removeStopBtn.addEventListener('click', () => {
            const stops = gradient.stops.filter((_, idx) => idx !== si);
            setGradient(rebuild({ stops }));
          });
          stopRow.appendChild(removeStopBtn);

          stopsEl.appendChild(stopRow);
        });
        editor.appendChild(stopsEl);

        const addStopBtn = document.createElement('button');
        addStopBtn.type = 'button';
        addStopBtn.className = 'stb-facet-bg-gradient-add-stop';
        addStopBtn.textContent = '+ stop';
        addStopBtn.addEventListener('click', () => {
          const stops = [...gradient.stops, { color: { literal: '#000000' } }];
          setGradient(rebuild({ stops }));
        });
        editor.appendChild(addStopBtn);

        row.appendChild(editor);
      }

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'stb-facet-bg-move-up';
      upBtn.textContent = '↑';
      upBtn.disabled = i === 0;
      upBtn.addEventListener('click', () => opts.onReorderLayer?.(i, i - 1));
      row.appendChild(upBtn);

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'stb-facet-bg-move-down';
      downBtn.textContent = '↓';
      downBtn.disabled = i === layers.length - 1;
      downBtn.addEventListener('click', () => opts.onReorderLayer?.(i, i + 1));
      row.appendChild(downBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'stb-facet-bg-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => opts.onRemoveLayer?.(i));
      row.appendChild(removeBtn);

      host.appendChild(row);
    });

    const footer = document.createElement('div');
    footer.className = 'stb-facet-bg-footer';
    const addImageBtn = document.createElement('button');
    addImageBtn.type = 'button';
    addImageBtn.className = 'stb-facet-bg-add-image';
    addImageBtn.textContent = '+ image';
    addImageBtn.addEventListener('click', () => opts.onAddLayer?.({ kind: 'image', ref: '' }));
    footer.appendChild(addImageBtn);

    const addGradientBtn = document.createElement('button');
    addGradientBtn.type = 'button';
    addGradientBtn.className = 'stb-facet-bg-add-gradient';
    addGradientBtn.textContent = '+ gradient';
    addGradientBtn.addEventListener('click', () => opts.onAddLayer?.({
      kind: 'gradient',
      gradient: { type: 'linear', stops: [{ color: { literal: '#000000' } }, { color: { literal: '#ffffff' } }] },
    }));
    footer.appendChild(addGradientBtn);

    host.appendChild(footer);
  }

  for (const g of GROUPS) {
    if (!opts.facets[g]) continue;

    const branch = document.createElement('div');
    branch.className = 'stb-facet-group';
    branch.textContent = g;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'stb-facet-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onRemoveGroup?.(g as 'text' | 'surface' | 'spacing');
    });
    branch.appendChild(removeBtn);

    host.appendChild(branch);

    const leavesEl = document.createElement('div');
    leavesEl.className = 'stb-facet-leaves';
    host.appendChild(leavesEl);

    const entry: GroupEntry = { group: g, branch, leaves: leavesEl, collapsed: false };
    groupEntries.push(entry);

    branch.addEventListener('click', () => {
      setCollapsed(entry, !entry.collapsed);
    });

    const props = propsOf(g);
    if (props.some(([, s]) => s.isColor)) {
      const header = document.createElement('div');
      header.className = 'stb-facet-dual-header';
      const lightLab = document.createElement('span');
      lightLab.className = 'stb-facet-dual-header-light';
      lightLab.textContent = 'light';
      const darkLab = document.createElement('span');
      darkLab.className = 'stb-facet-dual-header-dark';
      darkLab.textContent = 'dark';
      header.append(lightLab, darkLab);
      leavesEl.appendChild(header);
    }

    // Font-family fallback list — a kind-1 ordered comma-list (like background.layers)
    // rather than a single FacetValue leaf, so it's not in FACET_PROPS/props and is
    // rendered here explicitly rather than through the per-key leaf loop below.
    if (g === 'text') {
      const fontList = opts.facets.text?.fontFamily ?? [];
      fontList.forEach((v, i) => {
        const row = document.createElement('div');
        row.className = 'stb-facet-fontfamily-row';
        row.dataset.stbFontfamilyRow = 'font';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = 'literal' in v ? String(v.literal) : '';
        input.addEventListener('input', () => opts.onSetFont?.(i, { literal: input.value }));
        row.appendChild(input);

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'stb-facet-fontfamily-move-up';
        upBtn.textContent = '↑';
        upBtn.disabled = i === 0;
        upBtn.addEventListener('click', () => opts.onReorderFont?.(i, i - 1));
        row.appendChild(upBtn);

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'stb-facet-fontfamily-move-down';
        downBtn.textContent = '↓';
        downBtn.disabled = i === fontList.length - 1;
        downBtn.addEventListener('click', () => opts.onReorderFont?.(i, i + 1));
        row.appendChild(downBtn);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'stb-facet-fontfamily-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => opts.onRemoveFont?.(i));
        row.appendChild(removeBtn);

        leavesEl.appendChild(row);
      });

      const fontFooter = document.createElement('div');
      fontFooter.className = 'stb-facet-fontfamily-footer';
      const addFontBtn = document.createElement('button');
      addFontBtn.type = 'button';
      addFontBtn.className = 'stb-facet-fontfamily-add';
      addFontBtn.textContent = '+ font';
      addFontBtn.addEventListener('click', () => opts.onAddFont?.({ literal: '' }));
      fontFooter.appendChild(addFontBtn);
      leavesEl.appendChild(fontFooter);
    }

    // Spacing tuples — a kind-2 positional tuple (T/R/B/L padding/margin, row/column
    // gap) rather than a single FacetValue leaf, so it's not in FACET_PROPS/props and
    // is rendered here explicitly rather than through the per-key leaf loop below.
    if (g === 'spacing') {
      const spacingFacet = opts.facets.spacing ?? {};

      const sideRow = (group: 'padding' | 'margin', label: string) => {
        const row = document.createElement('div');
        row.className = 'stb-facet-spacing-row';
        row.dataset.stbSpacingGroup = group;
        const lab = document.createElement('span');
        lab.className = 'stb-facet-leaf-label';
        lab.textContent = label;
        row.appendChild(lab);
        const sides = ['top', 'right', 'bottom', 'left'] as const;
        for (const side of sides) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'stb-facet-spacing-side';
          input.dataset.stbSide = side;
          input.placeholder = side[0]!.toUpperCase();
          const current = spacingFacet[group]?.[side];
          if (current && 'literal' in current && typeof current.literal === 'string') {
            input.value = current.literal;
          }
          input.addEventListener('input', () => opts.onSetSide?.(group, side, { literal: input.value }));
          row.appendChild(input);
        }
        leavesEl.appendChild(row);
      };
      sideRow('padding', 'padding');
      sideRow('margin', 'margin');

      const gapRow = document.createElement('div');
      gapRow.className = 'stb-facet-spacing-row';
      gapRow.dataset.stbSpacingGroup = 'gap';
      const gapLab = document.createElement('span');
      gapLab.className = 'stb-facet-leaf-label';
      gapLab.textContent = 'gap';
      gapRow.appendChild(gapLab);
      for (const slot of ['row', 'column'] as const) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'stb-facet-spacing-gap';
        input.dataset.stbSlot = slot;
        input.placeholder = slot[0]!.toUpperCase();
        const current = spacingFacet.gap?.[slot];
        if (current && 'literal' in current && typeof current.literal === 'string') {
          input.value = current.literal;
        }
        input.addEventListener('input', () => opts.onSetGap?.(slot, { literal: input.value }));
        gapRow.appendChild(input);
      }
      leavesEl.appendChild(gapRow);
    }

    for (const [key, spec] of props) {
      const leaf = document.createElement('div');
      leaf.className = 'stb-facet-leaf';
      leaf.dataset.key = key;
      const lab = document.createElement('span');
      lab.className = 'stb-facet-leaf-label';
      lab.textContent = spec.cssProp;
      leaf.appendChild(lab);

      const propName = key.split('.')[1]!;
      const current = (opts.facets[g] as Record<string, FacetValue | undefined>)?.[propName];

      if (spec.isColor) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stb-facet-swatch';
        const lit = current && 'literal' in current && typeof current.literal === 'object'
          ? current.literal as Oklch
          : null;
        if (lit) btn.style.backgroundColor = oklchToHex(lit);
        btn.addEventListener('click', () => openColorPicker({
          previewHost: opts.previewHost,
          initial: lit ? oklchToHex(lit) : '#000000',
          // Value is stored as Oklch, but the picker's text field shows the format
          // chosen in the top bar (hex/rgb/oklch) so the editor tracks that setting.
          format: opts.colorFormat?.() ?? 'hex',
          onChange: (value) => opts.onEdit(key, { literal: toOklch(value) }),
        }));
        leaf.appendChild(btn);

        // Dark counterpart, always rendered beside the light swatch (locked layout: light, dark, derive).
        const currentDark = (opts.darkFacets?.[g] as Record<string, FacetValue | undefined>)?.[propName];
        const litDark = currentDark && 'literal' in currentDark && typeof currentDark.literal === 'object'
          ? currentDark.literal as Oklch
          : null;
        const darkBtn = document.createElement('button');
        darkBtn.type = 'button';
        darkBtn.className = 'stb-facet-swatch-dark';
        if (litDark) {
          darkBtn.style.backgroundColor = oklchToHex(litDark);
        } else {
          // No dark literal set — neutral empty state, NOT a computed color: means
          // "inherits the snapshot's built-in dark", not "dark equals black/transparent".
          darkBtn.classList.add('stb-facet-swatch-empty');
        }
        darkBtn.addEventListener('click', () => openColorPicker({
          previewHost: opts.previewHost,
          initial: litDark ? oklchToHex(litDark) : '#000000',
          format: opts.colorFormat?.() ?? 'hex',
          onChange: (value) => opts.onDarkEdit?.(key, { literal: toOklch(value) }),
        }));
        leaf.appendChild(darkBtn);

        const deriveBtn = document.createElement('button');
        deriveBtn.type = 'button';
        deriveBtn.className = 'stb-facet-derive-dark';
        deriveBtn.textContent = '↓';
        deriveBtn.title = 'Derive dark from light';
        // No literal Oklch on the light side (e.g. a bare token reference) — nothing to derive from.
        deriveBtn.disabled = !lit;
        deriveBtn.addEventListener('click', () => { if (lit) opts.deriveDark?.(key); });
        leaf.appendChild(deriveBtn);
      } else if (key === 'text.fontWeight') {
        const sel = document.createElement('select');
        const options = FONT_WEIGHTS;
        for (const o of options) {
          const opt = document.createElement('option');
          opt.value = o;
          opt.textContent = o;
          sel.appendChild(opt);
        }
        if (current && 'literal' in current) sel.value = String(current.literal);
        sel.addEventListener('change', () => opts.onEdit(key, { literal: sel.value }));
        leaf.appendChild(sel);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        if (current && 'literal' in current && typeof current.literal === 'string') {
          input.value = current.literal;
        }
        input.addEventListener('input', () => opts.onEdit(key, { literal: input.value }));
        leaf.appendChild(input);
      }

      // Scope indicator: shared badge + detach for token values; promote for promotable literals
      const defaultLiteralFor = (s: typeof spec): FacetValue =>
        s.isColor ? { literal: { l: 0, c: 0, h: 0 } } : { literal: '' };
      if (current && 'token' in current) {
        const badge = document.createElement('span');
        badge.className = 'stb-facet-shared';
        badge.textContent = 'shared';
        badge.title = `token ${current.token} (changes everywhere)`;
        const detach = document.createElement('button');
        detach.type = 'button';
        detach.className = 'stb-facet-detach';
        detach.textContent = 'detach';
        detach.addEventListener('click', () =>
          opts.onEdit(key, opts.resolveLiteral ? opts.resolveLiteral(key, current.token) : defaultLiteralFor(spec)),
        );
        leaf.append(badge, detach);
      } else if (current && 'literal' in current && opts.tokenForKey?.(key)) {
        const promote = document.createElement('button');
        promote.type = 'button';
        promote.className = 'stb-facet-promote';
        promote.textContent = 'promote';
        promote.addEventListener('click', () => opts.onEdit(key, { token: opts.tokenForKey!(key)! }));
        leaf.appendChild(promote);
      }

      // Track focused group for isolate
      leaf.addEventListener('focusin', () => { focusedGroup = g; });

      leavesEl.appendChild(leaf);
    }
  }

  // Expand/Collapse all act on the style groups (text/surface/spacing) only.
  // The content/asset "default group" is a standalone always-on field (the
  // element's payload), so it's deliberately excluded — it has no group header
  // to fold into and is usually the thing you came to edit.
  // TO INCLUDE IT: wrap the content/asset field (rendered via onContentEdit/
  // onAssetEdit) in a collapsible GroupEntry — give it a branch header + a
  // `leaves` container and push it into `groupEntries` — then these two loops
  // (and Isolate) will fold it like any other group. This behaviour could also
  // be exposed as a user preference (include default group: on/off) rather than
  // hardcoded.
  btnExpandAll.addEventListener('click', () => {
    for (const entry of groupEntries) setCollapsed(entry, false);
  });

  btnCollapseAll.addEventListener('click', () => {
    for (const entry of groupEntries) setCollapsed(entry, true);
  });

  btnIsolate.addEventListener('click', () => {
    if (focusedGroup === null) return;
    for (const entry of groupEntries) {
      setCollapsed(entry, entry.group !== focusedGroup);
    }
  });

  return { destroy() { host.innerHTML = ''; } };
}
