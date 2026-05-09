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

  it('unwraps the canonical {state, result} envelope on 200 fast-path', async () => {
    const promise = writeWithJob<{ guid: string }>(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
    );

    // Backend handlers that call RunFastPath always emit this envelope on
    // a fast-path resolve — see e.g. native_apps_writes.go line 89-91.
    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { state: 'COMPLETE', result: { guid: 'app1' } },
      { status: 200, statusText: 'OK' },
    );

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toEqual({ guid: 'app1' });
    expect(result.jobId).toBeUndefined();
  });

  it('passes a non-envelope 200 body through verbatim', async () => {
    // Defends against legacy / non-Stratos handlers that don't go through
    // RunFastPath. The body shape is preserved so existing callers that
    // never relied on the envelope keep working.
    const promise = writeWithJob<{ guid: string }>(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(
      { guid: 'app1' },
      { status: 200, statusText: 'OK' },
    );

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toEqual({ guid: 'app1' });
  });

  it('resolves with state=undefined when the 200 body is null', async () => {
    // 204 No Content / void-result deletes land here; callers ignore
    // state in that case but the shape should be unambiguous.
    const promise = writeWithJob(
      http,
      http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }),
    );

    ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(null, { status: 200, statusText: 'OK' });

    const result = await promise;
    expect(result.status).toBe('COMPLETE');
    expect(result.state).toBeNull();
  });

  it('matches polled-path shape: fast-path envelope unwraps to the same T as job.result', async () => {
    // The whole point of the unwrap: a caller that types AsyncJobResult<T>
    // sees the same T regardless of which path served the request.
    interface Created { links: { service_instance: string } }
    const inner: Created = { links: { service_instance: '/v3/service_instances/abc' } };

    const fastPathPromise = writeWithJob<Created>(
      http,
      http.post('/pp/v1/cf/service_instances/cnsi', {}, { observe: 'response' }),
    );
    ctrl.expectOne('/pp/v1/cf/service_instances/cnsi').flush(
      { state: 'COMPLETE', result: inner },
      { status: 200, statusText: 'OK' },
    );
    const fast = await fastPathPromise;

    const polledPromise = writeWithJob<Created>(
      http,
      http.post('/pp/v1/cf/service_instances/cnsi2', {}, { observe: 'response' }),
      noDelay,
    );
    ctrl.expectOne('/pp/v1/cf/service_instances/cnsi2').flush(
      { id: 'job-2', kind: 'cf.si.create', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
      { status: 202, statusText: 'Accepted' },
    );
    await tick();
    ctrl.expectOne('/pp/v1/stratos/jobs/job-2').flush({
      id: 'job-2',
      kind: 'cf.si.create',
      state: 'COMPLETE',
      startedAt: '',
      updatedAt: '',
      result: inner,
    } satisfies StratosJob);
    const polled = await polledPromise;

    expect(fast.state).toEqual(polled.state);
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
