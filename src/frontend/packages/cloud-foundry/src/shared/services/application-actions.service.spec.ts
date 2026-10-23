import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { AppApplicationActionsService } from './application-actions.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';
import { AppLifecycleStateService } from '../../features/applications/app-lifecycle-state.service';
import { ApplicationService } from '../../features/applications/application.service';
import { CloudFoundryEndpointService } from '../../features/cf/services/cloud-foundry-endpoint.service';
import { CfAppsSignalConfigService } from '../signal-list-configs/app/cf-apps-signal-config.service';
import { ConfirmationDialogService, TailwindSnackBarService } from '@stratosui/core';
import { StratosJobError, type StratosJob, type JobStage } from '../../services/async-jobs/async-job.types';

import {
  generateCfStoreModules,
} from '@test-framework/cloud-foundry-endpoint-service.helper';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

// What writeWithJob throws when a polled job ends FAILED.
const failedJob = (error: { code: string; message: string; detail?: string }) =>
  new StratosJobError({ id: 'j', kind: 'k', state: 'FAILED', startedAt: '', updatedAt: '', errors: [error] });

function makeAppServiceStub(cfGuid = 'cf-1', appGuid = 'app-1') {
  return {
    cfGuid,
    appGuid,
    application$: new BehaviorSubject({ app: { entity: { name: 'test-app' } } }),
    appOrg$: new BehaviorSubject({ guid: 'test-org-guid', name: 'test-org' }),
    appSpace$: new BehaviorSubject({ guid: 'test-space-guid', name: 'test-space' }),
  };
}

function makeEndpointStub(cfName = 'test-cf') {
  return {
    endpoint$: new BehaviorSubject({ entity: { name: cfName } }),
    // Sync signal mirror — slice 1 added a sync read path on this service.
    endpoint: signal({ entity: { name: cfName } }),
  };
}

// AppDetailDataService stub: slice 1 made the actions service read app/org/
// space/stats sync via signals on the data service. Refresh accepts a
// 'kind' enum and returns a Promise.
function makeDataServiceStub(opts: { instances?: number, runningStats?: number } = {}) {
  const instances = opts.instances ?? 1;
  const running = opts.runningStats ?? instances;
  const stats = Array.from({ length: instances }, (_, i) => ({
    state: i < running ? 'RUNNING' : 'STARTING',
  }));
  return {
    app: signal({ entity: { name: 'test-app', instances } }),
    org: signal({ guid: 'test-org-guid', name: 'test-org' }),
    space: signal({ guid: 'test-space-guid', name: 'test-space' }),
    errors: signal<Record<string, unknown>>({}),
    stats: signal(stats),
    summary: signal({ memory: 256, disk_quota: 512 }),
    lastPolledAt: signal(new Date()),
    refresh: vi.fn(async (_kind?: string) => undefined),
  };
}

// Capture the latest onProgress callback so tests can replay it.
let capturedOnProgress: ((job: StratosJob) => void) | undefined;

function makeAppsStub() {
  const resolvers: Array<() => void> = [];
  function makeAction(_name: string) {
    return vi.fn<CfAppsSignalConfigService['restartApp']>(async (_cnsi, _app, opts) => {
      capturedOnProgress = opts?.onProgress;
      await new Promise<void>((r) => resolvers.push(r));
      return undefined;
    });
  }
  // Stub the wave-1 orchestrator surface used by the post-delete row-evict
  // wire-in. Tests assert removeRow is called on success and not on failure.
  const removeRow = vi.fn();
  return {
    startApp: makeAction('startApp'),
    stopApp: makeAction('stopApp'),
    restartApp: makeAction('restartApp'),
    restageApp: makeAction('restageApp'),
    // deleteWithCleanup orchestrates routes/bindings/app deletes serially.
    // Each is a thenable; tests resolve them via _resolveAll.
    deleteApp: vi.fn<CfAppsSignalConfigService['deleteApp']>(async () => {
      await new Promise<void>((r) => resolvers.push(r));
      return 'deleted';
    }),
    deleteRoute: vi.fn<CfAppsSignalConfigService['deleteRoute']>(async () => {
      await new Promise<void>((r) => resolvers.push(r));
      return 'deleted';
    }),
    deleteServiceBinding: vi.fn<CfAppsSignalConfigService['deleteServiceBinding']>(async () => {
      await new Promise<void>((r) => resolvers.push(r));
      return 'deleted';
    }),
    orchestrator: { removeRow },
    _removeRow: removeRow,
    _resolveAll: () => { resolvers.splice(0).forEach(r => r()); },
  };
}

// Call the dialog callback immediately (simulate user confirming).
const confirmDialogStub = {
  open: vi.fn((_cfg: unknown, cb: () => void) => cb()),
};

// Minimal cfEntityCatalog stubs — actions service calls these after success.
vi.mock('../../cf-entity-catalog', () => ({
  cfEntityCatalog: {
    application: { api: { get: vi.fn() } },
    appStats: {
      api: { getMultiple: vi.fn() },
      actions: { getMultiple: vi.fn(() => ({ paginationKey: 'pk' })) },
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tick(n = 4): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

function makeStage(code: string, index: number, of = 3): JobStage {
  return { code, label: code, index, of, enteredAt: new Date().toISOString() };
}

function makeJob(stages: JobStage[]): StratosJob {
  return {
    id: 'j-1', kind: 'lifecycle', state: 'PROCESSING',
    startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    stages,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AppApplicationActionsService', () => {
  let svc: AppApplicationActionsService;
  let appsStub: ReturnType<typeof makeAppsStub>;

  beforeEach(() => {
    capturedOnProgress = undefined;
    confirmDialogStub.open.mockClear();

    appsStub = makeAppsStub();

    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        // Register a stub /applications route so deleteWithCleanup's
        // post-success router.navigate(['/applications']) doesn't throw
        // NG04002 (no matching route) on the unhandled-rejection channel.
        provideRouter([{ path: 'applications', children: [] }]),
        AppApplicationActionsService,
        AppLifecycleStateService,
        { provide: ApplicationService, useValue: makeAppServiceStub() },
        { provide: CloudFoundryEndpointService, useValue: makeEndpointStub() },
        { provide: CfAppsSignalConfigService, useValue: appsStub },
        { provide: ConfirmationDialogService, useValue: confirmDialogStub },
        { provide: AppDetailDataService, useValue: makeDataServiceStub() },
      ],
    });

    svc = TestBed.inject(AppApplicationActionsService);
  });

  // -------------------------------------------------------------------------
  // Initial signal state
  // -------------------------------------------------------------------------

  it('starts with idle signal state', () => {
    expect(svc.inFlight()).toBe(false);
    expect(svc.verb()).toBeNull();
    expect(svc.progress()).toBeNull();
    expect(svc.currentStage()).toBeNull();
    expect(svc.log()).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // verb() flips during in-flight, resets after
  // -------------------------------------------------------------------------

  it('verb() flips to RESTAGING while in-flight then resets to null after linger', async () => {
    vi.useFakeTimers();
    try {
      void svc.restage();
      await tick();

      expect(svc.verb()).toBe('RESTAGING');
      expect(svc.inFlight()).toBe(true);
      expect(svc.showProgress()).toBe(true);

      appsStub._resolveAll();
      await tick(8);

      // inFlight clears immediately at finally; verb stays set during the
      // 10s linger so the snackbar can display the terminal state.
      expect(svc.inFlight()).toBe(false);
      expect(svc.verb()).toBe('RESTAGING');
      expect(svc.showProgress()).toBe(true);

      vi.advanceTimersByTime(10000);
      await tick();

      expect(svc.verb()).toBeNull();
      expect(svc.showProgress()).toBe(false);
      expect(svc.progress()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('verb() reflects STARTING for start action', async () => {
    void svc.start();
    await tick();
    expect(svc.verb()).toBe('STARTING');
    appsStub._resolveAll();
    await tick(8);
  });

  it('verb() reflects STOPPING for stop action', async () => {
    void svc.stop();
    await tick();
    expect(svc.verb()).toBe('STOPPING');
    appsStub._resolveAll();
    await tick(8);
  });

  it('verb() reflects RESTARTING for restart action', async () => {
    void svc.restart();
    await tick();
    expect(svc.verb()).toBe('RESTARTING');
    appsStub._resolveAll();
    await tick(8);
  });

  // -------------------------------------------------------------------------
  // progress() updates as onProgress fires
  // -------------------------------------------------------------------------

  it('progress() starts as empty array on begin, updates as onProgress fires', async () => {
    void svc.restage();
    await tick();

    // Immediately after begin: progress is []
    expect(svc.progress()).toEqual([]);

    const stage1 = makeStage('PACKAGE_LOOKUP', 1);
    capturedOnProgress?.(makeJob([stage1]));
    await tick();

    expect(svc.progress()).toEqual([stage1]);

    const stage2 = makeStage('BUILD_CREATE', 2);
    capturedOnProgress?.(makeJob([stage1, stage2]));
    await tick();

    expect(svc.progress()).toEqual([stage1, stage2]);

    appsStub._resolveAll();
    await tick(8);
  });

  // -------------------------------------------------------------------------
  // currentStage() reflects last stage in array
  // -------------------------------------------------------------------------

  it('currentStage() is null when progress is null (idle)', () => {
    expect(svc.currentStage()).toBeNull();
  });

  it('currentStage() is null when progress is empty array (begin, no stages yet)', async () => {
    void svc.restage();
    await tick();
    expect(svc.currentStage()).toBeNull();
    appsStub._resolveAll();
    await tick(8);
  });

  it('currentStage() reflects last stage after onProgress fires', async () => {
    void svc.restage();
    await tick();

    const stage1 = makeStage('PACKAGE_LOOKUP', 1);
    const stage2 = makeStage('BUILD_CREATE', 2);
    capturedOnProgress?.(makeJob([stage1, stage2]));
    await tick();

    expect(svc.currentStage()).toEqual(stage2);

    appsStub._resolveAll();
    await tick(8);
  });

  // -------------------------------------------------------------------------
  // log() captures begin → stage → success entries in order
  // -------------------------------------------------------------------------

  it('log() captures begin → stage → success entries in order', async () => {
    void svc.restage();
    await tick();

    // begin entry
    expect(svc.log()).toHaveLength(1);
    expect(svc.log()[0].event).toBe('begin');
    expect(svc.log()[0].verb).toBe('RESTAGING');

    const stage1 = makeStage('PACKAGE_LOOKUP', 1);
    capturedOnProgress?.(makeJob([stage1]));
    await tick();

    // stage entry
    expect(svc.log()).toHaveLength(2);
    expect(svc.log()[1].event).toBe('stage');
    expect(svc.log()[1].stage).toEqual(stage1);

    appsStub._resolveAll();
    await tick(8);

    // success entry
    const log = svc.log();
    expect(log[log.length - 1].event).toBe('success');
    expect(log.map(e => e.event)).toContain('begin');
    expect(log.map(e => e.event)).toContain('stage');
    expect(log.map(e => e.event)).toContain('success');
  });

  it('log() captures fail entry on error', async () => {
    appsStub.restageApp.mockImplementationOnce(async () => {
      throw failedJob({ code: 'CF-AppStaged', message: 'staging failed' });
    });

    void svc.restage();
    await tick(8);

    const log = svc.log();
    const failEntry = log.find(e => e.event === 'fail');
    expect(failEntry).toBeDefined();
    expect(failEntry?.error?.code).toBe('CF-AppStaged');
    expect(failEntry?.error?.message).toBe('staging failed');
  });

  // #5520: starting an unstaged app throws a synchronous CF 422 with no job
  // envelope. The fail log (and thus the snackbar's outcomeError) must show
  // the real CF detail, not a generic "Operation failed".
  it('surfaces the real CF detail on a synchronous 422 (no job envelope)', async () => {
    appsStub.startApp.mockImplementationOnce(async () => {
      throw new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'Assign a droplet before starting this app.' }] },
      });
    });

    void svc.start();
    await tick(8);

    const failEntry = svc.log().find(e => e.event === 'fail');
    expect(failEntry).toBeDefined();
    expect(failEntry?.error?.message).toBe('Assign a droplet before starting this app.');
    expect(svc.outcomeError()).toBe('Assign a droplet before starting this app.');
  });

  it('log() includes target info on each entry', async () => {
    void svc.restage();
    await tick();

    const entry = svc.log()[0];
    expect(entry.target.app).toBe('test-app');
    expect(entry.target.cf).toBe('test-cf');
    expect(entry.target.org).toBe('test-org');
    expect(entry.target.space).toBe('test-space');

    appsStub._resolveAll();
    await tick(8);
  });

  it('log() entries have timestamps', async () => {
    void svc.restage();
    await tick();

    expect(svc.log()[0].at).toBeInstanceOf(Date);

    appsStub._resolveAll();
    await tick(8);
  });

  // -------------------------------------------------------------------------
  // Ring buffer — caps at 50 entries
  // -------------------------------------------------------------------------

  it('ring buffer caps log at 50 entries, dropping oldest', async () => {
    // Push 60 entries by running the action 30 times in sequence.
    // Each run produces 2 entries (begin + success); 30 × 2 = 60.
    for (let i = 0; i < 30; i++) {
      appsStub.restageApp.mockImplementationOnce(async () => { /* instant resolve */ });
      void svc.restage();
      await tick(8);
    }

    const log = svc.log();
    expect(log.length).toBe(50);
    // The last entry of the final run is 'success'.
    expect(log[log.length - 1].event).toBe('success');
  });

  // -------------------------------------------------------------------------
  // onProgress is forwarded to the lifecycle method
  // -------------------------------------------------------------------------

  it('onProgress callback is forwarded to restageApp', async () => {
    void svc.restage();
    await tick();

    expect(capturedOnProgress).toBeTypeOf('function');

    appsStub._resolveAll();
    await tick(8);
  });

  it('onProgress callback is forwarded to startApp', async () => {
    void svc.start();
    await tick();
    expect(capturedOnProgress).toBeTypeOf('function');
    appsStub._resolveAll();
    await tick(8);
  });

  it('onProgress callback is forwarded to stopApp', async () => {
    void svc.stop();
    await tick();
    expect(capturedOnProgress).toBeTypeOf('function');
    appsStub._resolveAll();
    await tick(8);
  });

  it('onProgress callback is forwarded to restartApp', async () => {
    void svc.restart();
    await tick();
    expect(capturedOnProgress).toBeTypeOf('function');
    appsStub._resolveAll();
    await tick(8);
  });

  // -------------------------------------------------------------------------
  // progress() is null at idle
  // -------------------------------------------------------------------------

  it('progress() is null when idle (before any action)', () => {
    expect(svc.progress()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Delete success path: orchestrator.removeRow eviction (slice-2 sweep #3)
  // -------------------------------------------------------------------------

  it('delete success path: calls orchestrator.removeRow with (cfGuid, appGuid)', async () => {
    void svc.deleteWithCleanup([], []);
    await tick();

    expect(svc.verb()).toBe('DELETING');
    expect(appsStub._removeRow).not.toHaveBeenCalled();

    appsStub._resolveAll();
    await tick(8);

    expect(appsStub._removeRow).toHaveBeenCalledTimes(1);
    expect(appsStub._removeRow).toHaveBeenCalledWith('cf-1', 'app-1');
  });

  it('delete failure path: does NOT call orchestrator.removeRow', async () => {
    appsStub.deleteApp.mockImplementationOnce(async () => {
      throw failedJob({ code: 'CF-AppDeleteFailed', message: 'boom' });
    });

    void svc.deleteWithCleanup([], []);
    await tick(8);

    const log = svc.log();
    expect(log.find(e => e.event === 'fail')).toBeDefined();
    expect(appsStub._removeRow).not.toHaveBeenCalled();
  });

  it('delete that fails in CF says why, not CF\'s error name', async () => {
    appsStub.deleteApp.mockImplementationOnce(async () => {
      throw failedJob({ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: '<p>The app has active service bindings.</p>' });
    });

    void svc.deleteWithCleanup([], []);
    await tick(8);

    const failEntry = svc.log().find(e => e.event === 'fail');
    expect(failEntry?.error).toEqual({ code: 'cf.v3.10009', message: 'The app has active service bindings.' });
    expect(svc.outcomeError()).toBe('The app has active service bindings.');
  });

  it('delete with an unknown result: keeps the row, stays on the page and says so', async () => {
    appsStub.deleteApp.mockImplementationOnce(async () => 'unknown');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    const snackBar = TestBed.inject(TailwindSnackBarService);
    const open = vi.spyOn(snackBar, 'open');
    const data = TestBed.inject(AppDetailDataService) as unknown as { refresh: ReturnType<typeof vi.fn> };

    void svc.deleteWithCleanup([], [], { appName: 'my-app', endpointName: 'cf', orgName: 'o', spaceName: 's' });
    await tick(8);

    expect(appsStub._removeRow).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(data.refresh).toHaveBeenCalledWith('all');
    expect(svc.outcome()).toBe('unknown');
    expect(svc.displayLabel()).toBe('Delete result unknown');
    expect(svc.outcomeError()).toBe(
      'Delete "my-app": the operation ended, but its result could not be determined. '
      + 'This page shows the current state.',
    );
  });

  it('delete still running in CF at the tracking limit: keeps the row and says it is still running', async () => {
    appsStub.deleteApp.mockImplementationOnce(async () => 'still-running');
    void svc.deleteWithCleanup([], [], { appName: 'my-app', endpointName: 'cf', orgName: 'o', spaceName: 's' });
    await tick(8);
    expect(appsStub._removeRow).not.toHaveBeenCalled();
    expect(svc.outcome()).toBe('unknown');
    expect(svc.outcomeError()).toBe(
      'Delete "my-app": still running in Cloud Foundry after 1 h, so Stratos stopped checking on it. '
      + 'This page shows its current state.',
    );
  });

  it('a lifecycle action with an unknown result is not reported as done', async () => {
    appsStub.restartApp.mockImplementationOnce(async () => 'unknown');
    void svc.restart();
    await tick(8);
    expect(svc.outcome()).toBe('unknown');
    expect(svc.displayLabel()).toBe('Restart result unknown');
  });

  it('non-delete success paths: do NOT call orchestrator.removeRow', async () => {
    void svc.restage();
    await tick();
    appsStub._resolveAll();
    await tick(8);

    expect(appsStub._removeRow).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Confirm-dialog naming
  //
  // The delete wizard passes whatever names it had resolved at submit time. On
  // the cold path (direct URL / refresh into /delete) org and space need extra
  // fetches that may not have landed, so they arrive empty while app and
  // endpoint are already resolved. Each field must fall back independently to
  // the live data service - a partially-filled target must not suppress the
  // fallback for the fields it is missing.
  // ---------------------------------------------------------------------------

  it('fills missing org/space in the delete dialog from the data service', async () => {
    void svc.deleteWithCleanup([], [], {
      appName: 'cold-path-app',
      endpointName: 'cold-path-cf',
      orgName: '',
      spaceName: '',
    });
    await tick();

    const cfg = confirmDialogStub.open.mock.calls[0][0] as { message: string };
    expect(cfg.message).toContain('org "test-org"');
    expect(cfg.message).toContain('space "test-space"');
    expect(cfg.message).not.toContain('"?"');
  });

  describe('on a direct load into the delete wizard, before the space and org have loaded', () => {
    const later = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let data: ReturnType<typeof makeDataServiceStub>;
    const coldDelete = () => svc.deleteWithCleanup([], [], { appName: 'cold-app', endpointName: 'cold-cf', orgName: '', spaceName: '' });

    beforeEach(() => {
      data = TestBed.inject(AppDetailDataService) as unknown as ReturnType<typeof makeDataServiceStub>;
      data.space.set(undefined as never);
      data.org.set(undefined as never);
    });

    it('waits for them, then names both in the dialog and the progress overlay', async () => {
      void coldDelete();
      await later(150);
      expect(confirmDialogStub.open).not.toHaveBeenCalled();

      data.space.set({ guid: 's', name: 'late-space' });
      data.org.set({ guid: 'o', name: 'late-org' });
      await later(150);
      const [cfg, confirm] = confirmDialogStub.open.mock.calls[0] as [{ message: string }, () => void];
      expect(cfg.message).toContain('org "late-org" / space "late-space"');
      confirm();
      await tick();
      expect(svc.currentTarget()).toMatchObject({ org: 'late-org', space: 'late-space' });
    });

    it('asks without them once the space fetch has failed', async () => {
      void coldDelete();
      data.errors.set({ space: { code: 'FETCH_ERROR', message: 'no space' } });
      await later(150);
      const cfg = confirmDialogStub.open.mock.calls[0][0] as { message: string };
      expect(cfg.message).toContain('org "?" / space "?"');
    });

    it('asks without them after 10 s', async () => {
      vi.useFakeTimers();
      try {
        void coldDelete();
        await vi.advanceTimersByTimeAsync(9_900);
        expect(confirmDialogStub.open).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(200);
        expect(confirmDialogStub.open).toHaveBeenCalledOnce();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('keeps caller-supplied names when the target is fully resolved', async () => {
    void svc.deleteWithCleanup([], [], {
      appName: 'hot-path-app',
      endpointName: 'hot-path-cf',
      orgName: 'hot-path-org',
      spaceName: 'hot-path-space',
    });
    await tick();

    const cfg = confirmDialogStub.open.mock.calls[0][0] as { message: string };
    expect(cfg.message).toContain('"hot-path-app"');
    expect(cfg.message).toContain('"hot-path-cf"');
    expect(cfg.message).toContain('org "hot-path-org"');
    expect(cfg.message).toContain('space "hot-path-space"');
  });
});
