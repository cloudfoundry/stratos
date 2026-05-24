import { effect } from '@preact/signals-core';
import { assets, setAsset, clearAsset } from '@/state/assets';

export function mountAssetManager(host: HTMLElement): void {
  host.classList.add('stb-asset-manager');
  host.innerHTML = `<h4>Assets</h4><div class="stb-asset-rows"></div>`;
  const rows = host.querySelector('.stb-asset-rows') as HTMLElement;

  effect(() => {
    rows.innerHTML = assets.value.map((a) => `
      <div class="stb-asset-row" data-asset="${a.name}">
        <span class="stb-asset-name">${a.name}</span>
        <span class="stb-asset-file">${a.filename ?? '(none)'}</span>
        <button class="stb-asset-upload">Upload</button>
        ${a.blob ? `<button class="stb-asset-clear">Clear</button>` : ''}
      </div>
    `).join('');
  });

  rows.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest<HTMLElement>('.stb-asset-row');
    if (!row) return;
    const name = row.dataset.asset as 'logo' | 'favicon';
    if (target.classList.contains('stb-asset-upload')) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) setAsset(name, file, file.name);
      });
      input.click();
    } else if (target.classList.contains('stb-asset-clear')) {
      clearAsset(name);
    }
  });
}
