import { rootValues, darkValues, requiredTokens } from '@/state/tokens';
import { findMissing } from '@/parse/completeness';
import { buildBundle } from '@/export/bundle-builder';
import { bundleToZip, triggerDownload } from '@/export/zip';

export function openExportDialog(): void {
  const existing = document.getElementById('stb-export-dialog');
  if (existing) existing.remove();

  const missing = findMissing(requiredTokens(), rootValues.value, darkValues.value);

  const dialog = document.createElement('dialog');
  dialog.id = 'stb-export-dialog';

  const missingHtml = (label: string, items: string[]) =>
    items.length === 0
      ? `<p class="ok">${label}: complete.</p>`
      : `<details open><summary class="warn">${label}: ${items.length} missing</summary><ul>${items.map((t) => `<li><code>${escapeHtml(t)}</code></li>`).join('')}</ul></details>`;

  dialog.innerHTML = `
    <article>
      <h2>Export theme</h2>
      <label>Theme name: <input id="stb-export-name" value="My theme" /></label>
      <label>ID: <input id="stb-export-id" value="my-theme" /></label>
      ${missingHtml(':root', missing.root)}
      ${missingHtml('.dark-theme', missing.dark)}
      <footer>
        <button id="stb-cancel">Cancel</button>
        <button id="stb-confirm-export">Export bundle</button>
      </footer>
    </article>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('#stb-cancel')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('#stb-confirm-export')!.addEventListener('click', async () => {
    const name = (dialog.querySelector('#stb-export-name') as HTMLInputElement).value || 'theme';
    const id = (dialog.querySelector('#stb-export-id') as HTMLInputElement).value || 'theme';
    const bundle = buildBundle({
      name, id, description: '',
      root: rootValues.value,
      dark: darkValues.value,
      assets: [], // assets UI is Task 22
    });
    const zip = await bundleToZip(bundle);
    triggerDownload(zip, `${id}.zip`);
    dialog.close();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
