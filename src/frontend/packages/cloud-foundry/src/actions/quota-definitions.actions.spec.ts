import { describe, expect, it } from 'vitest';

import { GetOrganizationSpaceQuotaDefinitions, GetQuotaDefinitions } from './quota-definitions.actions';

describe('GetQuotaDefinitions (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/organization_quotas/{cnsi} URL', () => {
    const action = new GetQuotaDefinitions('pkey', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/organization_quotas/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new GetQuotaDefinitions('pkey', 'cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});

describe('GetOrganizationSpaceQuotaDefinitions (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/space_quotas/{cnsi} URL (org filtering happens client-side)', () => {
    const action = new GetOrganizationSpaceQuotaDefinitions('pkey', 'org-guid', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/space_quotas/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new GetOrganizationSpaceQuotaDefinitions('pkey', 'org-guid', 'cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});
