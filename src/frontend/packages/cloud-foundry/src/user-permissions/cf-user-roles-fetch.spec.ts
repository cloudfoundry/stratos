import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CfUserRelationTypes } from '../actions/permissions.actions';
import { CfCurrentUserRolesResponse, fetchCfCurrentUserRoles } from './cf-user-roles-fetch';

/**
 * fetchCfCurrentUserRoles contract:
 *
 *   - Fires exactly one GET against /pp/v1/cf/current-user-roles/{endpointGuid}
 *     (replacing the legacy 7-sequential-fetch fanout).
 *   - On success, calls CfCurrentUserRolesDataService.applyUserRelations once
 *     per CfUserRelationTypes value, carrying the bucket data verbatim.
 *   - Missing/unknown buckets default to []; every relation type must still be
 *     applied (so a now-empty relation clears prior roles).
 *   - On HTTP error, swallows + returns false so the orchestrator can mark the
 *     endpoint failed cleanly.
 */
describe('fetchCfCurrentUserRoles', () => {
  it('hits the native handler URL exactly once', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(of({ buckets: {} } as CfCurrentUserRolesResponse)) } as unknown as HttpClient;
    const cfRoles = { applyUserRelations: vi.fn() } as any;

    const result = await firstValueFrom(fetchCfCurrentUserRoles(cfRoles, 'cnsi-1', httpClient));

    expect(result).toBe(true);
    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(httpClient.get).toHaveBeenCalledWith('pp/v1/cf/current-user-roles/cnsi-1');
  });

  it('applies one relation bucket per CfUserRelationTypes value, carrying the bucket data', async () => {
    const orgEntry = { metadata: { guid: 'org-1' }, entity: {} };
    const spaceEntry = { metadata: { guid: 'sp-1' }, entity: { organization_guid: 'org-1' } };
    const response: CfCurrentUserRolesResponse = {
      buckets: {
        organizations: [orgEntry],
        managed_organizations: [],
        billing_managed_organizations: [],
        audited_organizations: [],
        spaces: [spaceEntry],
        managed_spaces: [],
        audited_spaces: [],
      },
    };
    const httpClient = { get: vi.fn().mockReturnValue(of(response)) } as unknown as HttpClient;
    const applyUserRelations = vi.fn();
    const cfRoles = { applyUserRelations } as any;

    await firstValueFrom(fetchCfCurrentUserRoles(cfRoles, 'cnsi-1', httpClient));

    const enumValues = Object.values(CfUserRelationTypes);
    expect(applyUserRelations).toHaveBeenCalledTimes(enumValues.length);

    const seen = (applyUserRelations.mock.calls as [CfUserRelationTypes, string, any][])
      .map(([rt]) => rt)
      .sort();
    expect(seen).toEqual([...enumValues].sort());

    const orgsCall = (applyUserRelations.mock.calls as [CfUserRelationTypes, string, any][])
      .find(([rt]) => rt === CfUserRelationTypes.ORGANIZATIONS);
    expect(orgsCall?.[1]).toBe('cnsi-1');
    expect(orgsCall?.[2]).toEqual([orgEntry]);

    const spacesCall = (applyUserRelations.mock.calls as [CfUserRelationTypes, string, any][])
      .find(([rt]) => rt === CfUserRelationTypes.SPACES);
    expect(spacesCall?.[2]).toEqual([spaceEntry]);
  });

  it('treats missing buckets as empty arrays so every relation type still applies', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(of({ buckets: {} } as CfCurrentUserRolesResponse)) } as unknown as HttpClient;
    const applyUserRelations = vi.fn();
    const cfRoles = { applyUserRelations } as any;

    await firstValueFrom(fetchCfCurrentUserRoles(cfRoles, 'cnsi-1', httpClient));

    const enumValues = Object.values(CfUserRelationTypes);
    expect(applyUserRelations).toHaveBeenCalledTimes(enumValues.length);
    for (const call of applyUserRelations.mock.calls as [CfUserRelationTypes, string, any][]) {
      expect(call[2]).toEqual([]);
    }
  });

  it('returns false (does not throw) when the HTTP call errors', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(throwError(() => new Error('boom'))) } as unknown as HttpClient;
    const applyUserRelations = vi.fn();
    const cfRoles = { applyUserRelations } as any;

    const result = await firstValueFrom(fetchCfCurrentUserRoles(cfRoles, 'cnsi-1', httpClient));

    expect(result).toBe(false);
    expect(applyUserRelations).not.toHaveBeenCalled();
  });
});
