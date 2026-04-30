import { describe, expect, it } from 'vitest';

import { FetchAllBuildpacks } from './buildpack.action';

describe('FetchAllBuildpacks (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/buildpacks/{cnsi} URL', () => {
    const action = new FetchAllBuildpacks('cnsi-1', 'pkey');
    expect(action.options.url).toBe('/pp/v1/cf/buildpacks/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new FetchAllBuildpacks('cnsi-1', 'pkey');
    expect(action.options.method).toBe('GET');
  });
});
