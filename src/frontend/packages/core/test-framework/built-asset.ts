import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const repoRoot = join(import.meta.dirname, '../../../../..');

interface AssetMapping { glob: string; input: string; output: string; }

// The build copies only what angular.json lists, so resolve a URL the
// console hands to the browser through those mappings. Undefined means the
// SPA fallback would answer it with index.html.
export function builtFileFor(url: string): string | undefined {
  const angular = JSON.parse(readFileSync(join(repoRoot, 'angular.json'), 'utf8'));
  const assets: AssetMapping[] = angular.projects['stratos'].architect['build-internal'].options.assets
    .filter((a: AssetMapping | string) => typeof a === 'object' && a.glob === '**/*');
  for (const mapping of assets) {
    const prefix = mapping.output.replace(/\/$/, '') + '/';
    if (url.startsWith(prefix)) {
      const file = join(repoRoot, mapping.input, url.slice(prefix.length));
      if (existsSync(file)) {
        return file;
      }
    }
  }
  return undefined;
}
