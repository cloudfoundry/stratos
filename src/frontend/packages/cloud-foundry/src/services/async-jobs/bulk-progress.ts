import { HttpClient } from '@angular/common/http';
import { pollJob } from './write-with-job';
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
