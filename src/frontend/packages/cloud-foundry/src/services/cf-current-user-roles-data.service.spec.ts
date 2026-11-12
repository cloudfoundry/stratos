import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurrentUserRolesDataService } from '@stratosui/store';
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

  it('global and scope signals follow writes', () => {
    // Global flags derive purely from scopes (legacy getEndpointRoles ignored
    // user.admin) — so isAdmin requires the cloud_controller.admin scope.
    const isAdmin = svc.cfGlobalState(ENDPOINT_A, 'isAdmin');
    const hasScope = svc.cfEndpointHasScope(ENDPOINT_A, 'scope.a' as CfScopeStrings);
    expect(isAdmin()).toBe(false);
    svc.propagateConnectedAdmin(ENDPOINT_A, { scopes: ['cloud_controller.admin', 'scope.a'] });
    expect(isAdmin()).toBe(true);
    expect(hasScope()).toBe(true);
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()?.global?.isAdmin).toBe(true);
  });

  it('returns null/false for endpoints that are not present', () => {
    svc.registerEndpoint(ENDPOINT_A);
    expect(svc.cfEndpointRolesState('missing')()).toBeNull();
    expect(svc.cfGlobalState('missing', 'isAdmin')()).toBe(false);
    expect(svc.spacesWithRoleInOrg('missing', 'org-1', 'isDeveloper')()).toBe('all');
  });

  it('spacesWithRoleInOrg lists the org spaces holding the role and follows writes', () => {
    const roles = TestBed.inject(CurrentUserRolesDataService);
    const seed = (devInS2: boolean) => roles.updateEndpointRoles('cf', () => ({
      [ENDPOINT_A]: {
        organizations: { 'org-1': { spaceGuids: ['s-1', 's-2'] } },
        spaces: { 's-1': { isDeveloper: true }, 's-2': { isDeveloper: devInS2 } },
      },
    }));
    seed(false);
    const spaces = svc.spacesWithRoleInOrg(ENDPOINT_A, 'org-1', 'isDeveloper');
    expect(spaces()).toEqual(['s-1']);
    expect(svc.spacesWithRoleInOrg(ENDPOINT_A, 'org-2', 'isDeveloper')()).toBe('all');

    seed(true);
    expect(spaces()).toEqual(['s-1', 's-2']);
  });
});
