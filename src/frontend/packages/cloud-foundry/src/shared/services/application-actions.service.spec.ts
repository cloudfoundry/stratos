import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { AppApplicationActionsService } from './application-actions.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';
import { AppLifecycleStateService } from '../../features/applications/app-lifecycle-state.service';
import { ApplicationService } from '../../features/applications/application.service';
import { CloudFoundryEndpointService } from '../../features/cf/services/cloud-foundry-endpoint.service';
import { CfAppsSignalConfigService } from '../signal-list-configs/app/cf-apps-signal-config.service';
import { ConfirmationDialogService } from '@stratosui/core';
import type { StratosJob, JobStage } from '../../services/async-jobs/async-job.types';

import {
  generateCfStoreModules,
} from '@test-framework/cloud-foundry-endpoint-service.helper';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

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
    return vi.fn(async (_cnsi: string, _app: string, opts?: { onProgress?: (job: StratosJob) => void }) => {
      capturedOnProgress = opts?.onProgress;
      await new Promise<void>((r) => resolvers.push(r));
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
    deleteApp: vi.fn(async (_cnsi: string, _app: string) => {
      await new Promise<void>((r) => resolvers.push(r));
    }),
    deleteRoute: vi.fn(async (_cnsi: string, _routeGuid: string) => {
      await new Promise<void>((r) => resolvers.push(r));
    }),
    deleteServiceBinding: vi.fn(async (_cnsi: string, _bindingGuid: string) => {
      await new Promise<void>((r) => resolvers.push(r));
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
      throw { job: { errors: [{ code: 'CF-AppStaged', message: 'staging failed' }] } };
    });

    void svc.restage();
    await tick(8);

    const log = svc.log();
    const failEntry = log.find(e => e.event === 'fail');
    expect(failEntry).toBeDefined();
    expect(failEntry?.error?.code).toBe('CF-AppStaged');
    expect(failEntry?.error?.message).toBe('staging failed');
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
      throw { job: { errors: [{ code: 'CF-AppDeleteFailed', message: 'boom' }] } };
    });

    void svc.deleteWithCleanup([], []);
    await tick(8);

    const log = svc.log();
    expect(log.find(e => e.event === 'fail')).toBeDefined();
    expect(appsStub._removeRow).not.toHaveBeenCalled();
  });

  it('non-delete success paths: do NOT call orchestrator.removeRow', async () => {
    void svc.restage();
    await tick();
    appsStub._resolveAll();
    await tick(8);

    expect(appsStub._removeRow).not.toHaveBeenCalled();
  });
});
