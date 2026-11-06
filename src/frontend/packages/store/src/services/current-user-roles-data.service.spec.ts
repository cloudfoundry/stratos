import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionUser } from '../types/auth.types';
import { UserScopeStrings } from '../types/endpoint.types';
import { CurrentUserRolesDataService } from './current-user-roles-data.service';

describe('CurrentUserRolesDataService', () => {
  let svc: CurrentUserRolesDataService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CurrentUserRolesDataService,
      ],
    });
    svc = TestBed.inject(CurrentUserRolesDataService);
  });

  it('seeds a default roles state on construction (no store bridge)', () => {
    expect(svc.state()).toEqual({
      internal: { isAdmin: false, scopes: [] },
      endpoints: {},
      state: { initialised: false, fetching: false, error: false },
    });
    expect(svc.stratos()?.isAdmin).toBe(false);
    expect(svc.stratosRole('isAdmin')()).toBe(false);
    expect(svc.stratosHasScope('any.scope' as UserScopeStrings)()).toBe(false);
  });

  it('applySessionScopes applies the session user admin flag + scopes', () => {
    svc.applySessionScopes({
      admin: true,
      scopes: ['cloud_controller.admin'],
    } as SessionUser);

    expect(svc.stratosRole('isAdmin')()).toBe(true);
    expect(svc.stratosHasScope('cloud_controller.admin' as UserScopeStrings)()).toBe(true);
    expect(svc.stratosHasScope('something.else' as UserScopeStrings)()).toBe(false);
  });

  it('applySessionScopes with no user leaves internal roles untouched', () => {
    svc.applySessionScopes(undefined as unknown as SessionUser);
    expect(svc.stratos()).toEqual({ isAdmin: false, scopes: [] });
  });

  it('drives the global request-state through fetching/fetched/failed', () => {
    svc.setStratosFetching();
    expect(svc.state()?.state).toEqual({ initialised: false, fetching: true, error: false });

    svc.setStratosFetched();
    expect(svc.state()?.state).toEqual({ initialised: true, fetching: false, error: false });

    svc.setStratosFetching();
    svc.setStratosFailed();
    expect(svc.state()?.state).toEqual({ initialised: true, fetching: false, error: true });
  });

  it('updateEndpointRoles applies an updater to the keyed endpoint subtree', () => {
    svc.updateEndpointRoles('cf', () => ({ seeded: true }));
    expect(svc.state()?.endpoints['cf']).toEqual({ seeded: true });

    // updater receives the previous subtree
    svc.updateEndpointRoles('cf', (prev: any) => ({ ...prev, extra: 1 }));
    expect(svc.state()?.endpoints['cf']).toEqual({ seeded: true, extra: 1 });

    // other endpoint types are untouched
    expect(svc.state()?.endpoints['metrics']).toBeUndefined();
  });

  it('exposes observable variants reflecting writes', async () => {
    svc.applySessionScopes({ admin: true, scopes: ['scope.a'] } as SessionUser);
    await expect(firstValueFrom(svc.stratosRole$('isAdmin'))).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.stratosHasScope$('scope.a' as UserScopeStrings)),
    ).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.stratosHasScope$('scope.b' as UserScopeStrings)),
    ).resolves.toBe(false);
  });
});
