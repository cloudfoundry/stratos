import { describe, expect, it } from 'vitest';

import { GetAllOrganizationSpaces, GetAllOrgUsers, GetOrganization } from './organization.actions';

describe('GetOrganization (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/org/{cnsi}/{guid} URL', () => {
    const action = new GetOrganization('org-guid', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/org/cnsi-1/org-guid');
  });

  it('issues a GET request', () => {
    const action = new GetOrganization('org-guid', 'cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});

describe('GetAllOrganizationSpaces (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/org/{cnsi}/{org}/spaces URL', () => {
    const action = new GetAllOrganizationSpaces('pkey', 'org-guid', 'cnsi-1');
    expect(action.options.url).toBe('/pp/v1/cf/org/cnsi-1/org-guid/spaces');
  });

  it('issues a GET request', () => {
    const action = new GetAllOrganizationSpaces('pkey', 'org-guid', 'cnsi-1');
    expect(action.options.method).toBe('GET');
  });
});

describe('GetAllOrgUsers (V3 native)', () => {
  it('constructs an absolute /pp/v1/cf/users/{cnsi} URL (org filtering happens client-side)', () => {
    const action = new GetAllOrgUsers('org-guid', 'pkey', 'cnsi-1', false);
    expect(action.options.url).toBe('/pp/v1/cf/users/cnsi-1');
  });

  it('issues a GET request', () => {
    const action = new GetAllOrgUsers('org-guid', 'pkey', 'cnsi-1', false);
    expect(action.options.method).toBe('GET');
  });
});
