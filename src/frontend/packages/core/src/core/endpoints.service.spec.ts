import { inject, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthDataService, AuthState, EndpointModel, EndpointsDataService, entityCatalog } from '@stratosui/store';
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

  it('reports metrics for an endpoint a metrics endpoint covers', async () => {
    const service = TestBed.inject(EndpointsService);
    const data = TestBed.inject(EndpointsDataService);
    vi.spyOn(data, 'whenReady').mockResolvedValue(undefined);
    vi.spyOn(data, 'endpoints').mockReturnValue(new Map([
      ['cf-covered', { guid: 'cf-covered', metadata: { metrics: 'metrics-guid' } } as EndpointModel],
      ['cf-plain', { guid: 'cf-plain', metadata: {} } as EndpointModel],
    ]));

    expect(await firstValueFrom(service.hasMetrics('cf-covered'))).toBe(true);
    expect(await firstValueFrom(service.hasMetrics('cf-plain'))).toBe(false);
    expect(await firstValueFrom(service.hasMetrics('cf-unknown'))).toBe(false);
  });
  // The endpoints page's 30-second check re-reads the list and then checks
  // it. The check read toObservable(endpoints), which replays the value its
  // effect last pushed; that effect runs at the next change detection, so
  // the check saw the list from before the re-read and probed an endpoint
  // the server had just reported disconnected.
  it('checks the endpoint list as it is now, not as last emitted', async () => {
    const data = TestBed.inject(EndpointsDataService);
    const list = signal(new Map([['ep', { guid: 'ep', connectionStatus: 'connected' } as EndpointModel]]));
    vi.spyOn(data, 'endpoints').mockImplementation(() => list());
    const service = TestBed.inject(EndpointsService);
    await TestBed.inject(ApplicationRef).whenStable();

    const checked: string[] = [];
    vi.spyOn(service, 'checkEndpoint').mockImplementation(ep => { checked.push(`${ep.guid}:${ep.connectionStatus}`); });
    list.set(new Map([['ep', { guid: 'ep', connectionStatus: 'disconnected' } as EndpointModel]]));
    service.checkAllEndpoints();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(checked).toEqual(['ep:disconnected']);
  });

  // Gates the main navigation's items for an endpoint type.
  it('reports no connected endpoint of a type until one connects', async () => {
    const data = TestBed.inject(EndpointsDataService);
    const list = signal(new Map([
      ['cf-1', { guid: 'cf-1', cnsi_type: 'cf', connectionStatus: 'disconnected' } as EndpointModel],
      ['k8s-1', { guid: 'k8s-1', cnsi_type: 'k8s', connectionStatus: 'connected' } as EndpointModel],
    ]));
    vi.spyOn(data, 'endpoints').mockImplementation(() => list());
    vi.spyOn(entityCatalog, 'getEndpoint').mockReturnValue({ definition: { unConnectable: false } } as never);
    const none = TestBed.inject(EndpointsService).noConnectedEndpointOfType('cf');

    expect(none()).toBe(true);
    list.set(new Map([['cf-1', { guid: 'cf-1', cnsi_type: 'cf', connectionStatus: 'connected' } as EndpointModel]]));
    expect(none()).toBe(false);
  });
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
            haveRegistered: () => haveRegistered,
            haveConnected: () => true,
            disablePersistenceFeatures: () => false,
          },
        },
        { provide: UserService, useValue: { isAdmin: () => true, isEndpointAdmin: () => false } },
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
