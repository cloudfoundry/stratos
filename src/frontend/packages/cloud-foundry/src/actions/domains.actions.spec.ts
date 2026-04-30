import { describe, expect, it } from 'vitest';

import { FetchAllDomains, FetchDomain } from './domains.actions';

describe('FetchDomain (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/domains/{cnsi}/{guid} URL', () => {
    const action = new FetchDomain('domain-guid', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/domains/cnsi-1/domain-guid');
  });
});

describe('FetchAllDomains (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/domains/{cnsi} URL', () => {
    const action = new FetchAllDomains('cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/domains/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new FetchAllDomains('cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});
