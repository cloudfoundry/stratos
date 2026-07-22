import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurrentUserRolesDataService } from '@stratosui/store';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CfUserRelationTypes } from '../actions/permissions.actions';
import { CfScopeStrings } from '../user-permissions/cf-user-permissions.types';
import { CfCurrentUserRolesDataService } from './cf-current-user-roles-data.service';

const ENDPOINT_A = 'cf-guid-a';
const ENDPOINT_B = 'cf-guid-b';

describe('CfCurrentUserRolesDataService', () => {
  let svc: CfCurrentUserRolesDataService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CurrentUserRolesDataService,
        CfCurrentUserRolesDataService,
      ],
    });
    svc = TestBed.inject(CfCurrentUserRolesDataService);
  });

  it('returns empty/null reads before any write', () => {
    expect(svc.cfRolesState()).toBeUndefined();
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()).toBeNull();
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(false);
    expect(svc.cfEndpointHasScope(ENDPOINT_A, 'scope.x' as CfScopeStrings)()).toBe(false);
  });

  it('registerEndpoint seeds a default row that reads reflect', () => {
    svc.registerEndpoint(ENDPOINT_A);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()).not.toBeNull();
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(false);
  });

  it('propagateConnectedAdmin derives global flags + scopes', () => {
    // The real endpoint user object carries an `admin` flag (see
    // cf-endpoint-role-sync.service runFetch); propagateConnectedAdmin must
    // ignore it and derive isAdmin purely from the cloud_controller.admin scope.
    const user: { admin?: boolean; scopes?: string[] } = { admin: true, scopes: ['cloud_controller.admin'] };
    svc.propagateConnectedAdmin(ENDPOINT_A, user);
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(true);
    expect(svc.cfEndpointHasScope(ENDPOINT_A, 'cloud_controller.admin' as CfScopeStrings)()).toBe(true);
    expect(svc.cfEndpointHasScope(ENDPOINT_A, 'cloud_controller.write' as CfScopeStrings)()).toBe(false);
  });

  it('propagateSessionAdmin derives global flags for multiple endpoints', () => {
    svc.propagateSessionAdmin([
      { guid: ENDPOINT_A, user: { scopes: ['cloud_controller.admin'] } },
      { guid: ENDPOINT_B, user: { scopes: ['cloud_controller.read'] } },
    ]);
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(true);
    expect(svc.cfGlobalState(ENDPOINT_B, 'canRead')()).toBe(true);
    expect(svc.cfGlobalState(ENDPOINT_B, 'isAdmin')()).toBe(false);
  });

  it('applyUserRelations commits org roles', () => {
    svc.applyUserRelations(CfUserRelationTypes.MANAGED_ORGANIZATION, ENDPOINT_A, [
      { metadata: { guid: 'org-1' }, entity: {} } as any,
    ]);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()?.organizations['org-1'].isManager).toBe(true);
  });

  it('request-state writes drive the endpoint state flag', () => {
    svc.registerEndpoint(ENDPOINT_A);
    svc.setFetching(ENDPOINT_A);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()?.state.fetching).toBe(true);
    svc.setFetched(ENDPOINT_A);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()?.state).toEqual({ initialised: true, fetching: false, error: false });
    svc.setFailed(ENDPOINT_A);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()?.state.error).toBe(true);
  });

  it('removeEndpoint drops the row', () => {
    svc.registerEndpoint(ENDPOINT_A);
    svc.removeEndpoint(ENDPOINT_A);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()).toBeNull();
  });

  it('exposes observable variants reflecting writes', async () => {
    // Global flags derive purely from scopes (legacy getEndpointRoles ignored
    // user.admin) — so isAdmin requires the cloud_controller.admin scope.
    svc.propagateConnectedAdmin(ENDPOINT_A, { scopes: ['cloud_controller.admin', 'scope.a'] });
    await expect(firstValueFrom(svc.cfGlobalState$(ENDPOINT_A, 'isAdmin'))).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.cfEndpointHasScope$(ENDPOINT_A, 'scope.a' as CfScopeStrings)),
    ).resolves.toBe(true);
    const rolesState = await firstValueFrom(svc.cfEndpointRolesState$(ENDPOINT_A));
    expect(rolesState?.global?.isAdmin).toBe(true);
  });

  it('returns null/false for endpoints that are not present', async () => {
    svc.registerEndpoint(ENDPOINT_A);
    expect(svc.cfEndpointRolesState('missing')()).toBeNull();
    expect(svc.cfGlobalState('missing', 'isAdmin')()).toBe(false);
    await expect(firstValueFrom(svc.cfGlobalState$('missing', 'isAdmin'))).resolves.toBe(false);
  });

  it('memoizes cfEndpointRolesState$ per endpointGuid (same observable instance)', () => {
    const a1 = svc.cfEndpointRolesState$(ENDPOINT_A);
    const a2 = svc.cfEndpointRolesState$(ENDPOINT_A);
    const b1 = svc.cfEndpointRolesState$(ENDPOINT_B);
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b1);
  });
});
