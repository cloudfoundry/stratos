import { effect } from '@preact/signals-core';
import { rootValues, darkValues, requiredTokens } from '@/state/tokens';
import { findMissing } from '@/parse/completeness';

export interface StatusBarOptions {
  onFormatChange?: (fmt: 'hex' | 'rgb' | 'oklch') => void;
}

export function mountStatusBar(host: HTMLElement, opts: StatusBarOptions = {}): void {
  host.classList.add('stb-status-bar');
  host.innerHTML = `
    <span class="stb-status-completeness"></span>
    <span class="stb-status-spacer"></span>
    <label>Color format:
      <select id="stb-color-format">
        <option value="hex">hex</option>
        <option value="rgb">rgb</option>
        <option value="oklch">oklch</option>
      </select>
    </label>
  `;

  const fmtSelect = host.querySelector<HTMLSelectElement>('#stb-color-format')!;
  fmtSelect.addEventListener('change', () => opts.onFormatChange?.(fmtSelect.value as 'hex' | 'rgb' | 'oklch'));

  const completenessEl = host.querySelector<HTMLElement>('.stb-status-completeness')!;
  effect(() => {
    const m = findMissing(requiredTokens(), rootValues.value, darkValues.value);
    const total = m.root.length + m.dark.length;
    completenessEl.textContent = total === 0
      ? 'Complete'
      : `${total} missing tokens (root: ${m.root.length}, dark: ${m.dark.length})`;
    completenessEl.classList.toggle('warn', total > 0);
  });
}
