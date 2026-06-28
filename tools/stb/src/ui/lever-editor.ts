import type { LeverValue } from '@/metadata/types';
import { toOklch, oklchToHex } from '@/color/oklch';
import { setBrandingAsset, assetRefFor } from '@/state/branding-assets';

export interface OpenLeverEditorOptions {
  anchor: HTMLElement;
  snapshotId: string;
  value: LeverValue;
  onChange: (next: LeverValue) => void;
  onClose?: () => void;
  visibilityCompanion?: { shown: boolean; onChange: (shown: boolean) => void };
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
function closeOpen(): void {
  if (openPanel) { openPanel.remove(); openPanel = null; }
}

export function openLeverEditor(opts: OpenLeverEditorOptions): void {
  closeOpen();
  const panel = document.createElement('div');
  panel.className = 'stb-lever-editor';
  const rect = opts.anchor.getBoundingClientRect();
  panel.style.position = 'absolute';
  panel.style.top = `${rect.bottom + window.scrollY + 4}px`;
  panel.style.left = `${rect.left + window.scrollX}px`;

  const v = opts.value;
  if (v.kind === 'color') {
    panel.innerHTML = `<input type="color" class="stb-lever-color" value="${initialColorHex(v)}" />`;
    panel.querySelector<HTMLInputElement>('.stb-lever-color')!
      .addEventListener('input', (e) => opts.onChange(colorValueFromHex((e.target as HTMLInputElement).value)));
  } else if (v.kind === 'content') {
    const ta = document.createElement('textarea');
    ta.className = 'stb-lever-text';
    ta.rows = 2;
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

  const close = document.createElement('button');
  close.className = 'stb-lever-close';
  close.textContent = 'Close';
  close.addEventListener('click', () => { closeOpen(); opts.onClose?.(); });
  panel.appendChild(close);

  document.body.appendChild(panel);
  openPanel = panel;
}
