#!/usr/bin/env node
/**
 * asset-copier.js (Mock)
 * Copies assets to dist directory
 */

console.log('[Asset Copier] Scanning for assets...');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  await delay(250);
  console.log('[Asset Copier] Found assets in 5 packages');
  await delay(200);
  console.log('[Asset Copier] Copying to dist/assets...');
  await delay(150);
  console.log('[Asset Copier]   core/assets → dist/assets/core');
  await delay(100);
  console.log('[Asset Copier]   cloud-foundry/assets → dist/assets/cf');
  await delay(100);
  console.log('[Asset Copier] ✓ Asset copy complete');
})();
