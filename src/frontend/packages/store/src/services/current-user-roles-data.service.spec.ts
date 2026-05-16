import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  ICurrentUserRolesState,
  IStratosRolesState,
} from '../types/current-user-roles.types';
import { UserScopeStrings } from '../types/endpoint.types';
import { CurrentUserRolesDataService } from './current-user-roles-data.service';

function makeStratos(overrides: Partial<IStratosRolesState> = {}): IStratosRolesState {
  return {
    isAdmin: false,
    scopes: [],
    ...overrides,
  };
}

function makeState(overrides: Partial<ICurrentUserRolesState> = {}): ICurrentUserRolesState {
  return {
    internal: makeStratos(),
    endpoints: {},
    state: { initialised: false, fetching: false, error: false },
    ...overrides,
  };
}

describe('CurrentUserRolesDataService', () => {
  let slice$: BehaviorSubject<ICurrentUserRolesState>;

  beforeEach(() => {
    slice$ = new BehaviorSubject<ICurrentUserRolesState>(makeState());
    const stubStore = {
      select: () => slice$.asObservable(),
      dispatch: () => undefined,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Store, useValue: stubStore },
        CurrentUserRolesDataService,
      ],
    });
  });

  it('mirrors the initial currentUserRoles slice on construction', () => {
    const svc = TestBed.inject(CurrentUserRolesDataService);
    expect(svc.state()).toBeDefined();
    expect(svc.stratos()?.isAdmin).toBe(false);
    expect(svc.stratosRole('isAdmin')()).toBe(false);
    expect(svc.stratosHasScope('any.scope' as UserScopeStrings)()).toBe(false);
  });

  it('reflects subsequent slice updates through stratosRole + stratosHasScope', () => {
    const svc = TestBed.inject(CurrentUserRolesDataService);
    const isAdminSig = svc.stratosRole('isAdmin');
    const hasScopeSig = svc.stratosHasScope('cloud_controller.admin' as UserScopeStrings);

    slice$.next(makeState({
      internal: makeStratos({
        isAdmin: true,
        scopes: ['cloud_controller.admin' as UserScopeStrings],
      }),
    }));

    expect(isAdminSig()).toBe(true);
    expect(hasScopeSig()).toBe(true);
    expect(svc.stratosHasScope('something.else' as UserScopeStrings)()).toBe(false);
  });

  it('exposes observable variants for legacy rxjs-shaped pipelines', async () => {
    const svc = TestBed.inject(CurrentUserRolesDataService);
    slice$.next(makeState({
      internal: makeStratos({
        isAdmin: true,
        scopes: ['scope.a' as UserScopeStrings],
      }),
    }));
    await expect(firstValueFrom(svc.stratosRole$('isAdmin'))).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.stratosHasScope$('scope.a' as UserScopeStrings)),
    ).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.stratosHasScope$('scope.b' as UserScopeStrings)),
    ).resolves.toBe(false);
  });

  it('returns false for stratosRole when state is undefined', () => {
    const svc = TestBed.inject(CurrentUserRolesDataService);
    slice$.next(undefined as unknown as ICurrentUserRolesState);
    expect(svc.stratosRole('isAdmin')()).toBe(false);
    expect(svc.stratosHasScope('scope.x' as UserScopeStrings)()).toBe(false);
  });
});
