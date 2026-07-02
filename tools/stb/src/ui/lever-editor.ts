import type { LeverValue, Facets, FacetValue, Layer } from '@/metadata/types';
import type { EditorView } from 'codemirror';
import { effect } from '@preact/signals-core';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';
import { brandingModel, nodeFor } from '@/state/branding';
import { mountCssEditor } from '@/ui/css-editor';
import { mountFacetTree } from '@/ui/facet-tree';
import { positionInPreviewGutter, makeDraggable } from '@/ui/popover';
import { previewDark, compareMode } from '@/state/scene';

export interface OpenLeverEditorOptions {
  previewHost: HTMLElement;
  snapshotId: string;
  onChange: (next: LeverValue) => void;
  onClose?: () => void;
  visibilityCompanion?: { shown: boolean; onChange: (shown: boolean) => void };
  scopedBlock?: string | undefined;
  onScopedBlockChange?: (css: string) => void;
  facets: Facets;
  facetsDark?: Facets;
  onFacetEdit?: (key: string, value: FacetValue) => void;
  onFacetEditDark?: (key: string, value: FacetValue) => void;
  /** Per-row "derive dark from light" — caller computes deriveDarkOklch and routes it through its own dark-edit path. */
  deriveDark?: (key: string) => void;
  /** 'background' is addable but deliberately not removable — see the matching note in facet-tree.ts. */
  onAddGroup?: (g: 'text' | 'surface' | 'spacing' | 'background') => void;
  onRemoveGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  tokenForKey?: (key: string) => string | null;
  resolveLiteral?: (key: string, token: string) => FacetValue;
  /** Live color-format accessor, forwarded to the facet tree's color pickers. */
  colorFormat?: () => import('@/color/format').ColorFormat;
  /** Background composite (Task 8/9), forwarded to the facet tree's background stack editor. */
  onBackstop?: (value: FacetValue) => void;
  onAddLayer?: (layer: Layer) => void;
  onSetLayer?: (index: number, layer: Layer) => void;
  /** Dark-mode counterpart of onSetLayer, forwarded to the facet tree's gradient-stop dark axis. */
  onSetLayerDark?: (index: number, layer: Layer) => void;
  onRemoveLayer?: (index: number) => void;
  onReorderLayer?: (from: number, to: number) => void;
  /** Font-family fallback list (Task 10), forwarded to the facet tree's ordered-list editor. */
  onAddFont?: (value: FacetValue) => void;
  onSetFont?: (index: number, value: FacetValue) => void;
  onRemoveFont?: (index: number) => void;
  onReorderFont?: (from: number, to: number) => void;
  /** Spacing composite (Task 11), forwarded to the facet tree's T/R/B/L + row/column tuple editor. */
  onSetSide?: (group: 'padding' | 'margin', side: 'top' | 'right' | 'bottom' | 'left', value: FacetValue) => void;
  onSetGap?: (slot: 'row' | 'column', value: FacetValue) => void;
}

export function contentValue(text: string): LeverValue {
  return { kind: 'content', text };
}
export function assetValue(filename: string): LeverValue {
  return { kind: 'asset', ref: filename };
}

let openPanel: HTMLElement | null = null;
let openScopedEditor: EditorView | null = null;
let openFacetTree: { destroy(): void } | null = null;
let openTreeEffect: (() => void) | null = null;
let openDarkEffect: (() => void) | null = null;
function closeOpen(): void {
  if (openDarkEffect) { openDarkEffect(); openDarkEffect = null; }
  if (openTreeEffect) { openTreeEffect(); openTreeEffect = null; }
  if (openFacetTree) { openFacetTree.destroy(); openFacetTree = null; }
  if (openScopedEditor) { openScopedEditor.destroy(); openScopedEditor = null; }
  if (openPanel) { openPanel.remove(); openPanel = null; }
}

export function openLeverEditor(opts: OpenLeverEditorOptions): void {
  closeOpen();
  const panel = document.createElement('div');
  panel.className = 'stb-lever-editor';

  // Title bar: name what's being edited (the popover is decoupled from the
  // tree selection, so without this you can't tell which element it targets).
  const titledNode = nodeFor(opts.snapshotId);
  const title = document.createElement('div');
  title.className = 'stb-lever-title';
  title.textContent = titledNode?.name ?? opts.snapshotId;
  if (titledNode?.description) title.title = titledNode.description;
  panel.appendChild(title);

  if (opts.visibilityCompanion) {
    const c = opts.visibilityCompanion;
    const label = document.createElement('label');
    label.className = 'stb-lever-companion';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'stb-lever-companion-toggle';
    cb.checked = c.shown;
    cb.addEventListener('change', (e) => c.onChange((e.target as HTMLInputElement).checked));
    label.appendChild(cb);
    label.append(' show');
    panel.appendChild(label);
  }

  if (opts.onScopedBlockChange) {
    const section = document.createElement('div');
    section.className = 'stb-lever-scoped-block';
    const label = document.createElement('div');
    label.className = 'stb-lever-scoped-block-label';
    label.textContent = 'Scoped CSS';
    section.appendChild(label);
    const editorHost = document.createElement('div');
    section.appendChild(editorHost);
    panel.appendChild(section);
    openScopedEditor = mountCssEditor(editorHost, opts.scopedBlock ?? '', opts.onScopedBlockChange);
  }

  const treeHost = document.createElement('div');
  panel.appendChild(treeHost);

  function renderTree(): void {
    if (openFacetTree) { openFacetTree.destroy(); openFacetTree = null; }
    const node = nodeFor(opts.snapshotId);
    const liveFacets = node?.facets ?? opts.facets;
    const liveFacetsDark = node?.facetsDark ?? opts.facetsDark ?? {};
    openFacetTree = mountFacetTree(treeHost, {
      facets: liveFacets,
      darkFacets: liveFacetsDark,
      previewHost: opts.previewHost,
      onEdit: opts.onFacetEdit ?? (() => {}),
      onDarkEdit: opts.onFacetEditDark ?? (() => {}),
      // Structural edits + token promote/detach + content/asset live on the light bundle only.
      ...(opts.deriveDark ? { deriveDark: opts.deriveDark } : {}),
      ...(opts.onAddGroup ? { onAddGroup: opts.onAddGroup } : {}),
      ...(opts.onRemoveGroup ? { onRemoveGroup: opts.onRemoveGroup } : {}),
      ...(opts.tokenForKey ? { tokenForKey: opts.tokenForKey } : {}),
      ...(opts.resolveLiteral ? { resolveLiteral: opts.resolveLiteral } : {}),
      ...(opts.colorFormat ? { colorFormat: opts.colorFormat } : {}),
      ...(opts.onBackstop ? { onBackstop: opts.onBackstop } : {}),
      ...(opts.onAddLayer ? { onAddLayer: opts.onAddLayer } : {}),
      ...(opts.onSetLayer ? { onSetLayer: opts.onSetLayer } : {}),
      ...(opts.onSetLayerDark ? { onSetLayerDark: opts.onSetLayerDark } : {}),
      ...(opts.onRemoveLayer ? { onRemoveLayer: opts.onRemoveLayer } : {}),
      ...(opts.onReorderLayer ? { onReorderLayer: opts.onReorderLayer } : {}),
      ...(opts.onAddFont ? { onAddFont: opts.onAddFont } : {}),
      ...(opts.onSetFont ? { onSetFont: opts.onSetFont } : {}),
      ...(opts.onRemoveFont ? { onRemoveFont: opts.onRemoveFont } : {}),
      ...(opts.onReorderFont ? { onReorderFont: opts.onReorderFont } : {}),
      ...(opts.onSetSide ? { onSetSide: opts.onSetSide } : {}),
      ...(opts.onSetGap ? { onSetGap: opts.onSetGap } : {}),
      onContentEdit: (text: string) => opts.onChange(contentValue(text)),
      onAssetEdit: (file: File) => { setBrandingAsset(assetRefFor(file.name), file, file.name); opts.onChange(assetValue(assetRefFor(file.name))); },
    });
  }
  openTreeEffect = effect(() => {
    void brandingModel.value;                         // subscribe to model changes
    // Don't yank focus from an in-flight TYPED edit (text input / textarea).
    // A focused button (e.g. the derive-dark ↓) must NOT suppress the re-render,
    // or its own swatch would keep the stale value it just changed. Same for a
    // file input: it holds no in-flight text but keeps focus after the native
    // dialog, and its row label must refresh with the chosen ref.
    const ae = document.activeElement;
    const typing = ae && treeHost.contains(ae) &&
      (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && (ae as HTMLInputElement).type !== 'file'));
    if (typing) return;
    renderTree();
  });

  const close = document.createElement('button');
  close.className = 'stb-lever-close';
  close.textContent = 'Close';
  close.addEventListener('click', () => { closeOpen(); opts.onClose?.(); });
  panel.appendChild(close);

  const drag = document.createElement('div');
  drag.className = 'stb-lever-drag';
  drag.textContent = '⠿';
  drag.title = 'Drag to move';
  panel.prepend(drag);

  document.body.appendChild(panel);
  if (compareMode.value) positionAbovePanes(panel, opts.previewHost);
  else positionInPreviewGutter(panel, opts.previewHost);
  makeDraggable(panel, drag);
  openPanel = panel;

  // Flag the active preview mode on the panel so CSS can mute the inactive
  // (dark) column — editing a dark value while the preview is in light mode
  // otherwise reads as "no change".
  openDarkEffect = effect(() => { panel.classList.toggle('stb-preview-dark', previewDark.value); });
}

// Compare-mode initial placement. With two panes splitting the full preview
// width there is NO left gutter at typical widths — the gutter placement would
// fall back to overlaying the light pane dead-centre. So the editor opens
// ABOVE the panes (over the nav band, left-aligned) instead: "left of the
// panes" (the primary choice) degenerates to covering a pane, so the fallback
// position won. Still draggable, as always.
function positionAbovePanes(panel: HTMLElement, previewHost: HTMLElement): void {
  const host = previewHost.getBoundingClientRect();
  const top = Math.max(8, host.top - panel.offsetHeight - 8);
  panel.style.position = 'absolute';
  panel.style.left = `${8 + window.scrollX}px`;
  panel.style.top = `${top + window.scrollY}px`;
}
