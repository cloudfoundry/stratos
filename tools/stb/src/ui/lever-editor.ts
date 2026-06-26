import type { LeverValue } from '@/metadata/types';
import { toOklch, oklchToHex } from '@/color/oklch';
import { setAsset } from '@/state/assets';

export interface OpenLeverEditorOptions {
  anchor: HTMLElement;
  value: LeverValue;
  onChange: (next: LeverValue) => void;
  onClose?: () => void;
}

export function colorValueFromHex(hex: string): LeverValue {
  return { kind: 'color', oklch: toOklch(hex) };
}
export function contentValue(text: string): LeverValue {
  return { kind: 'content', text };
}
export function visibilityValue(shown: boolean): LeverValue {
  return { kind: 'visibility', shown };
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
  } else if (v.kind === 'visibility') {
    panel.innerHTML = `<label><input type="checkbox" class="stb-lever-toggle" ${v.shown ? 'checked' : ''} /> shown</label>`;
    panel.querySelector<HTMLInputElement>('.stb-lever-toggle')!
      .addEventListener('change', (e) => opts.onChange(visibilityValue((e.target as HTMLInputElement).checked)));
  } else {
    panel.innerHTML = `<input type="file" accept="image/*" class="stb-lever-asset" />`;
    panel.querySelector<HTMLInputElement>('.stb-lever-asset')!
      .addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setAsset('logo', file, file.name); // ponytail: assets signal currently keys logo/favicon; login bg reuses the blob path by filename
        opts.onChange(assetValue(file.name));
      });
  }

  const close = document.createElement('button');
  close.className = 'stb-lever-close';
  close.textContent = 'Close';
  close.addEventListener('click', () => { closeOpen(); opts.onClose?.(); });
  panel.appendChild(close);

  document.body.appendChild(panel);
  openPanel = panel;
}
