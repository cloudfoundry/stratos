import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CUSTOM_USER_PERMISSION_CHECKERS,
  CurrentUserPermissionsService,
  PermissionConfig,
  PermissionTypes,
  StratosCurrentUserPermissions,
} from '@stratosui/core';
import { AuthDataService, CurrentUserRolesDataService, EndpointModel, EndpointsDataService, SessionData } from '@stratosui/store';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { CFFeatureFlagTypes } from '../cf-api.types';
import { CfCurrentUserRolesDataService } from '../services/cf-current-user-roles-data.service';
import { StFeatureFlag } from '../services/endpoint-data/stratos-types';
import { IAllCfRolesState, ICfRolesState, IGlobalRolesState } from '../store/types/cf-current-user-roles.types';

import { CfUserPermissionsChecker } from './cf-user-permissions-checkers';
import { CfPermissionStrings, CfPermissionTypes, CfScopeStrings } from './cf-user-permissions.types';
import { getFeatureFlagsSource } from './feature-flags-cache';

/**
 * Checker contract (#5570 / #5571): a checker signals "this config is not
 * mine" by returning undefined (simple) / null (complex / fallback). Returning
 * a denial instead makes CurrentUserPermissionsService.findChecker see two
 * claimants for every Stratos-level check ("Found too many ... Permission
 * Denied"), which denied every internal / internal-scope / api-key permission
 * app-wide (Register Endpoint button, /api-keys route guard, ...).
 *
 * Stratos permission types are spelled as literals here because the enum is
 * core-internal; the values are pinned by stratosPermissionConfigs.
 */
const STRATOS_INTERNAL = 'internal' as PermissionTypes;
const STRATOS_INTERNAL_SCOPE = 'internal-scope' as PermissionTypes;
const STRATOS_API_KEY = 'api-key' as PermissionTypes;

/** Roles of one CF endpoint: a writer with no roles unless given. */
function cfState(global: Partial<IGlobalRolesState> = {}, orgs: ICfRolesState['organizations'] = {}): ICfRolesState {
  return {
    global: {
      isAdmin: false, isReadOnlyAdmin: false, isGlobalAuditor: false, canRead: true, canWrite: true, scopes: [],
      ...global,
    },
    organizations: orgs,
    spaces: {},
    state: { initialised: true, fetching: false, error: false },
  };
}

function connected(...guids: string[]): Map<string, EndpointModel> {
  return new Map(guids.map(guid => [guid, { guid, cnsi_type: 'cf', connectionStatus: 'connected' } as EndpointModel]));
}

const managerOf = (orgGuid: string): ICfRolesState['organizations'] => ({
  [orgGuid]: { isManager: true, isAuditor: false, isBillingManager: false, isUser: true, spaceGuids: [] },
});

/** The checker over writable role state and endpoint list. */
function setupChecker(rolesState: Signal<IAllCfRolesState | undefined>, endpoints = signal(new Map<string, EndpointModel>())) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: CfCurrentUserRolesDataService, useValue: { cfRolesState: rolesState } },
      {
        provide: EndpointsDataService,
        useValue: { endpoints, hydrated: signal(true), whenReady: () => Promise.resolve() },
      },
      { provide: HttpClient, useValue: {} },
      CfUserPermissionsChecker,
    ],
  });
  return TestBed.inject(CfUserPermissionsChecker);
}

const orgManager = new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER);

describe('CfUserPermissionsChecker contract', () => {
  let checker: CfUserPermissionsChecker;

  beforeEach(() => {
    checker = setupChecker(signal(undefined));
  });

  it('returns undefined from getSimpleCheck for non-CF permission types', () => {
    expect(checker.getSimpleCheck(new PermissionConfig(STRATOS_INTERNAL, 'isAdmin'))).toBeUndefined();
    expect(checker.getSimpleCheck(new PermissionConfig(STRATOS_INTERNAL_SCOPE, 'password.write'))).toBeUndefined();
    expect(checker.getSimpleCheck(new PermissionConfig(STRATOS_API_KEY, ''))).toBeUndefined();
  });

  it('returns null from getComplexCheck when it handles none of the config groups', () => {
    const stratosOnlyGroup = [
      new PermissionConfig(STRATOS_INTERNAL_SCOPE, 'password.write'),
      new PermissionConfig(STRATOS_INTERNAL_SCOPE, 'scim.write'),
    ];
    expect(checker.getComplexCheck(stratosOnlyGroup)).toBeNull();
  });

  it('returns null from getPermissionConfig for stratos-owned keys', () => {
    expect(checker.getPermissionConfig(StratosCurrentUserPermissions.API_KEYS)).toBeFalsy();
  });
});

describe('CurrentUserPermissionsService with both checkers registered', () => {
  function setup(sessionData: Partial<SessionData> | null, isAdmin: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfCurrentUserRolesDataService, useValue: { cfRolesState: signal(undefined) } },
        { provide: HttpClient, useValue: {} },
        { provide: EndpointsDataService, useValue: {} },
        {
          provide: CurrentUserRolesDataService,
          useValue: {
            stratosRole: (role: string) => signal(role === 'isAdmin' && isAdmin),
            stratosHasScope: () => signal(false),
          },
        },
        { provide: AuthDataService, useValue: { sessionData: signal(sessionData as SessionData) } },
        CfUserPermissionsChecker,
        {
          provide: CUSTOM_USER_PERMISSION_CHECKERS,
          useFactory: (cfChecker: CfUserPermissionsChecker) => [cfChecker],
          deps: [CfUserPermissionsChecker],
        },
        CurrentUserPermissionsService,
      ],
    });
    return TestBed.inject(CurrentUserPermissionsService);
  }

  it('resolves stratos-admin permission for an admin (#5570 Register Endpoint)', () => {
    const service = setup(null, true);
    expect(service.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT)()).toBe(true);
  });

  it('resolves api-keys permission for an admin when APIKeysEnabled=admin_only (#5571 route guard)', () => {
    const service = setup({ config: { APIKeysEnabled: 'admin_only' } } as Partial<SessionData>, true);
    expect(service.can(StratosCurrentUserPermissions.API_KEYS)()).toBe(true);
  });

  it('denies api-keys permission before the session arrives', () => {
    const service = setup(null, true);
    expect(service.can(StratosCurrentUserPermissions.API_KEYS)()).toBe(false);
  });

  it('still denies stratos-admin permission for a non-admin', () => {
    const service = setup(null, false);
    expect(service.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT)()).toBe(false);
  });
});

describe('CfUserPermissionsChecker feature flag check', () => {
  it('reads false until the flags load, then the flag', async () => {
    const checker = setupChecker(signal(undefined));

    // The shared cache entry for this guid: load() resolves without a
    // request, and its items are a signal the test fills.
    const guid = 'ff-load-cf';
    const src = getFeatureFlagsSource(guid, TestBed.inject(HttpClient));
    const load = vi.spyOn(src, 'load').mockResolvedValue();
    const flags = signal<StFeatureFlag[]>([]);
    (src as { items: Signal<StFeatureFlag[]> }).items = flags;

    const check = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username),
      guid,
    )!;
    await Promise.resolve();
    expect(load).toHaveBeenCalled();
    expect(check()).toBe(false);

    flags.set([{ name: CFFeatureFlagTypes.set_roles_by_username, enabled: true } as StFeatureFlag]);
    expect(check()).toBe(true);
  });
});

describe('CfUserPermissionsChecker admin and read-only gates', () => {
  const rolesFor = (state: ICfRolesState) => signal<IAllCfRolesState | undefined>({ 'cf-1': state });

  it('allows a CF admin with no role in the org', () => {
    const checker = setupChecker(rolesFor(cfState({ isAdmin: true })));
    expect(checker.getSimpleCheck(orgManager, 'cf-1', 'org-1')!()).toBe(true);
  });

  it('denies a read-only user even with the org role', () => {
    const checker = setupChecker(rolesFor(cfState({ isReadOnlyAdmin: true }, managerOf('org-1'))));
    expect(checker.getSimpleCheck(orgManager, 'cf-1', 'org-1')!()).toBe(false);
  });

  it('reads false until the roles land, then follows them', () => {
    const roles = signal<IAllCfRolesState | undefined>(undefined);
    const checker = setupChecker(roles);
    const check = checker.getSimpleCheck(orgManager, 'cf-1', 'org-1')!;
    expect(check()).toBe(false);

    roles.set({ 'cf-1': cfState({}, managerOf('org-1')) });
    expect(check()).toBe(true);
  });
});

describe('CfUserPermissionsChecker across all connected CF endpoints', () => {
  function setup(connectedGuids: string[], hasScope: (guid: string) => boolean = () => false) {
    const roles: IAllCfRolesState = {};
    for (const guid of connectedGuids) {
      roles[guid] = cfState({ scopes: hasScope(guid) ? [CfScopeStrings.CF_ADMIN_GROUP] : [] });
    }
    return setupChecker(signal(roles), signal(connected(...connectedGuids)));
  }

  it('denies an endpoint scope when no CF endpoint is connected', () => {
    const checker = setup([]);
    const check = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
    );
    expect(check!()).toBe(false);
  });

  it('denies a feature flag when no CF endpoint is connected', () => {
    const checker = setup([]);
    const check = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.route_creation),
    );
    expect(check!()).toBe(false);
  });

  it('denies an org role with no org guid when no CF endpoint is connected', () => {
    const checker = setup([]);
    expect(checker.getSimpleCheck(orgManager)!()).toBe(false);
  });

  it('answers the org role check itself when no CF endpoint is connected', () => {
    const checker = setup([]);
    // With zero endpoints the read-only check (every([]) is true) denies
    // before getSimpleCheck reads the role check, so read it directly.
    const check: Signal<boolean> = checker['getCfCheck'](orgManager);
    expect(check()).toBe(false);
  });

  it('checks an endpoint scope on each connected endpoint', () => {
    const checker = setup(['cf-1', 'cf-2'], guid => guid === 'cf-2');
    const check = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
    );
    expect(check!()).toBe(true);
  });

  it('follows endpoints connecting after the check was built', () => {
    const roles = signal<IAllCfRolesState | undefined>({ 'cf-2': cfState({ scopes: [CfScopeStrings.CF_ADMIN_GROUP] }) });
    const endpoints = signal(connected('cf-1'));
    const checker = setupChecker(roles, endpoints);
    const check = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
    )!;
    expect(check()).toBe(false);

    endpoints.set(connected('cf-1', 'cf-2'));
    expect(check()).toBe(true);
  });
});
