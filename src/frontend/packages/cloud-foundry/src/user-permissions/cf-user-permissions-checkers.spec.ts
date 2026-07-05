import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
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
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { CfCurrentUserRolesSignalService } from './cf-current-user-roles-signal.service';
import { CfUserPermissionsChecker } from './cf-user-permissions-checkers';

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
