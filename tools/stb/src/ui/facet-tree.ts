// src/ui/facet-tree.ts
import type { Facets, FacetValue } from '@/metadata/types';
import type { Oklch } from '@/color/oklch';
import { toOklch, oklchToHex } from '@/color/oklch';
import { FACET_PROPS } from '@/metadata/facets';
import { openColorPicker } from '@/ui/color-picker';
import { mountCssEditor } from '@/ui/css-editor';

const GROUPS = ['text', 'surface', 'spacing'] as const;
const propsOf = (g: string) => Object.entries(FACET_PROPS).filter(([k]) => k.startsWith(g + '.'));

export interface FacetTreeOptions {
  facets: Facets;
  previewHost: HTMLElement;
  onEdit: (key: string, value: FacetValue) => void;
  scopedBlock?: string;
  onScopedBlockChange?: (css: string) => void;
  onAddGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  onRemoveGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  /** Returns the token name mapped to this element's property, or null if none. */
  tokenForKey?: (key: string) => string | null;
  /** Resolves the literal FacetValue to detach TO (token's current value). */
  resolveLiteral?: (key: string, token: string) => FacetValue;
}

const FONT_FAMILIES = [
  'inherit',
  'system-ui',
  'Arial, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
];
const FONT_WEIGHTS = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

interface GroupEntry {
  group: string;
  branch: HTMLElement;
  leaves: HTMLElement;
  collapsed: boolean;
}

function setCollapsed(entry: GroupEntry, collapsed: boolean): void {
  entry.collapsed = collapsed;
  entry.branch.classList.toggle('stb-facet-collapsed', collapsed);
  entry.leaves.hidden = collapsed;
}

export function mountFacetTree(host: HTMLElement, opts: FacetTreeOptions): { destroy(): void } {
  host.classList.add('stb-facet-tree');
  host.innerHTML = '';
  let scoped: ReturnType<typeof mountCssEditor> | null = null;
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

    for (const [key, spec] of propsOf(g)) {
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
          // NOTE: hex is deliberate — value is stored as Oklch regardless of picker display format,
          // so threading the live color-format signal buys nothing here.
          format: 'hex',
          onChange: (value) => opts.onEdit(key, { literal: toOklch(value) }),
        }));
        leaf.appendChild(btn);
      } else if (key === 'text.fontFamily' || key === 'text.fontWeight') {
        const sel = document.createElement('select');
        const options = key === 'text.fontWeight' ? FONT_WEIGHTS : FONT_FAMILIES;
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
        badge.title = `token --${current.token} (changes everywhere)`;
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

  if (opts.onScopedBlockChange) {
    const branch = document.createElement('div');
    branch.className = 'stb-facet-group';
    branch.textContent = 'Scoped CSS';
    host.appendChild(branch);
    const editorHost = document.createElement('div');
    host.appendChild(editorHost);
    scoped = mountCssEditor(editorHost, opts.scopedBlock ?? '', opts.onScopedBlockChange);
  }

  return { destroy() { scoped?.destroy(); host.innerHTML = ''; } };
}
