import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defer, Observable, of } from 'rxjs';
import { AuthDataService, AuthState, EndpointsDataService } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { SessionService } from '../shared/services/session.service';
import { CoreModule } from './core.module';
import { EndpointsService, endpointsGuard } from './endpoints.service';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';

describe('EndpointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        EndpointsService,
        UtilsService,
        SessionService,
        provideZonelessChangeDetection(),
      ],
      imports: [
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EndpointsService], (service: EndpointsService) => {
    expect(service).toBeTruthy();
  }));
});

describe('endpointsGuard runs', () => {
  const route = {} as ActivatedRouteSnapshot;
  const routeState = { url: '/home' } as RouterStateSnapshot;
  const auth = signal<AuthState | undefined>(undefined);
  const loading = signal(true);
  // Every read comes from a live watcher, so the counts after a change are
  // the watchers left behind. The endpoint status is a computed over
  // loading, so any number of status watchers reads loading once.
  let authReads = 0;
  let loadingReads = 0;
  let haveRegistered = true;
  let navigate: ReturnType<typeof vi.fn>;

  function authState(valid: boolean): AuthState {
    return { loggedIn: true, verifying: false, sessionData: { valid } } as AuthState;
  }

  function runGuard(): boolean[] {
    const results: boolean[] = [];
    const guard$ = TestBed.runInInjectionContext(() => endpointsGuard(route, routeState)) as Observable<boolean>;
    guard$.subscribe(result => results.push(result));
    return results;
  }

  beforeEach(() => {
    authReads = 0;
    loadingReads = 0;
    haveRegistered = true;
    auth.set(authState(true));
    loading.set(false);
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { navigate } },
        {
          provide: AuthDataService,
          useValue: { auth: () => { authReads++; return auth(); } },
        },
        {
          provide: EndpointsDataService,
          useValue: { loading: () => { loadingReads++; return loading(); }, error: signal(null) },
        },
        {
          provide: EndpointsService,
          useValue: {
            haveRegistered$: defer(() => of(haveRegistered)),
            haveConnected$: of(true),
            disablePersistenceFeatures$: of(false),
          },
        },
        { provide: UserService, useValue: { isAdmin$: of(true), isEndpointAdmin$: of(false) } },
        { provide: SessionService, useValue: { userEndpointsEnabled: () => of(false) } },
      ],
    });
  });

  it('allows navigation when endpoints are registered and connected', () => {
    const results = runGuard();
    TestBed.tick();
    expect(results).toEqual([true]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('waits for endpoints to load, then redirects an admin with none registered', () => {
    haveRegistered = false;
    loading.set(true);
    const results = runGuard();
    TestBed.tick();
    expect(results).toEqual([]);

    loading.set(false);
    TestBed.tick();
    expect(results).toEqual([false]);
    expect(navigate).toHaveBeenCalledWith(['/endpoints']);
  });

  it('leaves no auth or status watcher behind after it resolves', () => {
    const runs = [runGuard(), runGuard(), runGuard()];
    TestBed.tick();
    expect(runs).toEqual([[true], [true], [true]]);

    authReads = 0;
    loadingReads = 0;
    auth.set(authState(false));
    loading.set(true);
    TestBed.tick();
    expect(authReads).toBe(0);
    expect(loadingReads).toBe(0);
  });
});
