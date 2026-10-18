import { HttpClient } from '@angular/common/http';
import { computed, provideZonelessChangeDetection, Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CUSTOM_USER_PERMISSION_CHECKERS,
  CurrentUserPermissionsService,
  CurrentUserRolesSignalService,
  PermissionConfig,
  PermissionTypes,
  StratosCurrentUserPermissions,
} from '@stratosui/core';
import { EndpointsDataService, SessionData } from '@stratosui/store';
import { firstValueFrom, Observable, of, timeout } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { CFFeatureFlagTypes } from '../cf-api.types';
import { StFeatureFlag } from '../services/endpoint-data/stratos-types';

import { CfCurrentUserRolesSignalService } from './cf-current-user-roles-signal.service';
import { CfUserPermissionsChecker } from './cf-user-permissions-checkers';
import { CfPermissionStrings, CfPermissionTypes, CfScopeStrings } from './cf-user-permissions.types';
import { getFeatureFlagsSource } from './feature-flags-cache';

/**
 * Checker contract (#5570 / #5571): a checker signals "this config is not
 * mine" by returning undefined (simple) / null (complex / fallback). Returning
 * a denial observable instead makes CurrentUserPermissionsService.findChecker
 * see two claimants for every Stratos-level check ("Found too many ...
 * Permission Denied"), which denied every internal / internal-scope / api-key
 * permission app-wide (Register Endpoint button, /api-keys route guard, ...).
 *
 * Stratos permission types are spelled as literals here because the enum is
 * core-internal; the values are pinned by stratosPermissionConfigs.
 */
const STRATOS_INTERNAL = 'internal' as PermissionTypes;
const STRATOS_INTERNAL_SCOPE = 'internal-scope' as PermissionTypes;
const STRATOS_API_KEY = 'api-key' as PermissionTypes;

describe('CfUserPermissionsChecker contract', () => {
  let checker: CfUserPermissionsChecker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfCurrentUserRolesSignalService, useValue: {} },
        { provide: HttpClient, useValue: {} },
        CfUserPermissionsChecker,
      ],
    });
    checker = TestBed.inject(CfUserPermissionsChecker);
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
        { provide: CfCurrentUserRolesSignalService, useValue: {} },
        { provide: HttpClient, useValue: {} },
        { provide: EndpointsDataService, useValue: {} },
        {
          provide: CurrentUserRolesSignalService,
          useValue: {
            stratosRole$: (role: string) => of(role === 'isAdmin' && isAdmin),
            stratosHasScope$: () => of(false),
            sessionData$: () => of(sessionData as SessionData),
          },
        },
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

  it('resolves stratos-admin permission for an admin (#5570 Register Endpoint)', async () => {
    const service = setup(null, true);
    await expect(
      firstValueFrom(service.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT)),
    ).resolves.toBe(true);
  });

  it('resolves api-keys permission for an admin when APIKeysEnabled=admin_only (#5571 route guard)', async () => {
    const service = setup({ config: { APIKeysEnabled: 'admin_only' } } as Partial<SessionData>, true);
    await expect(
      firstValueFrom(service.can(StratosCurrentUserPermissions.API_KEYS)),
    ).resolves.toBe(true);
  });

  it('still denies stratos-admin permission for a non-admin', async () => {
    const service = setup(null, false);
    await expect(
      firstValueFrom(service.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT)),
    ).resolves.toBe(false);
  });
});

describe('CfUserPermissionsChecker feature flag check', () => {
  // The checker is a root service, so whatever watches the flags signal must
  // end with the subscription, not with the (permanent) root injector.
  it('stops reading the feature flags after unsubscribe', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfCurrentUserRolesSignalService, useValue: {} },
        { provide: HttpClient, useValue: {} },
        CfUserPermissionsChecker,
      ],
    });
    const checker = TestBed.inject(CfUserPermissionsChecker);

    // Pre-seed the shared cache entry so load() resolves without a request,
    // and read the flags through a computed that counts its evaluations.
    const guid = 'ff-unsubscribe-cf';
    const src = getFeatureFlagsSource(guid, TestBed.inject(HttpClient));
    vi.spyOn(src, 'load').mockResolvedValue();
    const flags = signal<StFeatureFlag[]>([{ name: CFFeatureFlagTypes.set_roles_by_username, enabled: true } as StFeatureFlag]);
    let reads = 0;
    (src as { items: Signal<StFeatureFlag[]> }).items = computed(() => {
      reads++;
      return flags();
    });

    const values: boolean[] = [];
    const check$ = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.set_roles_by_username),
      guid,
    );
    const sub = check$!.subscribe(v => values.push(v));
    await src.load();
    await Promise.resolve();
    TestBed.tick();
    expect(values).toEqual([true]);
    const readsWhileSubscribed = reads;

    sub.unsubscribe();
    flags.set([{ name: CFFeatureFlagTypes.set_roles_by_username, enabled: false } as StFeatureFlag]);
    TestBed.tick();

    expect(reads).toBe(readsWhileSubscribed);
    expect(values).toEqual([true]);
  });
});

describe('CfUserPermissionsChecker across all connected CF endpoints', () => {
  function setup(connectedGuids: string[], hasScope: (guid: string) => boolean = () => false) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: CfCurrentUserRolesSignalService,
          useValue: {
            connectedCfEndpointGuids$: () => of(connectedGuids),
            cfEndpointHasScope$: (guid: string) => of(hasScope(guid)),
          },
        },
        { provide: HttpClient, useValue: {} },
        CfUserPermissionsChecker,
      ],
    });
    return TestBed.inject(CfUserPermissionsChecker);
  }

  // combineLatest([]) completes without a value, so a check over zero
  // endpoints must still answer.
  const answer = (check$: Observable<boolean>) => firstValueFrom(check$.pipe(timeout(1000)));

  it('denies an endpoint scope when no CF endpoint is connected', async () => {
    const checker = setup([]);
    const check$ = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.ENDPOINT_SCOPE, CfScopeStrings.CF_ADMIN_GROUP),
    );
    await expect(answer(check$!)).resolves.toBe(false);
  });

  it('denies a feature flag when no CF endpoint is connected', async () => {
    const checker = setup([]);
    const check$ = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.route_creation),
    );
    await expect(answer(check$!)).resolves.toBe(false);
  });

  it('denies an org role with no org guid when no CF endpoint is connected', async () => {
    const checker = setup([]);
    const check$ = checker.getSimpleCheck(
      new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    );
    await expect(answer(check$!)).resolves.toBe(false);
  });

  it('answers the org role check itself when no CF endpoint is connected', async () => {
    const checker = setup([]);
    // With zero endpoints the read-only check (every([]) is true) denies
    // before getSimpleCheck reads the role check, so read it directly.
    const check$ = checker['getCfCheck'](
      new PermissionConfig(CfPermissionTypes.ORGANIZATION, CfPermissionStrings.ORG_MANAGER),
    );
    await expect(answer(check$)).resolves.toBe(false);
  });

});
