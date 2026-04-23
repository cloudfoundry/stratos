import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StratosJob } from './async-job.types';
import { StratosJobError } from './async-job.types';
import { writeWithJob } from './write-with-job';

describe('writeWithJob', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  const noDelay = { backoffMs: [0] };

  // Drain microtasks between a flush and the next expectOne so pending
  // Promise continuations inside writeWithJob (observable→promise→next
  // http.get) have a chance to register with HttpTestingController.
  const tick = async (): Promise<void> => {
    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
    }
  };

  it('resolves immediately when the call returns 200 with a body', async () => {
    const promise = writeWithJob<{ guid: string }>(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush({ guid: 'app1' }, { status: 200, statusText: 'OK' });

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toEqual({ guid: 'app1' });
    expect(result.jobId).toBeUndefined();
  });

  it('polls /stratos/jobs on 202 until COMPLETE and returns result', async () => {
    const promise = writeWithJob<{ ok: boolean }>(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
      noDelay,
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { id: 'job-1', kind: 'cf.app.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();

    ctrl.expectOne('/pp/v1/stratos/jobs/job-1').flush(
      { id: 'job-1', kind: 'cf.app.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
    );
    await tick();

    const terminal: StratosJob = {
      id: 'job-1',
      kind: 'cf.app.delete',
      state: 'COMPLETE',
      startedAt: '',
      updatedAt: '',
      result: { ok: true },
    };
    ctrl.expectOne('/pp/v1/stratos/jobs/job-1').flush(terminal);

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toEqual({ ok: true });
    expect(result.jobId).toBe('job-1');
  });

  it('throws StratosJobError when the polled job terminates FAILED', async () => {
    const promise = writeWithJob(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
      noDelay,
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { id: 'job-f', kind: 'cf.app.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();

    const failed: StratosJob = {
      id: 'job-f',
      kind: 'cf.app.delete',
      state: 'FAILED',
      startedAt: '',
      updatedAt: '',
      errors: [{ code: 'cf.v3.invalid', message: 'no route to app' }],
    };
    ctrl.expectOne('/pp/v1/stratos/jobs/job-f').flush(failed);

    await expect(promise).rejects.toBeInstanceOf(StratosJobError);
  });

  it('returns UNKNOWN when polling receives 404', async () => {
    const promise = writeWithJob(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
      noDelay,
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { id: 'job-x', kind: 'cf.app.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();

    ctrl.expectOne('/pp/v1/stratos/jobs/job-x').flush(
      { error: 'unknown job id' },
      { status: 404, statusText: 'Not Found' },
    );

    const result = await promise;
    expect(result.status).toBe('UNKNOWN');
    expect(result.jobId).toBe('job-x');
  });

  it('calls onProgress for every poll response', async () => {
    const seen: string[] = [];
    const promise = writeWithJob(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
      { ...noDelay, onProgress: (job) => seen.push(job.state) },
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { id: 'j', kind: 'k', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();

    ctrl.expectOne('/pp/v1/stratos/jobs/j').flush(
      { id: 'j', kind: 'k', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
    );
    await tick();

    ctrl.expectOne('/pp/v1/stratos/jobs/j').flush(
      { id: 'j', kind: 'k', state: 'COMPLETE', startedAt: '', updatedAt: '' } satisfies StratosJob,
    );

    await promise;
    expect(seen).toEqual(['PROCESSING', 'COMPLETE']);
  });

  it('returns UNKNOWN when 202 body lacks an id', async () => {
    const promise = writeWithJob(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(null, { status: 202, statusText: 'Accepted' });

    const result = await promise;
    expect(result.status).toBe('UNKNOWN');
  });
});
