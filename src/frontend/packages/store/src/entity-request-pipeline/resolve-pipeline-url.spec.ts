import { describe, expect, it } from 'vitest';

import { resolvePipelineUrl } from './resolve-pipeline-url';

describe('resolvePipelineUrl', () => {
  it('prefixes a relative URL with /pp/{proxy}/proxy/{cf}/ for V2 proxy routing', () => {
    expect(resolvePipelineUrl('organizations', 'v1', 'v2')).toEqual({
      url: '/pp/v1/proxy/v2/organizations',
      isAbsolute: false,
    });
  });

  it('passes an absolute URL through unchanged', () => {
    expect(resolvePipelineUrl('/pp/v1/cf/organizations/cnsi-1', 'v1', 'v2')).toEqual({
      url: '/pp/v1/cf/organizations/cnsi-1',
      isAbsolute: true,
    });
  });

  it('preserves query and path tail on relative URLs', () => {
    expect(resolvePipelineUrl('organizations/abc/spaces?per_page=100', 'v1', 'v2').url)
      .toBe('/pp/v1/proxy/v2/organizations/abc/spaces?per_page=100');
  });
});
