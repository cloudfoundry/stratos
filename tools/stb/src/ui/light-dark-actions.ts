import { rootValues, darkValues } from '@/state/tokens';
import { previewDark } from '@/state/scene';

export function mountLightDarkActions(host: HTMLElement): void {
  host.classList.add('stb-light-dark-actions');
  host.innerHTML = `
    <label class="stb-mode-toggle">
      <input type="checkbox" id="stb-preview-dark" /> Dark preview
    </label>
    <button id="stb-copy-light-to-dark">Copy light → dark</button>
    <button id="stb-copy-dark-to-light">Copy dark → light</button>
  `;

  const cb = host.querySelector<HTMLInputElement>('#stb-preview-dark')!;
  cb.addEventListener('change', () => { previewDark.value = cb.checked; });

  host.querySelector('#stb-copy-light-to-dark')!.addEventListener('click', () => {
    if (!confirm('Replace all dark-mode values with current light values?')) return;
    darkValues.value = new Map(rootValues.value);
  });
  host.querySelector('#stb-copy-dark-to-light')!.addEventListener('click', () => {
    if (!confirm('Replace all light-mode values with current dark values?')) return;
    rootValues.value = new Map(darkValues.value);
  });
}
