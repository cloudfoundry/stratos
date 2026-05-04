import { HttpClient, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouteActionsService, type CreateRouteRequest } from './app-route-actions.service';
import { ApplicationService } from '../../features/applications/application.service';
import type { StratosJob } from '../../services/async-jobs/async-job.types';
import { StratosJobError } from '../../services/async-jobs/async-job.types';
import type { StRoute } from '../../services/endpoint-data/stratos-types';

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

// ---------------------------------------------------------------------------
// Test fixtures for attach + create suites
// ---------------------------------------------------------------------------

function makeStRoute(overrides: Partial<StRoute> = {}): StRoute {
  return {
    guid: 'route-NEW',
    url: 'my-host.example.com',
    host: 'my-host',
    path: '',
    domainGuid: 'domain-1',
    spaceGuid: 'space-1',
    cnsiGuid: 'cf-1',
    createdAt: '2026-05-04T00:00:00Z',
    updatedAt: '2026-05-04T00:00:00Z',
    ...overrides,
  };
}

function makeCreateReq(): CreateRouteRequest {
  return {
    host: 'my-host',
    path: '',
    relationships: {
      space: { data: { guid: 'space-1' } },
      domain: { data: { guid: 'domain-1' } },
    },
  };
}

// Richer HttpClient stub covering put/post/delete — each impl is optional
// and individual tests rebuild as needed via configureRich.
function makeRichHttpStub(opts: {
  put?: () => any;
  post?: () => any;
  delete?: () => any;
} = {}) {
  return {
    put: vi.fn(opts.put ?? (() => of(null))),
    post: vi.fn(opts.post ?? (() => of(makeStRoute()))),
    delete: vi.fn(opts.delete ?? (() => of(null))),
  } as unknown as HttpClient & {
    put: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

// ---------------------------------------------------------------------------
// Suite — attachRoute (sync PUT, no body, no job)
// ---------------------------------------------------------------------------

describe('AppRouteActionsService — attachRoute', () => {
  let svc: AppRouteActionsService;
  let http: ReturnType<typeof makeRichHttpStub>;

  function configure(httpStub = makeRichHttpStub()) {
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

  it('attachRoute fires PUT to /pp/v1/cf/apps/{cnsi}/{app}/routes/{routeGuid} with empty body', async () => {
    await svc.attachRoute('route-A');

    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.put).toHaveBeenCalledWith('/pp/v1/cf/apps/cf-1/app-1/routes/route-A', {});
  });

  it('attachRoute sets transitioningRouteGuid to the target routeGuid mid-flight; clears on success', async () => {
    const gate = new Subject<unknown>();
    configure(makeRichHttpStub({ put: () => gate.asObservable() }));

    const promise = svc.attachRoute('route-A');
    await tick();

    expect(svc.transitioningRouteGuid()).toBe('route-A');
    expect(svc.inFlight()).toBe(true);

    gate.next(null);
    gate.complete();
    await promise;

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('attachRoute resolves to void (handler returns empty body)', async () => {
    const result = await svc.attachRoute('route-A');
    expect(result).toBeUndefined();
  });

  it('attachRoute clears the signal and surfaces the error on HTTP failure', async () => {
    const err = new Error('CF-RouteNotFound');
    configure(makeRichHttpStub({ put: () => throwError(() => err) }));

    await expect(svc.attachRoute('route-A')).rejects.toBe(err);

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('rejects a second attachRoute while a first is still in flight', async () => {
    const gate = new Subject<unknown>();
    configure(makeRichHttpStub({ put: () => gate.asObservable() }));

    const first = svc.attachRoute('route-A');
    await tick();

    await expect(svc.attachRoute('route-B')).rejects.toThrow(/already in flight/i);
    expect(svc.transitioningRouteGuid()).toBe('route-A');

    gate.next(null);
    gate.complete();
    await first;
    expect(svc.transitioningRouteGuid()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Suite — createRoute (sync POST, returns StRoute)
// ---------------------------------------------------------------------------

describe('AppRouteActionsService — createRoute', () => {
  let svc: AppRouteActionsService;
  let http: ReturnType<typeof makeRichHttpStub>;

  function configure(httpStub = makeRichHttpStub()) {
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

  it('createRoute fires POST to /pp/v1/cf/routes/{cnsi} with the request body', async () => {
    const req = makeCreateReq();
    await svc.createRoute(req);

    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/routes/cf-1', req);
  });

  it('createRoute sets transitioningRouteGuid to the sentinel "new" mid-flight; clears on success', async () => {
    const gate = new Subject<StRoute>();
    configure(makeRichHttpStub({ post: () => gate.asObservable() }));

    const promise = svc.createRoute(makeCreateReq());
    await tick();

    expect(svc.transitioningRouteGuid()).toBe('new');
    expect(svc.inFlight()).toBe(true);

    gate.next(makeStRoute());
    gate.complete();
    await promise;

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('createRoute returns the created StRoute from the response body', async () => {
    const created = makeStRoute({ guid: 'route-CREATED', url: 'created.example.com' });
    configure(makeRichHttpStub({ post: () => of(created) }));

    const result = await svc.createRoute(makeCreateReq());
    expect(result).toEqual(created);
  });

  it('createRoute clears the signal and surfaces the error on HTTP failure', async () => {
    const err = new Error('CF-RouteHostTaken');
    configure(makeRichHttpStub({ post: () => throwError(() => err) }));

    await expect(svc.createRoute(makeCreateReq())).rejects.toBe(err);

    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('rejects a second createRoute while a first is still in flight', async () => {
    const gate = new Subject<StRoute>();
    configure(makeRichHttpStub({ post: () => gate.asObservable() }));

    const first = svc.createRoute(makeCreateReq());
    await tick();

    await expect(svc.createRoute(makeCreateReq())).rejects.toThrow(/already in flight/i);
    expect(svc.transitioningRouteGuid()).toBe('new');

    gate.next(makeStRoute());
    gate.complete();
    await first;
    expect(svc.transitioningRouteGuid()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Suite — createAndAttachRoute (two-step: POST then PUT)
// ---------------------------------------------------------------------------

describe('AppRouteActionsService — createAndAttachRoute', () => {
  let svc: AppRouteActionsService;
  let http: ReturnType<typeof makeRichHttpStub>;

  function configure(httpStub = makeRichHttpStub()) {
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

  it('happy path: creates then attaches; returns the created StRoute', async () => {
    const created = makeStRoute({ guid: 'route-CREATED', url: 'created.example.com' });
    configure(makeRichHttpStub({ post: () => of(created), put: () => of(null) }));

    const result = await svc.createAndAttachRoute(makeCreateReq());

    expect(result).toEqual(created);
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith('/pp/v1/cf/routes/cf-1', makeCreateReq());
    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.put).toHaveBeenCalledWith('/pp/v1/cf/apps/cf-1/app-1/routes/route-CREATED', {});
    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('orphan path: create succeeds, attach fails — error names the orphan guid + url and exposes orphanRoute', async () => {
    const created = makeStRoute({ guid: 'route-ORPHAN', url: 'orphan.example.com' });
    const attachErr = new Error('CF-DestinationConflict');
    configure(makeRichHttpStub({ post: () => of(created), put: () => throwError(() => attachErr) }));

    let caught: Error | undefined;
    try {
      await svc.createAndAttachRoute(makeCreateReq());
    } catch (e) {
      caught = e as Error;
    }

    expect(caught).toBeDefined();
    expect(caught!.message).toContain('Orphan route in space');
    expect(caught!.message).toContain('route-ORPHAN');
    expect(caught!.message).toContain('orphan.example.com');
    expect(caught!.message).toContain('CF-DestinationConflict');
    expect((caught as unknown as { orphanRoute: StRoute }).orphanRoute).toEqual(created);

    // Both legs were called exactly once — no auto-delete cleanup attempt.
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.put).toHaveBeenCalledTimes(1);
    expect(http.delete).not.toHaveBeenCalled();
    expect(svc.transitioningRouteGuid()).toBeNull();
    expect(svc.inFlight()).toBe(false);
  });

  it('rejects when another verb is already in flight; does not call create or attach', async () => {
    const gate = new Subject<unknown>();
    // Wire delete to the gate so we can park an in-flight unmap, then try
    // to invoke createAndAttachRoute concurrently.
    configure(makeRichHttpStub({ delete: () => gate.asObservable() }));

    const inflight = svc.unmapRoute('route-OTHER');
    await tick();
    expect(svc.inFlight()).toBe(true);

    await expect(svc.createAndAttachRoute(makeCreateReq())).rejects.toThrow(/already in flight/i);

    // Neither the POST nor the PUT should have fired.
    expect(http.post).not.toHaveBeenCalled();
    expect(http.put).not.toHaveBeenCalled();

    gate.next(null);
    gate.complete();
    await inflight;
    expect(svc.transitioningRouteGuid()).toBeNull();
  });
});
