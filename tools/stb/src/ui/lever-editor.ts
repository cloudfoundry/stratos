import type { LeverValue, Facets, FacetValue } from '@/metadata/types';
import type { EditorView } from 'codemirror';
import { effect } from '@preact/signals-core';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';
import { brandingModel, nodeFor } from '@/state/branding';
import { mountCssEditor } from '@/ui/css-editor';
import { mountFacetTree } from '@/ui/facet-tree';
import { positionInPreviewGutter, makeDraggable } from '@/ui/popover';
import { previewDark } from '@/state/scene';

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
  onAddGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  onRemoveGroup?: (g: 'text' | 'surface' | 'spacing') => void;
  tokenForKey?: (key: string) => string | null;
  resolveLiteral?: (key: string, token: string) => FacetValue;
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
      onContentEdit: (text: string) => opts.onChange(contentValue(text)),
      onAssetEdit: (file: File) => { setBrandingAsset(opts.snapshotId, file, file.name); opts.onChange(assetValue(assetRefFor(file.name))); },
    });
  }
  openTreeEffect = effect(() => {
    void brandingModel.value;                         // subscribe to model changes
    if (treeHost.contains(document.activeElement)) return; // don't yank focus from an in-flight edit
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
  positionInPreviewGutter(panel, opts.previewHost);
  makeDraggable(panel, drag);
  openPanel = panel;

  // Flag the active preview mode on the panel so CSS can mute the inactive
  // (dark) column — editing a dark value while the preview is in light mode
  // otherwise reads as "no change".
  openDarkEffect = effect(() => { panel.classList.toggle('stb-preview-dark', previewDark.value); });
}
