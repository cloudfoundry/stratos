import { HttpClient, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouteActionsService } from './app-route-actions.service';
import { ApplicationService } from '../../features/applications/application.service';
import type { StratosJob } from '../../services/async-jobs/async-job.types';
import { StratosJobError } from '../../services/async-jobs/async-job.types';

// ---------------------------------------------------------------------------
// Stubs — minimal: only the surface this service touches.
// ---------------------------------------------------------------------------

function makeAppServiceStub(cfGuid = 'cf-1', appGuid = 'app-1') {
  return { cfGuid, appGuid };
}

// HttpClient stub for unmap tests (sync DELETE path; no writeWithJob).
// Each test wires its own delete() implementation.
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
// Suite — unmap + idle (uses simple HttpClient stub, no jobs involved)
// ---------------------------------------------------------------------------

describe('AppRouteActionsService — unmap + idle', () => {
  let svc: AppRouteActionsService;
  let http: ReturnType<typeof makeHttpStub>;

  function configure(httpStub = makeHttpStub()) {
    TestBed.resetTestingModule();
    http = httpStub;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppRouteActionsService,
        { provide: HttpClient, useValue: http },
        { provide: ApplicationService, useValue: makeAppServiceStub() },
      ],
    });

    svc = TestBed.inject(AppRouteActionsService);
  }

  beforeEach(() => {
    configure();
  });

  it('starts idle: transitioningRouteGuid is null and inFlight is false', () => {
    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('unmapRoute(g) sets transitioningRouteGuid during flight, clears on success', async () => {
    // Hold the DELETE response open so we can observe the mid-flight state.
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const promise = svc.unmapRoute('route-A');
    await tick();

    expect(svc.transitioningRouteGuid()).toBe('route-A');
    expect(svc.inFlight()).toBe(true);

    gate.next(null);
    gate.complete();
    await promise;

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('unmapRoute fires DELETE to the correct (cnsi, route, app) URL', async () => {
    await svc.unmapRoute('route-A');

    expect(http.delete).toHaveBeenCalledTimes(1);
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/routes/cf-1/route-A/apps/app-1');
  });

  it('unmapRoute resets transitioningRouteGuid to null on HTTP 500', async () => {
    configure(makeHttpStub(() => throwError(() => new Error('500 internal server error'))));

    await expect(svc.unmapRoute('route-A')).rejects.toThrow('500');

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('unmapRoute surfaces the underlying error via Promise rejection', async () => {
    const err = new Error('CF-RouteNotFound');
    configure(makeHttpStub(() => throwError(() => err)));

    await expect(svc.unmapRoute('route-A')).rejects.toBe(err);
  });

  // -------------------------------------------------------------------------
  // Reentrancy guard — mirrors slice-2's last-call-rejects shape.
  // -------------------------------------------------------------------------

  it('rejects a second unmapRoute while a first is still in flight', async () => {
    const gate = new Subject<unknown>();
    configure(makeHttpStub(() => gate.asObservable()));

    const first = svc.unmapRoute('route-A');
    await tick();

    await expect(svc.unmapRoute('route-B')).rejects.toThrow(/already in flight/i);

    // First call's transitioningRouteGuid unchanged by the rejected second call.
    expect(svc.transitioningRouteGuid()).toBe('route-A');

    gate.next(null);
    gate.complete();
    await first;
    expect(svc.transitioningRouteGuid()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Suite — deleteRoute (writeWithJob-driven; uses HttpTestingController so the
// 200/202 response shape and job poll are realistic)
// ---------------------------------------------------------------------------

describe('AppRouteActionsService — deleteRoute', () => {
  let svc: AppRouteActionsService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AppRouteActionsService,
        { provide: ApplicationService, useValue: makeAppServiceStub() },
      ],
    });
    svc = TestBed.inject(AppRouteActionsService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('settles via writeWithJob 200 fast-path; signal holds through the call', async () => {
    const promise = svc.deleteRoute('route-A');
    await tick();

    // Mid-flight: transitioning is set, request is open.
    expect(svc.transitioningRouteGuid()).toBe('route-A');
    expect(svc.inFlight()).toBe(true);

    ctrl.expectOne('/pp/v1/cf/routes/cf-1/route-A').flush(null, { status: 200, statusText: 'OK' });
    await promise;

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('settles via 202 + job COMPLETE; signal stays set until job terminates', async () => {
    const promise = svc.deleteRoute('route-A');
    await tick();

    // 202 handoff — signal MUST still be set; the row spinner depends on this.
    ctrl.expectOne('/pp/v1/cf/routes/cf-1/route-A').flush(
      { id: 'job-1', kind: 'cf.route.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();
    expect(svc.transitioningRouteGuid()).toBe('route-A');

    // Terminal COMPLETE on the first poll — wait past the default 500ms
    // backoff (writeWithJob doesn't expose its backoff knob through this
    // service, by design). Then signal clears once promise resolves.
    await new Promise((r) => setTimeout(r, 600));
    ctrl.expectOne('/pp/v1/stratos/jobs/job-1').flush(
      { id: 'job-1', kind: 'cf.route.delete', state: 'COMPLETE', startedAt: '', updatedAt: '' } satisfies StratosJob,
    );
    await promise;

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('clears the signal and surfaces the error when the polled job fails', async () => {
    const promise = svc.deleteRoute('route-A');
    await tick();

    ctrl.expectOne('/pp/v1/cf/routes/cf-1/route-A').flush(
      { id: 'job-f', kind: 'cf.route.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();
    // Wait past the default 500ms backoff before the first poll.
    await new Promise((r) => setTimeout(r, 600));

    const failed: StratosJob = {
      id: 'job-f',
      kind: 'cf.route.delete',
      state: 'FAILED',
      startedAt: '',
      updatedAt: '',
      errors: [{ code: 'cf.v3.invalid', message: 'route still bound' }],
    };
    ctrl.expectOne('/pp/v1/stratos/jobs/job-f').flush(failed);

    await expect(promise).rejects.toBeInstanceOf(StratosJobError);

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });
});
