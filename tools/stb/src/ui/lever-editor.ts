import type { LeverValue, Facets, FacetValue } from '@/metadata/types';
import type { EditorView } from 'codemirror';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';
import { mountCssEditor } from '@/ui/css-editor';
import { mountFacetTree } from '@/ui/facet-tree';
import { positionInPreviewGutter, makeDraggable } from '@/ui/popover';
import { darkView } from '@/state/facets-edit';

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
function closeOpen(): void {
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

  let editTarget: 'light' | 'dark' = 'light';

  const targetBar = document.createElement('div');
  targetBar.className = 'stb-lever-target';
  for (const mode of ['light', 'dark'] as const) {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'stb-edit-target';
    radio.value = mode;
    radio.checked = mode === editTarget;
    radio.addEventListener('change', () => { if (radio.checked) { editTarget = mode; renderTree(); } });
    label.append(radio, ` ${mode}`);
    targetBar.appendChild(label);
  }
  panel.appendChild(targetBar);

  function renderTree(): void {
    if (openFacetTree) { openFacetTree.destroy(); openFacetTree = null; }
    const dark = editTarget === 'dark';
    openFacetTree = mountFacetTree(treeHost, {
      facets: dark ? darkView(opts.facets, opts.facetsDark ?? {}) : opts.facets,
      previewHost: opts.previewHost,
      onEdit: dark ? (opts.onFacetEditDark ?? (() => {})) : (opts.onFacetEdit ?? (() => {})),
      // Structural edits + token promote/detach + content/asset live on the light bundle only.
      ...(!dark && opts.onAddGroup ? { onAddGroup: opts.onAddGroup } : {}),
      ...(!dark && opts.onRemoveGroup ? { onRemoveGroup: opts.onRemoveGroup } : {}),
      ...(!dark && opts.tokenForKey ? { tokenForKey: opts.tokenForKey } : {}),
      ...(!dark && opts.resolveLiteral ? { resolveLiteral: opts.resolveLiteral } : {}),
      ...(!dark ? { onContentEdit: (text: string) => opts.onChange(contentValue(text)) } : {}),
      ...(!dark ? { onAssetEdit: (file: File) => { setBrandingAsset(opts.snapshotId, file, file.name); opts.onChange(assetValue(assetRefFor(file.name))); } } : {}),
    });
  }
  renderTree();

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
}
