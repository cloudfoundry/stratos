import type { LeverValue, Facets, FacetValue } from '@/metadata/types';
import type { EditorView } from 'codemirror';
import { toOklch, oklchToHex } from '@/color/oklch';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';
import { mountCssEditor } from '@/ui/css-editor';
import { mountFacetTree } from '@/ui/facet-tree';
import { positionInPreviewGutter, makeDraggable } from '@/ui/popover';

export interface OpenLeverEditorOptions {
  previewHost: HTMLElement;
  snapshotId: string;
  value: LeverValue;
  onChange: (next: LeverValue) => void;
  onClose?: () => void;
  visibilityCompanion?: { shown: boolean; onChange: (shown: boolean) => void };
  scopedBlock?: string | undefined;
  onScopedBlockChange?: (css: string) => void;
  facets?: Facets;
  onFacetEdit?: (key: string, value: FacetValue) => void;
}

export function colorValueFromHex(hex: string): LeverValue {
  return { kind: 'color', oklch: toOklch(hex) };
}
export function contentValue(text: string): LeverValue {
  return { kind: 'content', text };
}
export function assetValue(filename: string): LeverValue {
  return { kind: 'asset', ref: filename };
}
export function initialColorHex(v: LeverValue): string {
  return v.kind === 'color' ? oklchToHex(v.oklch) : '#000000';
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

  const v = opts.value;
  if (v.kind === 'color') {
    panel.innerHTML = `<input type="color" class="stb-lever-color" value="${initialColorHex(v)}" />`;
    panel.querySelector<HTMLInputElement>('.stb-lever-color')!
      .addEventListener('input', (e) => opts.onChange(colorValueFromHex((e.target as HTMLInputElement).value)));
  } else if (v.kind === 'content') {
    const ta = document.createElement('textarea');
    ta.className = 'stb-lever-text';
    ta.rows = 5;
    ta.value = v.text;
    ta.addEventListener('input', (e) => opts.onChange(contentValue((e.target as HTMLTextAreaElement).value)));
    panel.appendChild(ta);
  } else {
    panel.innerHTML = `<label class="stb-lever-asset-label">Upload image <input type="file" accept="image/*" class="stb-lever-asset" /></label>`;
    panel.querySelector<HTMLInputElement>('.stb-lever-asset')!
      .addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setBrandingAsset(opts.snapshotId, file, file.name);
        opts.onChange(assetValue(assetRefFor(file.name)));
      });
  }

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

  if (opts.facets) {
    const treeHost = document.createElement('div');
    panel.appendChild(treeHost);
    openFacetTree = mountFacetTree(treeHost, {
      facets: opts.facets,
      previewHost: opts.previewHost,
      onEdit: opts.onFacetEdit ?? (() => {}),
    });
  }

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
