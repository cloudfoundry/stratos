import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { CurrentUserRolesDataService } from '@stratosui/store';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  IAllCfRolesState,
  IGlobalRolesState,
} from '../store/types/cf-current-user-roles.types';
import { CfScopeStrings } from '../user-permissions/cf-user-permissions.types';
import { CfCurrentUserRolesDataService } from './cf-current-user-roles-data.service';

const ENDPOINT_A = 'cf-guid-a';

function makeGlobal(overrides: Partial<IGlobalRolesState> = {}): IGlobalRolesState {
  return {
    isAdmin: false,
    isReadOnlyAdmin: false,
    isGlobalAuditor: false,
    canRead: true,
    canWrite: false,
    scopes: [],
    ...overrides,
  };
}

function makeCfRolesState(overrides: { global?: Partial<IGlobalRolesState> } = {}) {
  return {
    global: makeGlobal(overrides.global),
    spaces: {},
    organizations: {},
    state: { initialised: true, fetching: false, error: false },
  };
}

function makeAllCfRolesState(byGuid: Record<string, ReturnType<typeof makeCfRolesState>>): IAllCfRolesState {
  return byGuid as unknown as IAllCfRolesState;
}

function makeOuterState(cfState?: IAllCfRolesState) {
  return {
    internal: { isAdmin: false, scopes: [] },
    endpoints: cfState ? { [CF_ENDPOINT_TYPE]: cfState } : {},
    state: { initialised: false, fetching: false, error: false },
  };
}

describe('CfCurrentUserRolesDataService', () => {
  let slice$: BehaviorSubject<unknown>;

  beforeEach(() => {
    slice$ = new BehaviorSubject<unknown>(makeOuterState());
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
        CfCurrentUserRolesDataService,
      ],
    });
  });

  it('returns null for endpoint state until the slice populates', () => {
    const svc = TestBed.inject(CfCurrentUserRolesDataService);
    expect(svc.cfRolesState()).toBeUndefined();
    expect(svc.cfEndpointRolesState(ENDPOINT_A)()).toBeNull();
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(false);
    expect(svc.cfEndpointHasScope(ENDPOINT_A, 'scope.x' as CfScopeStrings)()).toBe(false);
  });

  it('projects cf-side state per-endpoint guid through signals', () => {
    const svc = TestBed.inject(CfCurrentUserRolesDataService);
    slice$.next(
      makeOuterState(
        makeAllCfRolesState({
          [ENDPOINT_A]: makeCfRolesState({
            global: { isAdmin: true, scopes: ['cloud_controller.admin'] },
          }),
        }),
      ),
    );

    expect(svc.cfEndpointRolesState(ENDPOINT_A)()).not.toBeNull();
    expect(svc.cfGlobalState(ENDPOINT_A, 'isAdmin')()).toBe(true);
    expect(svc.cfGlobalState(ENDPOINT_A, 'isReadOnlyAdmin')()).toBe(false);
    expect(svc.cfEndpointHasScope(ENDPOINT_A, 'cloud_controller.admin' as CfScopeStrings)).toBeDefined();
    expect(
      svc.cfEndpointHasScope(ENDPOINT_A, 'cloud_controller.admin' as CfScopeStrings)(),
    ).toBe(true);
    expect(
      svc.cfEndpointHasScope(ENDPOINT_A, 'cloud_controller.write' as CfScopeStrings)(),
    ).toBe(false);
  });

  it('exposes observable variants matching the legacy selector shape', async () => {
    const svc = TestBed.inject(CfCurrentUserRolesDataService);
    slice$.next(
      makeOuterState(
        makeAllCfRolesState({
          [ENDPOINT_A]: makeCfRolesState({
            global: { isAdmin: true, scopes: ['scope.a'] },
          }),
        }),
      ),
    );

    await expect(firstValueFrom(svc.cfGlobalState$(ENDPOINT_A, 'isAdmin'))).resolves.toBe(true);
    await expect(
      firstValueFrom(svc.cfEndpointHasScope$(ENDPOINT_A, 'scope.a' as CfScopeStrings)),
    ).resolves.toBe(true);
    const rolesState = await firstValueFrom(svc.cfEndpointRolesState$(ENDPOINT_A));
    expect(rolesState).toBeDefined();
    expect(rolesState?.global?.isAdmin).toBe(true);
  });

  it('returns null/false for endpoints that are not present', async () => {
    const svc = TestBed.inject(CfCurrentUserRolesDataService);
    slice$.next(makeOuterState(makeAllCfRolesState({})));
    expect(svc.cfEndpointRolesState('missing')()).toBeNull();
    expect(svc.cfGlobalState('missing', 'isAdmin')()).toBe(false);
    await expect(firstValueFrom(svc.cfGlobalState$('missing', 'isAdmin'))).resolves.toBe(false);
  });
});
