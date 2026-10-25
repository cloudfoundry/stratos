import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { IStratosEndpointDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { gitEntityCatalog } from './git-entity-generator';

const repoRoot = join(import.meta.dirname, '../../../../../..');

interface AssetMapping { glob: string; input: string; output: string; }

// The build copies only what angular.json lists, so resolve each URL the
// git endpoint hands to the browser through those mappings.
function builtFileFor(url: string): string | undefined {
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

function endpointUrls(): string[] {
  const def = gitEntityCatalog.gitEndpoint.definition as IStratosEndpointDefinition;
  const urls: (string | undefined)[] = [def.logoUrl];
  for (const sub of def.subTypes ?? []) {
    urls.push(sub.logoUrl);
    for (const auth of sub.authTypes ?? []) {
      urls.push(auth.help);
    }
  }
  return urls.filter((u): u is string => !!u);
}

describe('gitEntityCatalog asset URLs', () => {
  it('lists the connect help for both GitHub and GitLab', () => {
    const help = endpointUrls().filter(u => u.endsWith('.md'));
    expect(help.length).toBe(2);
  });

  it.each(endpointUrls())('serves %s from a file the build copies', (url) => {
    expect(builtFileFor(url)).toBeDefined();
  });
});
