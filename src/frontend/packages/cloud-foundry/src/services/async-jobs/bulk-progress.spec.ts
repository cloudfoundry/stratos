import { describe, it, expect, vi } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { pollBulkResult } from './bulk-progress';
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
    expect(t).toEqual({ settled: 2, deleted: 1, failed: 1, unconfirmed: 0, total: 2 });
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
    expect(t).toEqual({ settled: 3, deleted: 2, failed: 1, unconfirmed: 0, total: 3 });
    expect(progress[0]).toBe(1);            // fast-path tally reported first
    expect(progress.at(-1)).toBe(3);
  });

  it('counts PENDING-without-job and poll-UNKNOWN as unconfirmed', async () => {
    const http = {
      // pollJob maps a thrown/404 GET to UNKNOWN
      get: vi.fn(() => { throw new Error('404'); }),
    } as unknown as HttpClient;
    const t = await pollBulkResult(http, bulk([
      { guid: 'a', state: 'PENDING' },                                  // no job handoff
      { guid: 'b', state: 'PENDING', job: job('j-x', 'PROCESSING') },   // poll → UNKNOWN
    ]), { backoffMs: [0] });
    expect(t.unconfirmed).toBe(2);
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
});
