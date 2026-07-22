import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { CfAppAutoscalerEventsSignalConfigService } from './cf-app-autoscaler-events-signal-config.service';

const CNSI = 'cnsi-1';
const APP = 'app-1';
const EVENTS_URL = `/pp/v1/autoscaler/apps/${APP}/event`;

const event = (overrides: Partial<AppAutoscalerEvent> = {}): AppAutoscalerEvent => ({
  app_id: APP,
  error: '',
  message: '',
  new_instances: 2,
  old_instances: 1,
  reason: '',
  scaling_type: 0,
  status: 0,
  timestamp: 1_700_000_000_000_000_000,
  ...overrides,
});

describe('CfAppAutoscalerEventsSignalConfigService', () => {
  let svc: CfAppAutoscalerEventsSignalConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CfAppAutoscalerEventsSignalConfigService,
      ],
    });
    svc = TestBed.inject(CfAppAutoscalerEventsSignalConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts empty and not loaded', () => {
    svc.initialize(CNSI, APP);
    expect(svc.events()).toEqual([]);
    expect(svc.hasLoadedOnce()).toBe(false);
    expect(svc.view.totalFilteredResults()).toBe(0);
  });

  it('initialize does not stack a filter effect on re-entry', () => {
    // Regression: root singleton, but the scale-history page calls
    // initialize() from its constructor per mount. The filter effect was
    // created uncaptured, so each navigation stacked a live effect on the
    // root injector. The fix captures the EffectRef and destroys the prior.
    svc.initialize(CNSI, APP);
    svc.initialize(CNSI, APP);
    TestBed.tick();

    const setSpy = vi.spyOn(svc.filter, 'set');
    svc.nameFilter.set('scale');
    TestBed.tick();

    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('loadAll() resolves (not rejects) when the fetch fails', async () => {
    // load() rethrows on HTTP error after recording it in its error()
    // signal; the page calls `void loadAll()`, so loadAll must swallow the
    // rejection rather than surface it as an unhandled promise rejection.
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();
    httpMock.expectOne(EVENTS_URL).flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(promise).resolves.toBeUndefined();
    expect(svc.hasLoadedOnce()).toBe(true);
  });

  it('loadAll() fetches events through the autoscaler URL with cnsi headers', async () => {
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();

    const req = httpMock.expectOne(EVENTS_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-cap-api-host')).toBe('autoscaler');
    expect(req.request.headers.get('x-cap-cnsi-list')).toBe(CNSI);

    req.flush({
      total_results: 2,
      total_pages: 1,
      resources: [
        event({ timestamp: 200, status: 0 }),
        event({ timestamp: 100, status: 1 }),
      ],
    });
    await promise;

    expect(svc.hasLoadedOnce()).toBe(true);
    expect(svc.events().length).toBe(2);
    // Default sort = timestamp desc, so the larger timestamp comes first.
    expect(svc.view.pagedItems()[0].timestamp).toBe(200);
  });

  it('nameFilter filters across message / reason / error', async () => {
    const appRef = TestBed.inject(ApplicationRef);
    svc.initialize(CNSI, APP);
    const promise = svc.loadAll();
    httpMock.expectOne(EVENTS_URL).flush({
      total_results: 3,
      total_pages: 1,
      resources: [
        event({ message: 'cpu high', timestamp: 3 }),
        event({ reason: 'scheduled scale-up', timestamp: 2 }),
        event({ error: 'broker unavailable', timestamp: 1 }),
      ],
    });
    await promise;

    // Effect bound by initialize() flushes via appRef.tick(); without it the
    // filter signal stays at the identity () => true so we'd see all 3 rows.
    svc.nameFilter.set('broker');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);
    svc.nameFilter.set('scale');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(1);
    svc.nameFilter.set('');
    appRef.tick();
    expect(svc.view.totalFilteredResults()).toBe(3);
  });

  it('clearFilters resets nameFilter, sort, and pageIndex', async () => {
    svc.initialize(CNSI, APP);
    svc.nameFilter.set('foo');
    svc.sort.set({ field: 'status', direction: 'asc' });
    svc.pageIndex.set(2);

    svc.clearFilters();

    expect(svc.nameFilter()).toBe('');
    expect(svc.sort().field).toBe('timestamp');
    expect(svc.sort().direction).toBe('desc');
    expect(svc.pageIndex()).toBe(0);
  });

  it('refresh() re-issues the events fetch', async () => {
    svc.initialize(CNSI, APP);
    const p1 = svc.loadAll();
    httpMock.expectOne(EVENTS_URL).flush({ total_results: 0, total_pages: 0, resources: [] });
    await p1;

    const p2 = svc.refresh();
    httpMock.expectOne(EVENTS_URL).flush({ total_results: 0, total_pages: 0, resources: [] });
    await p2;
  });
});
