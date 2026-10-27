import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { builtFileFor, repoRoot } from '../test-framework/built-asset';

// Supplied by a theme or an example extension, not the base build.
const THEME_SUPPLIED = ['/core/assets/eula.html', '/core/assets/custom/acme_logo.png'];

const ASSET_URL = /['"`(](\/(?:core|kubernetes|git)\/assets\/[^'"`) ?#]+)/g;

function shippedFiles(dir: string, exts: string[]): string[] {
  return (readdirSync(join(repoRoot, dir), { recursive: true }) as string[])
    .filter(f => exts.some(e => f.endsWith(e)) && !/\.spec\.ts$|_test\.go$|node_modules|example-/.test(f))
    .map(f => join(repoRoot, dir, f));
}

// A URL that is not a built file gets the SPA's index.html, so an image
// breaks and a help panel shows the console instead of its text.
describe('asset URLs in shipped code', () => {
  it('each name a file the build copies', () => {
    const files = [
      ...shippedFiles('src/frontend/packages', ['.ts', '.html']),
      ...shippedFiles('src/jetstream', ['.go']),
    ];
    const missing = new Set<string>();
    for (const file of files) {
      for (const [, url] of readFileSync(file, 'utf8').matchAll(ASSET_URL)) {
        if (!THEME_SUPPLIED.includes(url) && !builtFileFor(url)) {
          missing.add(url);
        }
      }
    }
    expect([...missing].sort()).toEqual([]);
  });
});
