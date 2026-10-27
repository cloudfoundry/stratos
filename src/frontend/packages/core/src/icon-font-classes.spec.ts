import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { repoRoot } from '../test-framework/built-asset';

// The console bundles two icon fonts (docs/icon-fonts.md). An element with
// any other icon font class shows its icon name as text.
const LOADED = ['material-icons', 'stratos-icons'];

describe('icon font classes in templates', () => {
  it('use only the fonts the console loads', () => {
    const packages = join(repoRoot, 'src/frontend/packages');
    const offenders: string[] = [];
    for (const file of readdirSync(packages, { recursive: true }) as string[]) {
      if (!file.endsWith('.html') || file.includes('node_modules')) {
        continue;
      }
      for (const [, classes] of readFileSync(join(packages, file), 'utf8').matchAll(/\bclass="([^"]*)"/g)) {
        for (const cls of classes.split(/\s+/).filter(c => c.startsWith('material-'))) {
          if (!LOADED.includes(cls)) {
            offenders.push(`${file}: ${cls}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
