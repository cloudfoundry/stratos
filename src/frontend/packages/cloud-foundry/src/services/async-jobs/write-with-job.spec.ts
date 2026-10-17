import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { StratosJob } from './async-job.types';
import { StratosJobError } from './async-job.types';
import { setJobTrackingLimit, writeWithJob } from './write-with-job';

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

  // The message shows the broker's words only; the CF code and title it
  // leaves out go to the console, on both paths.
  describe('logs the CF error code a failure message leaves out', () => {
    const errors = [{ code: 'cf.v3.10009', message: 'CF-UnableToPerform', detail: 'Operation failed' }];
    let warn: MockInstance<typeof console.warn>;
    beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined); });
    afterEach(() => warn.mockRestore());
    const logged = (): string => warn.mock.calls.flat().map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');

    it('on the fast path', async () => {
      const promise = writeWithJob(http, http.post('/pp/v1/cf/service_instances/cnsi', {}, { observe: 'response' }), noDelay);
      ctrl.expectOne('/pp/v1/cf/service_instances/cnsi').flush(
        { state: 'FAILED', errors },
        { status: 502, statusText: 'Bad Gateway' },
      );
      await expect(promise).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(logged()).toContain('cf.v3.10009');
      expect(logged()).toContain('CF-UnableToPerform');
    });

    it('on the polled path', async () => {
      const promise = writeWithJob(http, http.post('/pp/v1/cf/service_instances/cnsi', {}, { observe: 'response' }), noDelay);
      ctrl.expectOne('/pp/v1/cf/service_instances/cnsi').flush(
        { id: 'job-p', kind: 'cf.service_instance.create', state: 'PROCESSING', startedAt: '', updatedAt: '' } satisfies StratosJob,
        { status: 202, statusText: 'Accepted' },
      );
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-p').flush(
        { id: 'job-p', kind: 'cf.service_instance.create', state: 'FAILED', startedAt: '', updatedAt: '', errors } satisfies StratosJob,
      );
      await expect(promise).rejects.toBeInstanceOf(StratosJobError);
      expect(logged()).toContain('cf.v3.10009');
      expect(logged()).toContain('CF-UnableToPerform');
    });
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

  // A poll that could not be answered is not an outcome: the job is still
  // running somewhere, so the loop keeps asking until it hears a terminal
  // state or the backend says it does not know the job.
  describe('poll problems', () => {
    let warn: MockInstance<typeof console.warn>;
    beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined); });
    afterEach(() => warn.mockRestore());

    const processing = (id: string): StratosJob => ({ id, kind: 'cf.app.delete', state: 'PROCESSING', startedAt: '', updatedAt: '' });
    const complete = (id: string): StratosJob => ({ id, kind: 'cf.app.delete', state: 'COMPLETE', startedAt: '', updatedAt: '' });

    let handedOffAt = 0;
    const startedAt = () => handedOffAt;
    const handOff = async (id: string, opts: Parameters<typeof writeWithJob>[2] = noDelay) => {
      handedOffAt = Date.now();
      const promise = writeWithJob(http, http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }), opts);
      ctrl.expectOne('/pp/v1/cf/apps/cnsi/app1').flush(processing(id), { status: 202, statusText: 'Accepted' });
      await tick();
      return { promise };
    };

    it('checks quickly at first, then backs off exponentially to two minutes', async () => {
      vi.useFakeTimers();
      try {
        const { promise } = await handOff('job-b', {});
        const at: number[] = [];
        // Answer every poll "still running" and note when each arrived.
        for (let step = 0; at.length < 30 && step < 100; step++) {
          for (const req of ctrl.match('/pp/v1/stratos/jobs/job-b')) {
            at.push(Date.now());
            req.flush(processing('job-b'));
          }
          await vi.advanceTimersToNextTimerAsync();
        }
        const gaps = at.slice(1).map((t, i) => t - at[i]);
        expect(gaps.slice(0, 4)).toEqual([500, 1000, 2000, 3000]);
        expect(gaps.slice(4, 21).every(g => g === 3000)).toBe(true);    // every 3 s for the first minute
        expect(gaps.slice(22, 29)).toEqual([6000, 12000, 24000, 48000, 96000, 120000, 120000]);
        ctrl.match('/pp/v1/stratos/jobs/job-b').forEach(r => r.flush(complete('job-b')));
        await vi.advanceTimersByTimeAsync(0);
        expect((await promise).status).toBe('COMPLETE');
      } finally {
        vi.useRealTimers();
      }
    });

    it('backs off from a few seconds, not zero, when the first answer comes after the first minute', async () => {
      vi.useFakeTimers();
      try {
        const { promise } = await handOff('job-slow1', {});
        const first = ctrl.expectOne('/pp/v1/stratos/jobs/job-slow1');
        await vi.advanceTimersByTimeAsync(61_000);
        first.flush(processing('job-slow1'));
        await vi.advanceTimersByTimeAsync(0);
        expect(ctrl.match('/pp/v1/stratos/jobs/job-slow1')).toHaveLength(0);   // no back-to-back re-poll
        await vi.advanceTimersByTimeAsync(6_000);
        ctrl.expectOne('/pp/v1/stratos/jobs/job-slow1').flush(complete('job-slow1'));
        await vi.advanceTimersByTimeAsync(0);
        expect((await promise).status).toBe('COMPLETE');
      } finally {
        vi.useRealTimers();
      }
    });

    it('stops following at the tracking limit and says the job is still running', async () => {
      vi.useFakeTimers();
      setJobTrackingLimit(2);
      try {
        const { promise } = await handOff('job-lim', {});
        let polls = 0;
        let settled = false;
        void promise.then(() => { settled = true; });
        for (let step = 0; !settled && step < 200; step++) {
          for (const req of ctrl.match('/pp/v1/stratos/jobs/job-lim')) {
            polls++;
            req.flush(processing('job-lim'));
          }
          await vi.advanceTimersToNextTimerAsync();
        }
        expect(await promise).toEqual({ status: 'UNKNOWN', state: undefined, jobId: 'job-lim', stillRunning: true });
        expect(Date.now() - startedAt()).toBe(2 * 60_000);   // the last check lands on the limit
        expect(polls).toBeGreaterThan(20);
      } finally {
        setJobTrackingLimit(60);
        vi.useRealTimers();
      }
    });

    it('stops at the caller\'s deadline when one is given', async () => {
      vi.useFakeTimers();
      try {
        const { promise } = await handOff('job-d', { deadlineAt: Date.now() + 5_000 });
        for (let step = 0; step < 50; step++) {
          ctrl.match('/pp/v1/stratos/jobs/job-d').forEach(r => r.flush(processing('job-d')));
          await vi.advanceTimersToNextTimerAsync();
        }
        expect((await promise).stillRunning).toBe(true);
        expect(Date.now() - startedAt()).toBe(5_000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('keeps polling through a 503 and a network error, then completes', async () => {
      const { promise } = await handOff('job-t');
      ctrl.expectOne('/pp/v1/stratos/jobs/job-t').flush(null, { status: 503, statusText: 'Service Unavailable' });
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-t').error(new ProgressEvent('error'));
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-t').flush(complete('job-t'));

      const result = await promise;
      expect(result.status).toBe('COMPLETE');
      expect(result.jobId).toBe('job-t');
    });

    it('keeps polling through a 429 and a 200 without a body', async () => {
      const { promise } = await handOff('job-r');
      ctrl.expectOne('/pp/v1/stratos/jobs/job-r').flush(null, { status: 429, statusText: 'Too Many Requests' });
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-r').flush(null);
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-r').flush(complete('job-r'));

      expect((await promise).status).toBe('COMPLETE');
    });

    it('logs once when polling starts failing and once when it recovers', async () => {
      const { promise } = await handOff('job-l');
      ctrl.expectOne('/pp/v1/stratos/jobs/job-l').flush(null, { status: 502, statusText: 'Bad Gateway' });
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-l').flush(null, { status: 502, statusText: 'Bad Gateway' });
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-l').flush(processing('job-l'));
      await tick();
      ctrl.expectOne('/pp/v1/stratos/jobs/job-l').flush(complete('job-l'));
      await promise;

      expect(warn).toHaveBeenCalledTimes(2);
      expect(String(warn.mock.calls[0][0])).toContain('job-l');
      expect(String(warn.mock.calls[1][0])).toContain('job-l');
    });

    it('ends as UNKNOWN on a 4xx other than 429', async () => {
      const { promise } = await handOff('job-f');
      ctrl.expectOne('/pp/v1/stratos/jobs/job-f').flush(null, { status: 403, statusText: 'Forbidden' });

      const result = await promise;
      expect(result.status).toBe('UNKNOWN');
      expect(result.jobId).toBe('job-f');
    });

    it('rejects with an AbortError when the caller stops waiting during a poll', async () => {
      const abort = new AbortController();
      const { promise } = await handOff('job-a', { ...noDelay, signal: abort.signal });
      const poll = ctrl.expectOne('/pp/v1/stratos/jobs/job-a');
      abort.abort();

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
      expect(poll.cancelled).toBe(true);
    });

    it('rejects with an AbortError when the caller stops waiting between polls', async () => {
      const abort = new AbortController();
      const { promise } = await handOff('job-w', { backoffMs: [60_000], signal: abort.signal });
      ctrl.expectOne('/pp/v1/stratos/jobs/job-w').flush(processing('job-w'));
      await tick();
      abort.abort();

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
      ctrl.expectNone('/pp/v1/stratos/jobs/job-w');
    });

    it('rejects with an AbortError without writing when already aborted', async () => {
      const abort = new AbortController();
      abort.abort();
      const promise = writeWithJob(http, http.delete('/pp/v1/cf/apps/cnsi/app1', { observe: 'response' }), { signal: abort.signal });

      await expect(promise).rejects.toBeInstanceOf(DOMException);
      ctrl.expectNone('/pp/v1/cf/apps/cnsi/app1');
    });
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
