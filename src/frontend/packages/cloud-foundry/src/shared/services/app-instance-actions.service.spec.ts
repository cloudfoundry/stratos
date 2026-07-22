import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';

import { AppInstanceActionsService } from './app-instance-actions.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';
import { ApplicationService } from '../../features/applications/application.service';

// ---------------------------------------------------------------------------
// Stubs — minimal: only the surface this service touches.
// ---------------------------------------------------------------------------

function makeAppServiceStub(cfGuid = 'cf-1', appGuid = 'app-1') {
  return { cfGuid, appGuid };
}

function makeDataServiceStub() {
  return {
    // Slice-1 surface, narrowed to what this service reads/calls.
    stats: signal([]),
    refresh: vi.fn(async (_kind?: string) => undefined),
  };
}

// HttpClient stub: each test wires its own delete() implementation. By
// default an immediate of(null) so happy path is fast.
function makeHttpStub(deleteImpl?: () => any) {
  return {
    delete: vi.fn(deleteImpl ?? (() => of(null))),
  } as unknown as HttpClient & { delete: ReturnType<typeof vi.fn> };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tick(n = 4): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AppInstanceActionsService', () => {
  let svc: AppInstanceActionsService;
  let http: ReturnType<typeof makeHttpStub>;
  let dataService: ReturnType<typeof makeDataServiceStub>;

  function configure(httpStub = makeHttpStub()) {
    TestBed.resetTestingModule();
    http = httpStub;
    dataService = makeDataServiceStub();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppInstanceActionsService,
        { provide: HttpClient, useValue: http },
        { provide: ApplicationService, useValue: makeAppServiceStub() },
        { provide: AppDetailDataService, useValue: dataService },
      ],
    });

    svc = TestBed.inject(AppInstanceActionsService);
  }

  beforeEach(() => {
    configure();
  });

  // -------------------------------------------------------------------------
  // Idle state
  // -------------------------------------------------------------------------

  it('starts idle: transitioningIndex is null and inFlight is false', () => {
    expect(svc.transitioningIndex()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('killInstance(2) sets transitioningIndex during flight, resets to null on success', async () => {
    // Hold the DELETE response open with a Subject so we can observe the
    // mid-flight signal state before resolving.
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const promise = svc.killInstance(2);
    await tick();

    expect(svc.transitioningIndex()).toBe(2);
    expect(svc.inFlight()).toBe(true);

    gate.next(null);
    gate.complete();
    await promise;

    expect(svc.transitioningIndex()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('killInstance fires DELETE to the correct URL with the given index', async () => {
    await svc.killInstance(7);

    expect(http.delete).toHaveBeenCalledTimes(1);
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/apps/cf-1/app-1/instances/7');
  });

  it('killInstance refreshes stats on success', async () => {
    await svc.killInstance(0);

    expect(dataService.refresh).toHaveBeenCalledWith('stats');
  });

  it('killInstance does not request a full refresh (stats only — slice-1 flicker lesson)', async () => {
    await svc.killInstance(1);

    // refresh('all') would re-fetch app/space/org/domains and cause card-wide
    // flicker. Slice-1 settled on per-kind refresh; mirror that.
    expect(dataService.refresh).not.toHaveBeenCalledWith('all');
    expect(dataService.refresh).toHaveBeenCalledWith('stats');
  });

  // -------------------------------------------------------------------------
  // Error path
  // -------------------------------------------------------------------------

  it('killInstance resets transitioningIndex to null on HTTP 500', async () => {
    configure(makeHttpStub(() => throwError(() => new Error('500 internal server error'))));

    await expect(svc.killInstance(2)).rejects.toThrow('500');

    expect(svc.transitioningIndex()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('killInstance surfaces the underlying error via Promise rejection', async () => {
    const err = new Error('CF-InstanceNotFound');
    configure(makeHttpStub(() => throwError(() => err)));

    await expect(svc.killInstance(5)).rejects.toBe(err);
  });

  it('killInstance does not refresh stats when the DELETE fails', async () => {
    configure(makeHttpStub(() => throwError(() => new Error('forbidden'))));

    await expect(svc.killInstance(0)).rejects.toThrow();

    expect(dataService.refresh).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Reentrancy guard — mirrors slice-1's lifecycle.inFlight rejection shape
  // -------------------------------------------------------------------------

  it('rejects a second killInstance while a first is still in flight', async () => {
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const first = svc.killInstance(2);
    await tick();

    // Second call while inFlight rejects — overlapping per-instance verbs
    // would scramble transitioningIndex and the per-row spinner.
    await expect(svc.killInstance(3)).rejects.toThrow(/already in flight/i);

    // First call's transitioningIndex unchanged by the rejected second call.
    expect(svc.transitioningIndex()).toBe(2);

    // Resolve first to leave the suite clean.
    gate.next(null);
    gate.complete();
    await first;
    expect(svc.transitioningIndex()).toBeNull();
  });
});
