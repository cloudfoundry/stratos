#!/usr/bin/env tsx
/**
 * Compare screenshots from two Stratos deployments.
 * Generates an HTML report with side-by-side images and pixel diffs.
 *
 * Usage: bunx tsx e2e/scripts/compare-screenshots.ts <label1> <label2>
 * Example: bunx tsx e2e/scripts/compare-screenshots.ts v4 v5
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const SCREENSHOT_DIR = path.resolve('e2e-screenshots');

function getArgs(): { label1: string; label2: string } {
  const [,, label1, label2] = process.argv;
  if (!label1 || !label2) {
    console.error('Usage: bunx tsx e2e/scripts/compare-screenshots.ts <label1> <label2>');
    console.error('Example: bunx tsx e2e/scripts/compare-screenshots.ts v4 v5');
    process.exit(1);
  }
  return { label1, label2 };
}

function listScreenshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
}

function compareImages(path1: string, path2: string): { diffPercent: number; diffBase64: string } {
  const img1 = PNG.sync.read(fs.readFileSync(path1));
  const img2 = PNG.sync.read(fs.readFileSync(path2));

  // Use the larger dimensions
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  // Resize to match if needed
  const padded1 = padImage(img1, width, height);
  const padded2 = padImage(img2, width, height);

  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(padded1.data, padded2.data, diff.data, width, height, {
    threshold: 0.1,
  });

  const totalPixels = width * height;
  const diffPercent = (numDiffPixels / totalPixels) * 100;
  const diffBase64 = PNG.sync.write(diff).toString('base64');

  return { diffPercent, diffBase64 };
}

function padImage(img: PNG, targetWidth: number, targetHeight: number): PNG {
  if (img.width === targetWidth && img.height === targetHeight) return img;
  const padded = new PNG({ width: targetWidth, height: targetHeight, fill: true });
  // Fill with white
  for (let i = 0; i < padded.data.length; i += 4) {
    padded.data[i] = 255;
    padded.data[i + 1] = 255;
    padded.data[i + 2] = 255;
    padded.data[i + 3] = 255;
  }
  PNG.bitblt(img, padded, 0, 0, img.width, img.height, 0, 0);
  return padded;
}

function toBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

function generateReport(
  label1: string,
  label2: string,
  results: Array<{ name: string; mode: string; diffPercent: number; img1B64: string; img2B64: string; diffB64: string }>
): string {
  const rows = results.map(r => {
    const color = r.diffPercent < 1 ? '#22c55e' : r.diffPercent < 10 ? '#f59e0b' : '#ef4444';
    return `
    <tr>
      <td>${r.name}</td>
      <td>${r.mode}</td>
      <td style="color: ${color}; font-weight: bold">${r.diffPercent.toFixed(1)}%</td>
      <td><img src="data:image/png;base64,${r.img1B64}" class="thumb" onclick="showFull(this.src)"></td>
      <td><img src="data:image/png;base64,${r.img2B64}" class="thumb" onclick="showFull(this.src)"></td>
      <td><img src="data:image/png;base64,${r.diffB64}" class="thumb" onclick="showFull(this.src)"></td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Stratos Visual Comparison: ${label1} vs ${label2}</title>
  <style>
    body { font-family: system-ui; margin: 20px; background: #f8f9fa; }
    h1 { color: #1e293b; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
    th { background: #1e293b; color: white; }
    .thumb { max-width: 300px; max-height: 200px; cursor: pointer; border: 1px solid #ddd; }
    #overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
               background: rgba(0,0,0,0.9); z-index: 100; cursor: pointer; overflow: auto; }
    #overlay img { max-width: 95%; margin: 20px auto; display: block; }
    .summary { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <h1>Visual Comparison: ${label1} vs ${label2}</h1>
  <div class="summary">
    <strong>Total pages:</strong> ${results.length} |
    <strong>Identical (&lt;1%):</strong> ${results.filter(r => r.diffPercent < 1).length} |
    <strong>Minor (1-10%):</strong> ${results.filter(r => r.diffPercent >= 1 && r.diffPercent < 10).length} |
    <strong>Major (&gt;10%):</strong> ${results.filter(r => r.diffPercent >= 10).length}
  </div>
  <table>
    <tr><th>Page</th><th>Mode</th><th>Diff %</th><th>${label1}</th><th>${label2}</th><th>Diff</th></tr>
    ${rows}
  </table>
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
const { label1, label2 } = getArgs();
const results: Array<{ name: string; mode: string; diffPercent: number; img1B64: string; img2B64: string; diffB64: string }> = [];

for (const mode of ['light', 'dark']) {
  const dir1 = path.join(SCREENSHOT_DIR, `${label1}-${mode}`);
  const dir2 = path.join(SCREENSHOT_DIR, `${label2}-${mode}`);

  const files1 = listScreenshots(dir1);
  const files2 = listScreenshots(dir2);
  const allFiles = [...new Set([...files1, ...files2])].sort();

  for (const file of allFiles) {
    const path1 = path.join(dir1, file);
    const path2 = path.join(dir2, file);

    if (!fs.existsSync(path1)) {
      console.warn(`Missing in ${label1}-${mode}: ${file}`);
      continue;
    }
    if (!fs.existsSync(path2)) {
      console.warn(`Missing in ${label2}-${mode}: ${file}`);
      continue;
    }

    const { diffPercent, diffBase64 } = compareImages(path1, path2);
    const name = file.replace('.png', '');

    results.push({
      name,
      mode,
      diffPercent,
      img1B64: toBase64(path1),
      img2B64: toBase64(path2),
      diffB64: diffBase64,
    });

    const indicator = diffPercent < 1 ? '✓' : diffPercent < 10 ? '~' : '✗';
    console.log(`${indicator} ${mode}/${name}: ${diffPercent.toFixed(1)}% diff`);
  }
}

const reportPath = path.join(SCREENSHOT_DIR, 'report.html');
fs.writeFileSync(reportPath, generateReport(label1, label2, results));
console.log(`\nReport: ${reportPath}`);
console.log(`Total: ${results.length} pages compared`);
