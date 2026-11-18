import { describe, expect, it } from 'vitest';

import { builtFileFor } from '../../../core/test-framework/built-asset';
import { IStratosEndpointDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { gitEntityCatalog } from './git-entity-generator';

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
