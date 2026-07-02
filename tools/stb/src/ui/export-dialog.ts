import { rootValues, darkValues, requiredTokens } from '@/state/tokens';
import { findMissing } from '@/parse/completeness';
import { buildBundle, type AssetInput, type BuildBundleInput } from '@/export/bundle-builder';
import { bundleToZip, triggerDownload } from '@/export/zip';
import { assets } from '@/state/assets';
import { brandingAssets, brandingAssetInputs } from '@/state/branding-assets';
import { project, type RoutingMap } from '@/projection/projector';
import { emitScopedBlocks } from '@/parse/css-emitter';
import type { BrandingModel } from '@/metadata/types';
import { brandingModel } from '@/state/branding';
import { activeSceneId } from '@/state/scene';

export function exportInputs(
  model: BrandingModel | null,
  routing: RoutingMap,
  root: Map<string, string>,
  dark: Map<string, string>,
  assets: AssetInput[],
): Omit<BuildBundleInput, 'name' | 'id' | 'description'> {
  const merged = new Map(root);
  let companyConfig: Record<string, unknown> | undefined;
  let scopedCss: string | undefined;
  if (model) {
    const r = project(model, routing);
    for (const [k, v] of r.tokens) merged.set(k, v);
    companyConfig = r.companyConfig;
    // Deliberately NOT run through rewriteAssetUrls (preview-pane.ts's blob: URL rewrite):
    // the exported bundle ships real asset files at their `assets/<file>` paths, so raw
    // refs are correct here — a blob: URL would be invalid outside this session's iframe.
    scopedCss = emitScopedBlocks(model.nodes) || undefined;
  }
  return {
    root: merged,
    dark,
    assets,
    ...(companyConfig !== undefined ? { companyConfig } : {}),
    ...(scopedCss ? { scopedCss } : {}),
  };
}

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
    const assetInputs = [
      ...assets.value.filter((a) => a.blob).map((a) => ({
        path: a.name === 'favicon' ? 'assets/favicon.svg' : `assets/${a.filename}`,
        blob: a.blob!,
      })),
      ...brandingAssetInputs(brandingAssets.value),
    ];
    let routing: RoutingMap = { elements: {} };
    try {
      const res = await fetch(`/snapshots/v1/${activeSceneId.value}/routing.json`);
      if (res.ok) routing = await res.json();
    } catch { /* no routing → export tokens/assets only, no company-config */ }
    const bundle = buildBundle({
      name, id, description: '',
      ...exportInputs(brandingModel.value, routing, rootValues.value, darkValues.value, assetInputs),
    });
    const zip = await bundleToZip(bundle);
    triggerDownload(zip, `${id}.zip`);
    dialog.close();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
