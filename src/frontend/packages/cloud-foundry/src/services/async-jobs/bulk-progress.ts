import { HttpClient } from '@angular/common/http';
import { WritableSignal } from '@angular/core';
import { TailwindSnackBarRef, TailwindSnackBarService } from '@stratosui/core';
import { pollJob } from './write-with-job';
import type { BulkResult } from '../../shared/signal-list-configs/route/cf-routes-signal-config.service';
import { extractHttpErrorMessage, stripMarkup } from '@stratosui/store';

export interface BulkTally {
  settled: number;
  deleted: number;
  failed: number;
  /** Ended with a result that could not be determined. */
  unknown: number;
  total: number;
  /** Each failed item, with the reason CF or the broker gave when there is one. */
  failures: { guid: string; reason?: string }[];
  /** Each item whose result could not be determined. */
  unknowns: string[];
}

// Settles every item of a BulkResult: fast-path items count immediately;
// PENDING items with a stratosjobs handoff are polled (bounded concurrency)
// until terminal. Never rejects — job FAILED counts into `failed`; a job
// the backend no longer knows (poll UNKNOWN) and PENDING-without-job ended
// with a result nobody can determine and count into `unknown`.
export async function pollBulkResult(
  http: HttpClient,
  result: BulkResult,
  opts: {
    onProgress?: (t: BulkTally) => void;
    backoffMs?: readonly number[];
    concurrency?: number;
  } = {},
): Promise<BulkTally> {
  const tally: BulkTally = {
    settled: 0, deleted: 0, failed: 0, unknown: 0, total: result.results.length, failures: [], unknowns: [],
  };
  const pendingJobs: { guid: string; jobId: string }[] = [];
  const fail = (guid: string, reason?: string) => { tally.failed++; tally.failures.push({ guid, reason }); };
  const unknown = (guid: string) => { tally.unknown++; tally.unknowns.push(guid); };

  for (const item of result.results) {
    if (item.state === 'COMPLETE') { tally.deleted++; tally.settled++; }
    else if (item.state === 'FAILED') { fail(item.guid, item.errors?.[0]?.message && stripMarkup(item.errors[0].message)); tally.settled++; }
    else if (item.job?.id) { pendingJobs.push({ guid: item.guid, jobId: item.job.id }); }
    else { unknown(item.guid); tally.settled++; }
  }
  opts.onProgress?.({ ...tally });
  if (pendingJobs.length === 0) { return tally; }

  // Bounded worker pool over the pending jobs — matches the backend's
  // fan-out width so a large bulk doesn't open one poll loop per item.
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < pendingJobs.length) {
      const { guid, jobId } = pendingJobs[next++];
      try {
        const res = await pollJob<unknown>(http, jobId, { backoffMs: opts.backoffMs });
        if (res.status === 'COMPLETE') { tally.deleted++; } else { unknown(guid); }
      } catch (err: unknown) {
        fail(guid, extractHttpErrorMessage(err)); // StratosJobError: the CF job terminally failed
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
  /** Display names by guid, to name failed items; a missing one shows the guid. */
  names?: ReadonlyMap<string, string>;
  backoffMs?: readonly number[];   // test hook, forwarded to pollBulkResult
  /** Number of items requested (known from the caller's selection). When
   *  provided and > 0, the progress snackbar opens BEFORE the POST rather
   *  than waiting on the response — a fast POST still shows feedback. */
  count?: number;
}

const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

// The first few entries, then how many more: a summary that names every one
// of a large bulk would not fit on screen. The console has them all.
const SUMMARY_NAMES = 3;
const listSome = (items: string[]): string =>
  items.slice(0, SUMMARY_NAMES).join(', ')
  + (items.length > SUMMARY_NAMES ? ` and ${items.length - SUMMARY_NAMES} more` : '');

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

  const nameOf = (guid: string) => `"${o.names?.get(guid) ?? guid}"`;
  for (const f of tally.failures) {
    console.warn(`Bulk ${o.verb}: ${nameOf(f.guid)} (${f.guid}) failed: ${f.reason ?? 'no reason given'}`);
  }
  const parts = [`${plural(tally.deleted, o.noun)} ${o.doneVerb}`];
  if (tally.failed > 0) {
    const named = tally.failures.map(f =>
      f.reason ? `${nameOf(f.guid)} (${f.reason.replace(/\.$/, '')})` : nameOf(f.guid));
    parts.push(`${tally.failed} failed: ${listSome(named)}`);
  }
  if (tally.unknown > 0) {
    parts.push(`${plural(tally.unknown, 'result')} could not be determined: ${listSome(tally.unknowns.map(nameOf))}`);
  }
  const message = parts.join('; ');

  const clean = tally.failed === 0 && tally.unknown === 0;
  if (clean) {
    o.snackBar.show(message);  // default 5s auto-dismiss = readable linger
  } else {
    o.snackBar.error(message); // persistent until manually dismissed
  }
  if (!clean || (hadPending && o.refreshAfterPending)) {
    try { await o.refresh?.(); } catch { /* next manual refresh surfaces it */ }
  }
}
