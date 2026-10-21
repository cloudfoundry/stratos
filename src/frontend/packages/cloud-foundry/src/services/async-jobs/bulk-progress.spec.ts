import { describe, it, expect, vi } from 'vitest';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { pollBulkResult, runBulkWithProgress } from './bulk-progress';
import type { BulkResult } from '../../shared/signal-list-configs/route/cf-routes-signal-config.service';
import type { StratosJob } from './async-job.types';

const job = (id: string, state: 'PROCESSING' | 'COMPLETE' | 'FAILED'): StratosJob =>
  ({ id, kind: 'cf.app.delete', state, startedAt: '', updatedAt: '' });

const bulk = (results: BulkResult['results']): BulkResult => ({
  results,
  succeeded: results.filter(r => r.state === 'COMPLETE').length,
  failed: results.filter(r => r.state === 'FAILED').length,
  pending: results.filter(r => r.state === 'PENDING').length,
});

describe('pollBulkResult', () => {
  it('tallies a fast-path-only result without any HTTP', async () => {
    const http = { get: vi.fn() } as unknown as HttpClient;
    const t = await pollBulkResult(http, bulk([
      { guid: 'a', state: 'COMPLETE' },
      { guid: 'b', state: 'FAILED' },
    ]));
    expect(t).toMatchObject({ settled: 2, deleted: 1, failed: 1, unknown: 0, total: 2 });
    expect((http as any).get).not.toHaveBeenCalled();
  });

  it('polls PENDING items with jobs to completion and reports progress', async () => {
    const states: Record<string, StratosJob> = {
      'j-1': job('j-1', 'COMPLETE'),
      'j-2': job('j-2', 'FAILED'),
    };
    const http = {
      get: vi.fn((url: string) => {
        const id = url.split('/').pop()!;
        return of(new HttpResponse({ status: 200, body: states[decodeURIComponent(id)] }));
      }),
    } as unknown as HttpClient;
    const progress: number[] = [];
    const t = await pollBulkResult(http, bulk([
      { guid: 'a', state: 'COMPLETE' },
      { guid: 'b', state: 'PENDING', job: job('j-1', 'PROCESSING') },
      { guid: 'c', state: 'PENDING', job: job('j-2', 'PROCESSING') },
    ]), { backoffMs: [0], onProgress: t => progress.push(t.settled) });
    expect(t).toMatchObject({ settled: 3, deleted: 2, failed: 1, unknown: 0, total: 3 });
    expect(progress[0]).toBe(1);            // fast-path tally reported first
    expect(progress.at(-1)).toBe(3);
  });

  it('counts PENDING-without-job and poll-UNKNOWN as ended with an unknown result', async () => {
    const http = {
      // pollJob ends a job the backend does not know (404) as UNKNOWN
      get: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))),
    } as unknown as HttpClient;
    const t = await pollBulkResult(http, bulk([
      { guid: 'a', state: 'PENDING' },                                  // no job handoff
      { guid: 'b', state: 'PENDING', job: job('j-x', 'PROCESSING') },   // poll → UNKNOWN
    ]), { backoffMs: [0] });
    expect(t.unknown).toBe(2);
    expect(t.settled).toBe(2);
  });

  it('caps concurrent polling at the configured width', async () => {
    // Synchronous mock GETs can't observe true in-flight concurrency; the
    // accepted bar here is that the worker pool drains all 10 pending jobs
    // exactly once each and the tally is correct under concurrency: 3.
    const http = {
      get: vi.fn((url: string) => {
        const id = url.split('/').pop()!;
        return of(new HttpResponse({ status: 200, body: job(decodeURIComponent(id), 'COMPLETE') }));
      }),
    } as unknown as HttpClient;
    const items = Array.from({ length: 10 }, (_, i) =>
      ({ guid: `g${i}`, state: 'PENDING' as const, job: job(`j${i}`, 'PROCESSING' as const) }));
    const t = await pollBulkResult(http, bulk(items), { backoffMs: [0], concurrency: 3 });
    expect(t.deleted).toBe(10);
    expect(t.settled).toBe(10);
    expect((http as any).get).toHaveBeenCalledTimes(10);
  });

  it('records which items failed and why, and which ended unknown', async () => {
    const failedJob: StratosJob = {
      ...job('j-f', 'FAILED'),
      errors: [{ code: 'CF-UnprocessableEntity', message: 'Unprocessable', detail: 'A binding is in progress.' }],
    } as StratosJob;
    const http = {
      get: vi.fn((url: string) => {
        const id = decodeURIComponent(url.split('/').pop()!);
        return id === 'j-f'
          ? of(new HttpResponse({ status: 200, body: failedJob }))
          : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
      }),
    } as unknown as HttpClient;
    const t = await pollBulkResult(http, bulk([
      { guid: 'a', state: 'FAILED', errors: [{ code: 'CF-X', message: 'Fast-path refusal' }] },
      { guid: 'b', state: 'FAILED' },
      { guid: 'c', state: 'PENDING', job: job('j-f', 'PROCESSING') },
      { guid: 'd', state: 'PENDING', job: job('j-u', 'PROCESSING') },
      { guid: 'e', state: 'PENDING' },
    ]), { backoffMs: [0] });
    expect(t.failures).toEqual([
      { guid: 'a', reason: 'Fast-path refusal' },
      { guid: 'b', reason: undefined },
      { guid: 'c', reason: 'A binding is in progress.' },
    ]);
    expect(t.unknowns).toEqual(['e', 'd']);
  });

  it('stops each item at its own start plus the limit, however many wait for a poller', async () => {
    vi.useFakeTimers();
    try {
      const startedAt = new Date().toISOString();
      const hung = (id: string): StratosJob => ({ ...job(id, 'PROCESSING'), startedAt });
      const http = {
        get: vi.fn((url: string) =>
          of(new HttpResponse({ status: 200, body: hung(decodeURIComponent(url.split('/').pop()!)) }))),
      } as unknown as HttpClient;
      // One more hung item than pollers: the last waits a full limit for one.
      const items = Array.from({ length: 7 }, (_, i) =>
        ({ guid: `g${i}`, state: 'PENDING' as const, job: hung(`j${i}`) }));
      let tally: Awaited<ReturnType<typeof pollBulkResult>> | undefined;
      void pollBulkResult(http, bulk(items), { concurrency: 6 }).then(t => { tally = t; });
      await vi.advanceTimersByTimeAsync(61 * 60_000);
      expect(tally?.running).toHaveLength(7);
    } finally {
      vi.useRealTimers();
    }
  });
});

function makeSnackBar() {
  const updates: string[] = [];
  const ref = { update: (m: string) => updates.push(m), dismiss: vi.fn(), afterDismissed: vi.fn(), onAction: vi.fn(), dismissWithAction: vi.fn() };
  return {
    updates,
    ref,
    open: vi.fn(() => ref),
    show: vi.fn(() => ref),
    error: vi.fn(() => ref),
  };
}
const flush = async (n = 8) => { for (let i = 0; i < n; i++) { await Promise.resolve(); } };

describe('runBulkWithProgress', () => {
  // No `count` passed — the no-count contract: nothing opens before the
  // POST, and since this result never goes PENDING, nothing opens after
  // it either.
  it('clean sync result, no count → auto-dismissing final summary, no progress phase, no refresh', async () => {
    const sb = makeSnackBar();
    const refresh = vi.fn();
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([{ guid: 'a', state: 'COMPLETE' }, { guid: 'b', state: 'COMPLETE' }]),
      refresh,
    });
    await flush();
    expect(sb.show).toHaveBeenCalledWith('2 applications deleted');
    expect(sb.open).not.toHaveBeenCalled();   // no progress snackbar
    expect(sb.error).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('count provided → progress snackbar opens BEFORE the POST resolves, then dismisses for the final summary', async () => {
    const sb = makeSnackBar();
    let openCalledBeforeOpResolved = false;
    const op = () => new Promise<BulkResult>(resolve => {
      // Captured synchronously inside the op's own executor, before
      // this Promise has a chance to settle — proves the snackbar was
      // opened at POST START, not after op() resolves.
      openCalledBeforeOpResolved = (sb.open as any).mock.calls.length > 0;
      resolve(bulk([{ guid: 'a', state: 'COMPLETE' }, { guid: 'b', state: 'COMPLETE' }]));
    });
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      count: 2,
      op,
    });
    await flush();
    expect(openCalledBeforeOpResolved).toBe(true);
    expect(sb.open).toHaveBeenCalledWith('Deleting 2 applications…', undefined, { duration: 0 });
    expect(sb.ref.dismiss).toHaveBeenCalled();
    expect(sb.show).toHaveBeenCalledWith('2 applications deleted');
  });

  it('POST failure with count → progress ref dismissed before the error snackbar', async () => {
    const sb = makeSnackBar();
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      count: 2,
      op: async () => { throw new Error('boom'); },
    });
    await flush();
    expect(sb.open).toHaveBeenCalledWith('Deleting 2 applications…', undefined, { duration: 0 });
    expect(sb.ref.dismiss).toHaveBeenCalled();
    expect(sb.error).toHaveBeenCalledWith(expect.stringContaining('Bulk delete failed'));
    expect(sb.show).not.toHaveBeenCalled();
  });

  it('failures → persistent error summary + refresh', async () => {
    const sb = makeSnackBar();
    const refresh = vi.fn(async () => {});
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([{ guid: 'a', state: 'COMPLETE' }, { guid: 'b', state: 'FAILED' }]),
      refresh,
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith('1 application deleted; 1 failed: "b"');
    expect(refresh).toHaveBeenCalled();
  });

  it('unknown results → persistent summary that says so + refresh', async () => {
    const sb = makeSnackBar();
    const refresh = vi.fn(async () => {});
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([
        { guid: 'a', state: 'COMPLETE' },
        { guid: 'b', state: 'FAILED' },
        { guid: 'c', state: 'PENDING' },
        { guid: 'd', state: 'PENDING' },
      ]),
      refresh,
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith(
      '1 application deleted; 1 failed: "b"; 2 results could not be determined: "c", "d"');
    expect(refresh).toHaveBeenCalled();
  });

  it('names each failure with its reason, by the caller\'s names, and logs every one', async () => {
    const sb = makeSnackBar();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([
        { guid: 'a', state: 'COMPLETE' },
        { guid: 'b', state: 'FAILED', errors: [{ code: 'CF-X', message: 'A binding is in progress.' }] },
      ]),
      names: new Map([['a', 'l9-after'], ['b', 'l7-after']]),
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith('1 application deleted; 1 failed: "l7-after" (A binding is in progress)');
    expect(warn).toHaveBeenCalledWith('Bulk delete: "l7-after" (b) failed: A binding is in progress.');
    warn.mockRestore();
  });

  it('keeps each failure reason on one line in the summary', async () => {
    const sb = makeSnackBar();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([
        { guid: 'b', state: 'FAILED', errors: [{ code: 'CF-X', message: '<html><body><h1>502 Bad Gateway</h1><p>Try later.</p></body></html>' }] },
      ]),
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith('0 applications deleted; 1 failed: "b" (502 Bad Gateway Try later)');
    warn.mockRestore();
  });

  it('names the first three failures and counts the rest', async () => {
    const sb = makeSnackBar();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk(['a', 'b', 'c', 'd', 'e'].map(guid =>
        ({ guid, state: 'FAILED' as const, errors: [{ code: 'CF-X', message: `no ${guid}` }] }))),
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith(
      '0 applications deleted; 5 failed: "a" (no a), "b" (no b), "c" (no c) and 2 more');
    expect(warn).toHaveBeenCalledTimes(5);
    warn.mockRestore();
  });

  it('counts and names items still running in CF when Stratos stopped following them', async () => {
    const sb = makeSnackBar();
    vi.useFakeTimers();
    try {
      const http = {
        get: vi.fn(() => of(new HttpResponse({ status: 200, body: job('j-1', 'PROCESSING') }))),
      } as unknown as HttpClient;
      await runBulkWithProgress({
        snackBar: sb as any, http,
        noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
        op: async () => bulk([
          { guid: 'a', state: 'COMPLETE' },
          { guid: 'b', state: 'PENDING', job: job('j-1', 'PROCESSING') },
        ]),
        names: new Map([['b', 'slow-app']]),
      });
      await vi.advanceTimersByTimeAsync(2 * 60 * 60_000);
      expect(sb.error).toHaveBeenCalledWith(
        '1 application deleted; 1 still running in Cloud Foundry after 1 h, so Stratos stopped checking: "slow-app"');
    } finally {
      vi.useRealTimers();
    }
  });

  it('pending items → progress snackbar updates in place, then final summary', async () => {
    const sb = makeSnackBar();
    const http = {
      get: vi.fn(() => of(new HttpResponse({ status: 200, body: job('j-1', 'COMPLETE') }))),
    } as unknown as HttpClient;
    await runBulkWithProgress({
      snackBar: sb as any, http,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([
        { guid: 'a', state: 'COMPLETE' },
        { guid: 'b', state: 'PENDING', job: job('j-1', 'PROCESSING') },
      ]),
      backoffMs: [0],
    });
    await flush(16);
    expect(sb.open).toHaveBeenCalledWith('Deleting 2 applications… 1 of 2', undefined, { duration: 0 });
    expect(sb.ref.dismiss).toHaveBeenCalled();          // progress replaced by final
    expect(sb.show).toHaveBeenCalledWith('2 applications deleted');
  });

  it('bulkRunning covers only the POST phase', async () => {
    const sb = makeSnackBar();
    const states: boolean[] = [];
    const bulkRunning = { set: (v: boolean) => states.push(v) };
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any, bulkRunning: bulkRunning as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => bulk([{ guid: 'a', state: 'COMPLETE' }]),
    });
    expect(states).toEqual([true, false]);  // false by the time the await returns
  });

  it('POST failure → error snackbar with extracted message, no settlement phase', async () => {
    const sb = makeSnackBar();
    await runBulkWithProgress({
      snackBar: sb as any, http: { get: vi.fn() } as any,
      noun: 'application', verb: 'delete', progressVerb: 'Deleting', doneVerb: 'deleted',
      op: async () => { throw new Error('boom'); },
    });
    await flush();
    expect(sb.error).toHaveBeenCalledWith(expect.stringContaining('Bulk delete failed'));
    expect(sb.show).not.toHaveBeenCalled();
  });
});
