import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { Store } from '@ngrx/store';
import { CfUserRelationTypes, GetCurrentCfUserRelationsComplete } from '../actions/permissions.actions';
import { CfCurrentUserRolesResponse, fetchCfCurrentUserRoles } from './cf-user-roles-fetch';

/**
 * fetchCfCurrentUserRoles contract:
 *
 *   - Fires exactly one GET against /pp/v1/cf/current-user-roles/{endpointGuid}
 *     (replacing the legacy 7-sequential-fetch fanout).
 *   - On success, dispatches one GetCurrentCfUserRelationsComplete per
 *     CfUserRelationTypes enum value, carrying the bucket data verbatim.
 *   - Missing/unknown buckets default to []; the reducer needs every
 *     relation type to see at least an empty resources array.
 *   - On HTTP error, swallows + returns false (matches the legacy
 *     fetchCfUserRoles behaviour so the orchestrator caller can mark
 *     the endpoint failed cleanly).
 */
describe('fetchCfCurrentUserRoles', () => {
  it('hits the native handler URL exactly once', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(of({ buckets: {} } as CfCurrentUserRolesResponse)) } as unknown as HttpClient;
    const store = { dispatch: vi.fn() } as unknown as Store<any>;

    const result = await firstValueFrom(fetchCfCurrentUserRoles(store, 'cnsi-1', httpClient));

    expect(result).toBe(true);
    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(httpClient.get).toHaveBeenCalledWith('pp/v1/cf/current-user-roles/cnsi-1');
  });

  it('dispatches one GetCurrentCfUserRelationsComplete per CfUserRelationTypes value, carrying the bucket data', async () => {
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
    const dispatch = vi.fn();
    const store = { dispatch } as unknown as Store<any>;

    await firstValueFrom(fetchCfCurrentUserRoles(store, 'cnsi-1', httpClient));

    const enumValues = Object.values(CfUserRelationTypes);
    expect(dispatch).toHaveBeenCalledTimes(enumValues.length);

    const seenRelationTypes = (dispatch.mock.calls as [GetCurrentCfUserRelationsComplete][])
      .map(([action]) => action.relationType)
      .sort();
    expect(seenRelationTypes).toEqual([...enumValues].sort());

    const orgsCall = (dispatch.mock.calls as [GetCurrentCfUserRelationsComplete][])
      .find(([action]) => action.relationType === CfUserRelationTypes.ORGANIZATIONS)?.[0];
    expect(orgsCall?.data).toEqual([orgEntry]);
    expect(orgsCall?.endpointGuid).toBe('cnsi-1');

    const spacesCall = (dispatch.mock.calls as [GetCurrentCfUserRelationsComplete][])
      .find(([action]) => action.relationType === CfUserRelationTypes.SPACES)?.[0];
    expect(spacesCall?.data).toEqual([spaceEntry]);
  });

  it('treats missing buckets as empty arrays so every relation type still dispatches', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(of({ buckets: {} } as CfCurrentUserRolesResponse)) } as unknown as HttpClient;
    const dispatch = vi.fn();
    const store = { dispatch } as unknown as Store<any>;

    await firstValueFrom(fetchCfCurrentUserRoles(store, 'cnsi-1', httpClient));

    const enumValues = Object.values(CfUserRelationTypes);
    expect(dispatch).toHaveBeenCalledTimes(enumValues.length);
    for (const call of dispatch.mock.calls as [GetCurrentCfUserRelationsComplete][]) {
      expect(call[0].data).toEqual([]);
    }
  });

  it('returns false (does not throw) when the HTTP call errors', async () => {
    const httpClient = { get: vi.fn().mockReturnValue(throwError(() => new Error('boom'))) } as unknown as HttpClient;
    const dispatch = vi.fn();
    const store = { dispatch } as unknown as Store<any>;

    const result = await firstValueFrom(fetchCfCurrentUserRoles(store, 'cnsi-1', httpClient));

    expect(result).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
