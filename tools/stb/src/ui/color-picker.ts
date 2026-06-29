import { parseColor, formatColor, type ColorFormat } from '@/color/format';
import { positionInPreviewGutter } from '@/ui/popover';

export interface OpenColorPickerOptions {
  previewHost: HTMLElement;
  initial: string;
  format: ColorFormat;
  onChange: (newValue: string) => void;
  onClose?: () => void;
}

export function openColorPicker(opts: OpenColorPickerOptions): void {
  closeOpenPicker();

  const panel = document.createElement('div');
  panel.className = 'stb-color-picker';
  panel.id = 'stb-color-picker-active';

  const initialParsed = parseColor(opts.initial);
  const initialHex = initialParsed ? formatColor(initialParsed, 'hex') : '#000000';

  panel.innerHTML = `
    <div class="stb-color-picker__row">
      <input type="color" class="stb-color-native" value="${initialHex}" />
      <input type="text" class="stb-color-text" value="${opts.initial}" />
    </div>
    <div class="stb-color-picker__row">
      <button class="stb-close">Close</button>
    </div>
  `;

  document.body.appendChild(panel);
  positionInPreviewGutter(panel, opts.previewHost);

  const native = panel.querySelector<HTMLInputElement>('.stb-color-native')!;
  const text = panel.querySelector<HTMLInputElement>('.stb-color-text')!;
  const close = panel.querySelector<HTMLButtonElement>('.stb-close')!;

  native.addEventListener('input', () => {
    const c = parseColor(native.value);
    if (!c) return;
    const out = formatColor(c, opts.format);
    text.value = out;
    opts.onChange(out);
  });

  text.addEventListener('input', () => {
    const c = parseColor(text.value);
    if (!c) return;
    native.value = formatColor(c, 'hex');
    opts.onChange(text.value);
  });

  close.addEventListener('click', () => {
    closeOpenPicker();
    opts.onClose?.();
  });

  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler, { once: false });
  }, 0);

  function outsideClickHandler(e: MouseEvent) {
    if (!(e.target instanceof Node)) return;
    if (panel.contains(e.target)) return;
    closeOpenPicker();
    opts.onClose?.();
    document.removeEventListener('click', outsideClickHandler);
  }
}

export function closeOpenPicker(): void {
  document.getElementById('stb-color-picker-active')?.remove();
}
