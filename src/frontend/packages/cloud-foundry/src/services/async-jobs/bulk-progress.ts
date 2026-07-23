import { HttpClient } from '@angular/common/http';
import { WritableSignal } from '@angular/core';
import { TailwindSnackBarRef, TailwindSnackBarService } from '@stratosui/core';
import { pollJob } from './write-with-job';
import { extractHttpErrorMessage } from '../extract-error-message';
import type { BulkResult } from '../../shared/signal-list-configs/route/cf-routes-signal-config.service';

export interface BulkTally {
  settled: number;
  deleted: number;
  failed: number;
  unconfirmed: number;
  total: number;
}

// Settles every item of a BulkResult: fast-path items count immediately;
// PENDING items with a stratosjobs handoff are polled (bounded concurrency)
// until terminal. Never rejects — job FAILED counts into `failed`, poll
// UNKNOWN (404/HA) and PENDING-without-job count into `unconfirmed`.
export async function pollBulkResult(
  http: HttpClient,
  result: BulkResult,
  opts: {
    onProgress?: (t: BulkTally) => void;
    backoffMs?: readonly number[];
    concurrency?: number;
  } = {},
): Promise<BulkTally> {
  const tally: BulkTally = { settled: 0, deleted: 0, failed: 0, unconfirmed: 0, total: result.results.length };
  const pendingJobs: string[] = [];

  for (const item of result.results) {
    if (item.state === 'COMPLETE') { tally.deleted++; tally.settled++; }
    else if (item.state === 'FAILED') { tally.failed++; tally.settled++; }
    else if (item.job?.id) { pendingJobs.push(item.job.id); }
    else { tally.unconfirmed++; tally.settled++; }
  }
  opts.onProgress?.({ ...tally });
  if (pendingJobs.length === 0) { return tally; }

  // Bounded worker pool over the pending jobs — matches the backend's
  // fan-out width so a large bulk doesn't open one poll loop per item.
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < pendingJobs.length) {
      const jobId = pendingJobs[next++];
      try {
        const res = await pollJob<unknown>(http, jobId, { backoffMs: opts.backoffMs });
        if (res.status === 'COMPLETE') { tally.deleted++; } else { tally.unconfirmed++; }
      } catch {
        tally.failed++; // StratosJobError: the CF job terminally failed
      }
      tally.settled++;
      opts.onProgress?.({ ...tally });
    }
  };
  const width = Math.min(opts.concurrency ?? 6, pendingJobs.length);
  await Promise.all(Array.from({ length: width }, () => worker()));
  return tally;
}

export interface BulkProgressOptions {
  snackBar: TailwindSnackBarService;
  http: HttpClient;
  bulkRunning?: WritableSignal<boolean>;
  noun: string;
  verb: string;
  progressVerb: string;
  doneVerb: string;
  op: () => Promise<BulkResult>;
  refresh?: () => Promise<void>;
  refreshAfterPending?: boolean;
  backoffMs?: readonly number[];   // test hook, forwarded to pollBulkResult
  /** Number of items requested (known from the caller's selection). When
   *  provided and > 0, the progress snackbar opens BEFORE the POST rather
   *  than waiting on the response — a fast POST still shows feedback. */
  count?: number;
}

const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

// Owns the whole bulk lifecycle. Resolves when the POST phase ends (bulk
// bar closes, rows already handled by op); settlement (job polling +
// snackbar updates + final summary + refresh) continues detached and
// swallows every error — nothing may escape as an unhandled rejection.
export async function runBulkWithProgress(o: BulkProgressOptions): Promise<void> {
  let result: BulkResult;
  o.bulkRunning?.set(true);
  // Open the progress snackbar BEFORE the POST when the caller knows the
  // requested count — a fast POST still shows in-flight feedback instead of
  // nothing until the final summary. The same ref is threaded through
  // settlement, which upgrades it to an "X of Y" message and owns dismissal.
  let progressRef: TailwindSnackBarRef<unknown> | undefined;
  if (o.count && o.count > 0) {
    progressRef = o.snackBar.open(`${o.progressVerb} ${plural(o.count, o.noun)}…`, undefined, { duration: 0 });
  }
  try {
    result = await o.op();
  } catch (err: unknown) {
    progressRef?.dismiss();
    o.snackBar.error(`Bulk ${o.verb} failed: ${extractHttpErrorMessage(err)}`);
    return;
  } finally {
    o.bulkRunning?.set(false);
  }
  void trackSettlement(o, result, progressRef).catch(() => { /* defensive: see contract above */ });
}

async function trackSettlement(
  o: BulkProgressOptions,
  result: BulkResult,
  initialRef?: TailwindSnackBarRef<unknown>,
): Promise<void> {
  const total = result.results.length;
  const hadPending = result.results.some(r => r.state === 'PENDING');
  // total (from the settled BulkResult) is authoritative over the caller's
  // requested count for the "X of Y" text — a POST can settle fewer/more
  // than requested (e.g. an already-gone guid).
  let progressRef = initialRef;

  const report = (t: { settled: number; total: number }): void => {
    if (t.settled >= t.total) { return; }
    const msg = `${o.progressVerb} ${plural(total, o.noun)}… ${t.settled} of ${t.total}`;
    if (progressRef) { progressRef.update(msg); }
    else { progressRef = o.snackBar.open(msg, undefined, { duration: 0 }); }
  };

  const tally = await pollBulkResult(o.http, result, {
    onProgress: hadPending ? report : undefined,
    backoffMs: o.backoffMs,
  });
  progressRef?.dismiss();

  const parts = [`${plural(tally.deleted, o.noun)} ${o.doneVerb}`];
  if (tally.failed > 0) { parts.push(`${tally.failed} failed`); }
  if (tally.unconfirmed > 0) { parts.push(`${tally.unconfirmed} unconfirmed`); }
  const message = parts.join(', ');

  const clean = tally.failed === 0 && tally.unconfirmed === 0;
  if (clean) {
    o.snackBar.show(message);  // default 5s auto-dismiss = readable linger
  } else {
    o.snackBar.error(message); // persistent until manually dismissed
  }
  if (!clean || (hadPending && o.refreshAfterPending)) {
    try { await o.refresh?.(); } catch { /* next manual refresh surfaces it */ }
  }
}
