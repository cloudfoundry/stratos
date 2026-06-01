import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { config as rxjsConfig } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AsyncJobResult } from '../async-jobs/async-job.types';
import { StratosJobError } from '../async-jobs/async-job.types';
import { EntityDeleteController, WRITE_WITH_JOB } from './entity-delete.controller';
import type { DeleteRequest } from './delete-event.types';

// ---------------------------------------------------------------------------
// Shared request fixture
// ---------------------------------------------------------------------------

const makeRequest = (): DeleteRequest => ({
  cnsiGuid: 'cnsi-guid-1',
  cnsiName: 'My CF',
  entityKind: 'app',
  deleteGuid: 'app-guid-1',
  deleteName: 'my-app',
  call: () => of(new HttpResponse({ status: 200 })),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all events$ emissions into an array then return them. */
const collectStates = async (ctrl: EntityDeleteController, req: DeleteRequest): Promise<string[]> => {
  const states: string[] = [];
  const handle = ctrl.delete(req);
  // Subscribe before the done resolves.
  handle.events$.subscribe(e => states.push(e.state));
  await handle.done;
  return states;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EntityDeleteController', () => {
  describe('happy path — write resolves COMPLETE', () => {
    let ctrl: EntityDeleteController;

    beforeEach(() => {
      const fakeWrite = async (): Promise<AsyncJobResult<void>> => ({ status: 'COMPLETE', state: undefined });

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          EntityDeleteController,
          { provide: WRITE_WITH_JOB, useValue: fakeWrite },
        ],
      });
      ctrl = TestBed.inject(EntityDeleteController);
    });

    it('emits states [start, success]', async () => {
      const states = await collectStates(ctrl, makeRequest());
      expect(states).toEqual(['start', 'success']);
    });

    it('done resolves with state success and request payload fields', async () => {
      const req = makeRequest();
      const handle = ctrl.delete(req);
      const terminal = await handle.done;

      expect(terminal.state).toBe('success');
      expect(terminal.cnsiGuid).toBe(req.cnsiGuid);
      expect(terminal.cnsiName).toBe(req.cnsiName);
      expect(terminal.entityKind).toBe(req.entityKind);
      expect(terminal.deleteGuid).toBe(req.deleteGuid);
      expect(terminal.deleteName).toBe(req.deleteName);
      expect(terminal.error).toBeUndefined();
    });

    it('a late subscriber still receives all events via ReplaySubject', async () => {
      const req = makeRequest();
      const handle = ctrl.delete(req);
      await handle.done;

      // Subscribe AFTER the stream has completed.
      const states: string[] = [];
      handle.events$.subscribe(e => states.push(e.state));
      expect(states).toEqual(['start', 'success']);
    });

    it('done still resolves with success even when a subscriber next handler throws synchronously', async () => {
      // RxJS v7 defers uncaught observer errors via setTimeout (reportUnhandledError).
      // Install a no-op handler so that deliberate throws in this test don't leak
      // as vitest "unhandled errors".  Drain the macrotask queue before restoring so
      // the deferred setTimeout fires while the handler is still installed.
      const prevHandler = rxjsConfig.onUnhandledError;
      rxjsConfig.onUnhandledError = () => { /* expected: observer intentionally throws */ };

      const req = makeRequest();
      const handle = ctrl.delete(req);
      // Subscribe with a handler that throws on every event.
      handle.events$.subscribe(() => { throw new Error('observer exploded'); });
      // done must settle and carry the success terminal — not hang or reject.
      const terminal = await handle.done;
      // Drain macrotasks so the RxJS-deferred rethrow fires before we restore.
      await new Promise<void>(r => setTimeout(r, 0));

      rxjsConfig.onUnhandledError = prevHandler;
      expect(terminal.state).toBe('success');
    });
  });

  // -------------------------------------------------------------------------

  describe('failure path — write throws', () => {
    let ctrl: EntityDeleteController;
    const writeError = new StratosJobError({
      id: 'job-fail',
      kind: 'cf.app.delete',
      state: 'FAILED',
      startedAt: '',
      updatedAt: '',
      errors: [{ code: 'cf.500', message: 'internal error' }],
    });

    beforeEach(() => {
      const fakeWrite = async (): Promise<never> => { throw writeError; };

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          EntityDeleteController,
          { provide: WRITE_WITH_JOB, useValue: fakeWrite },
        ],
      });
      ctrl = TestBed.inject(EntityDeleteController);
    });

    it('emits states [start, failure]', async () => {
      const states = await collectStates(ctrl, makeRequest());
      expect(states).toEqual(['start', 'failure']);
    });

    it('done resolves with state failure and error attached', async () => {
      const req = makeRequest();
      const handle = ctrl.delete(req);
      const terminal = await handle.done;

      expect(terminal.state).toBe('failure');
      expect(terminal.error).toBe(writeError);
    });

    it('done resolves (does not reject) even when write throws', async () => {
      // The done promise must never reject — the caller reads the terminal event.
      const req = makeRequest();
      await expect(ctrl.delete(req).done).resolves.toBeDefined();
    });
  });
});
