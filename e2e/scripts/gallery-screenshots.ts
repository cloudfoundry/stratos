#!/usr/bin/env tsx
/**
 * Generate an HTML gallery from a single screenshot set.
 * Shows light and dark mode side by side for each page.
 *
 * Usage: bunx tsx e2e/scripts/gallery-screenshots.ts <label>
 * Example: bunx tsx e2e/scripts/gallery-screenshots.ts dev46
 */

import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve('e2e-screenshots');

function getLabel(): string {
  const label = process.argv[2];
  if (!label) {
    console.error('Usage: bunx tsx e2e/scripts/gallery-screenshots.ts <label>');
    console.error('Example: bunx tsx e2e/scripts/gallery-screenshots.ts dev46');
    process.exit(1);
  }
  return label;
}

function listScreenshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
}

function toBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

function generateGallery(
  label: string,
  pages: Array<{ name: string; lightB64: string | null; darkB64: string | null }>
): string {
  const cards = pages.map(p => {
    const lightImg = p.lightB64
      ? `<img src="data:image/png;base64,${p.lightB64}" class="screenshot" onclick="showFull(this.src)">`
      : `<div class="missing">No light screenshot</div>`;
    const darkImg = p.darkB64
      ? `<img src="data:image/png;base64,${p.darkB64}" class="screenshot" onclick="showFull(this.src)">`
      : `<div class="missing">No dark screenshot</div>`;

    return `
    <div class="page-card">
      <h3>${p.name}</h3>
      <div class="pair">
        <div class="mode">
          <div class="mode-label">Light</div>
          ${lightImg}
        </div>
        <div class="mode">
          <div class="mode-label">Dark</div>
          ${darkImg}
        </div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Stratos Visual Gallery: ${label}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui; margin: 0; padding: 20px; background: #f1f5f9; color: #1e293b; }
    h1 { margin-bottom: 4px; }
    .meta { color: #64748b; margin-bottom: 24px; }
    .page-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px;
                 border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .page-card h3 { margin: 0 0 12px; font-size: 18px; color: #334155; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .mode-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
                  color: #94a3b8; margin-bottom: 8px; }
    .screenshot { width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;
                  transition: transform 0.2s; }
    .screenshot:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .missing { padding: 40px; text-align: center; color: #94a3b8; background: #f8fafc;
               border: 1px dashed #e2e8f0; border-radius: 6px; }
    #overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
               background: rgba(0,0,0,0.92); z-index: 100; cursor: pointer; overflow: auto; }
    #overlay img { max-width: 95%; margin: 20px auto; display: block; }
    @media (max-width: 900px) { .pair { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Stratos Visual Gallery</h1>
  <div class="meta">${label} &mdash; ${pages.length} pages &mdash; ${new Date().toISOString().slice(0, 10)}</div>
  ${cards}
  <div id="overlay" onclick="this.style.display='none'"><img id="fullImg"></div>
  <script>
    function showFull(src) {
      document.getElementById('fullImg').src = src;
      document.getElementById('overlay').style.display = 'block';
    }
  </script>
</body>
</html>`;
}

// Main
const label = getLabel();
const lightDir = path.join(SCREENSHOT_DIR, `${label}-light`);
const darkDir = path.join(SCREENSHOT_DIR, `${label}-dark`);

const lightFiles = listScreenshots(lightDir);
const darkFiles = listScreenshots(darkDir);
const allFiles = [...new Set([...lightFiles, ...darkFiles])].sort();

if (allFiles.length === 0) {
  console.error(`No screenshots found for label "${label}" in ${SCREENSHOT_DIR}`);
  process.exit(1);
}

const pages = allFiles.map(file => {
  const name = file.replace('.png', '').replace(/^\d+-/, '');
  const lightPath = path.join(lightDir, file);
  const darkPath = path.join(darkDir, file);

  return {
    name,
    lightB64: fs.existsSync(lightPath) ? toBase64(lightPath) : null,
    darkB64: fs.existsSync(darkPath) ? toBase64(darkPath) : null,
  };
});

const html = generateGallery(label, pages);
const reportPath = path.join(SCREENSHOT_DIR, `gallery-${label}.html`);
fs.writeFileSync(reportPath, html);

console.log(`Gallery: ${reportPath}`);
console.log(`${pages.length} pages (light + dark)`);
