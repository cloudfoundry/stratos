import { describe, expect, it } from 'vitest';

import { GetAllFeatureFlags } from './feature-flags.actions';

describe('GetAllFeatureFlags (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/feature_flags/{cnsi} URL', () => {
    const action = new GetAllFeatureFlags('cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/feature_flags/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new GetAllFeatureFlags('cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});
