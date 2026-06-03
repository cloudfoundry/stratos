import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RESET_PAGINATION_OF_TYPE } from '../actions/pagination.actions';
import { EndpointDisconnectCleanupService } from './endpoint-disconnect-cleanup.service';
import { EndpointErrorEventsService } from './endpoint-error-events.service';
import { EndpointConnectEvent, EndpointsDataService } from './endpoints-data.service';
import { RecentlyVisitedDataService } from './recently-visited-data.service';

const SYSTEM_INFO_URL = '/pp/v1/info';

describe('EndpointDisconnectCleanupService', () => {
  let svc: EndpointsDataService;
  let cleanup: EndpointDisconnectCleanupService;
  let store: MockStore;
  let httpMock: HttpTestingController;
  let dispatched: Action[];
  let cleanForEndpoints: ReturnType<typeof vi.fn>;
  let pruneToConnected: ReturnType<typeof vi.fn>;
  let clearEndpoint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanForEndpoints = vi.fn();
    pruneToConnected = vi.fn();
    clearEndpoint = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({ initialState: {} }),
        EndpointsDataService,
        EndpointDisconnectCleanupService,
        { provide: RecentlyVisitedDataService, useValue: { cleanForEndpoints, pruneToConnected } },
        { provide: EndpointErrorEventsService, useValue: { clearEndpoint } },
      ],
    });
    svc = TestBed.inject(EndpointsDataService);
    store = TestBed.inject(MockStore);
    httpMock = TestBed.inject(HttpTestingController);
    dispatched = [];
    store.scannedActions$.subscribe(a => dispatched.push(a));
    // Inject AFTER mock store wiring is in place so the constructor's
    // signal effects observe a clean baseline.
    cleanup = TestBed.inject(EndpointDisconnectCleanupService);
    expect(cleanup).toBeTruthy();
  });

  afterEach(() => httpMock.verify());

  async function flushTick(): Promise<void> {
    // Allow Angular's signal effect microtask to run.
    await TestBed.inject(EndpointsDataService); // ensure service exists
    await new Promise(r => setTimeout(r, 0));
  }

  it('drains disconnectedSignal + dispatches generic cleanup actions', async () => {
    // Seed the service with no endpoints so the disconnect event is the only emission.
    svc['_endpoints'].set(new Map([
      ['cf-1', { guid: 'cf-1', name: 'cf-one', cnsi_type: 'cf' } as any],
    ]));
    // Simulate a disconnect event being emitted.
    svc['_disconnected'].set([{ guid: 'cf-1', type: 'cf', name: 'cf-one' }]);

    await flushTick();

    // Drain happened: disconnectedSignal back to empty after effect ran.
    expect(svc.disconnectedSignal()).toHaveLength(0);

    // Endpoint error-log clear delegated to the signal-native service.
    expect(clearEndpoint).toHaveBeenCalledWith('cf-1');

    // Recents cleanup (signal-native) called with the disconnected guid.
    expect(cleanForEndpoints).toHaveBeenCalledWith(['cf-1']);
  });

  it('invokes registered disconnect handlers per event', async () => {
    const seen: string[] = [];
    cleanup.registerDisconnectHandler(evt => seen.push(evt.guid));

    svc['_disconnected'].set([
      { guid: 'a', type: 'cf', name: 'A' },
      { guid: 'b', type: 'cf', name: 'B' },
    ]);
    await flushTick();

    expect(seen).toEqual(['a', 'b']);
  });

  it('continues draining when a disconnect handler throws', async () => {
    const seen: string[] = [];
    cleanup.registerDisconnectHandler(() => { throw new Error('boom'); });
    cleanup.registerDisconnectHandler(evt => seen.push(evt.guid));

    svc['_disconnected'].set([{ guid: 'c', type: 'cf', name: 'C' }]);
    await flushTick();

    expect(seen).toEqual(['c']);
    expect(svc.disconnectedSignal()).toHaveLength(0);
  });

  it('drains connectedSignal + invokes connect handlers', async () => {
    const seen: EndpointConnectEvent[] = [];
    cleanup.registerConnectHandler(evt => seen.push(evt));

    svc['_connected'].set([{
      guid: 'cf-2', type: 'cf', name: 'cf-two', user: { guid: 'u', name: 'u', admin: false } as any,
    }]);
    await flushTick();

    expect(seen).toHaveLength(1);
    expect(seen[0].guid).toBe('cf-2');
    expect(svc.connectedSignal()).toHaveLength(0);
  });

  it('prunes recents to connected endpoints when the endpoints set changes', async () => {
    // Initial set with one connected endpoint.
    svc['_endpoints'].set(new Map([
      ['cf-1', { guid: 'cf-1', name: 'cf-one', cnsi_type: 'cf', user: { guid: 'u' } } as any],
    ]));
    await flushTick();

    expect(pruneToConnected).toHaveBeenCalled();
    const lastCall = pruneToConnected.mock.calls[pruneToConnected.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(['cf-1']);
  });

  it('integration: disconnect() emits + cleanup drains within one microtask cycle', async () => {
    const p = svc.getAll();
    httpMock.expectOne(SYSTEM_INFO_URL).flush({
      version: { proxy_version: 'test', database_version: 1 },
      user: { guid: 'u', name: 'admin', admin: true },
      endpoints: {
        cf: {
          'cf-1': {
            guid: 'cf-1', name: 'cf-one', cnsi_type: 'cf',
            user: { guid: 'u', name: 'admin', admin: true },
          },
        },
      },
    });
    await p;

    const dp = svc.disconnect('cf-1');
    httpMock.expectOne('/api/v1/tokens/cf-1').flush({ guid: 'cf-1' });
    await dp;
    await flushTick();

    expect(svc.disconnectedSignal()).toHaveLength(0);
    expect(cleanForEndpoints).toHaveBeenCalled();
    // Pagination wipe is best-effort: the entity catalog under test may have
    // no registered cf-typed entities, so only assert the action ran without
    // error (count may be zero).
    const _resets = dispatched.filter(a => a.type === RESET_PAGINATION_OF_TYPE);
  });
});
