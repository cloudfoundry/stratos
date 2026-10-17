import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, firstValueFrom, fromEvent, race, switchMap, throwError, timer } from 'rxjs';
import type {
  AsyncJobResult,
  JobState,
  StratosError,
  StratosJob,
} from './async-job.types';
import { StratosJobError } from './async-job.types';

/**
 * Wraps a Stratos-native write HTTP call with the hybrid fast-path /
 * handoff behavior described in the async-job contract:
 *
 *  - 200  → the call resolved server-side within the fast-path window.
 *           Body is the canonical fast-path envelope `{state: 'COMPLETE',
 *           result: T}` (every Stratos handler that calls RunFastPath
 *           writes that shape); resolve AsyncJobResult<T> with state set
 *           to the unwrapped result.
 *  - 202  → the server handed off a tracked job. Body is `{id, state,
 *           startedAt}`. Poll /pp/v1/stratos/jobs/{id} with backoff until
 *           the job is terminal, then resolve (COMPLETE) or throw
 *           (FAILED).
 *
 * Callers supply the write call as an `Observable<HttpResponse<unknown>>`
 * (i.e. `http.delete(url, { observe: 'response' })`). The HttpResponse is
 * needed because the 200-vs-202 discrimination happens at the status code
 * — a plain `Observable<T>` throws 202 information away.
 *
 * Polling uses:
 *   - 500ms, 1s, 2s, then every 3s for the first minute; after that each
 *     wait doubles, up to one check every 2 minutes
 *   - onProgress callback for UI wiring (button spinners, stepper progress)
 *   - a poll that could not be answered (network error, 5xx, 429, a 200
 *     without a body) is not an outcome: the job is still running, so
 *     polling carries on with the same backoff
 *   - 404 or another 4xx on poll → status UNKNOWN: the backend does not
 *     know the job, so the operation has ended but its result cannot be
 *     determined; the caller says so and refetches the target entity
 *   - opts.signal lets a caller stop waiting; the promise then rejects
 *     with a DOMException named 'AbortError', which is not an outcome
 *
 * Generic parameter T is the shape of the final state on COMPLETE — e.g.,
 * void for delete, StApp for start/stop. Both paths converge on the same
 * shape: T is the unwrapped backend result, never an envelope. Bodies
 * that don't match the envelope (legacy or non-Stratos callers) pass
 * through verbatim.
 */
export interface WriteWithJobOptions {
  onProgress?: (job: StratosJob) => void;
  /** Backoff sequence in ms (capped at last value), for tests. Default: see pollWait. */
  backoffMs?: readonly number[];
  /** Stop waiting: rejects with a DOMException named 'AbortError'. */
  signal?: AbortSignal;
  /**
   * A poll answered 401 rejects with SignedOutError instead of resolving
   * UNKNOWN: the session ended, not the job, which can be followed again
   * after the next sign-in.
   */
  pauseOnSignOut?: boolean;
  /**
   * Stop following the job at this time (ms since the epoch). Default: the
   * tracking limit from when polling starts. Ends as UNKNOWN with
   * stillRunning: the job carries on in Cloud Foundry.
   */
  deadlineAt?: number;
}

// How long a job is followed, from the console's configuration
// (ASYNC_JOB_TRACKING_LIMIT_IN_MINS, applied when a session starts).
let trackingLimitMs = 60 * 60_000;

/** Set how long a job is followed, in minutes; ignores a missing or non-positive value. */
export function setJobTrackingLimit(minutes: number | undefined): void {
  if (minutes && minutes > 0) {
    trackingLimitMs = minutes * 60_000;
  }
}

export const jobTrackingLimitMs = (): number => trackingLimitMs;

export class SignedOutError extends Error {
  constructor(readonly jobId: string) {
    super(`signed out while following job ${jobId}`);
    this.name = 'SignedOutError';
  }
}

export async function writeWithJob<T>(
  http: HttpClient,
  call: Observable<HttpResponse<unknown>>,
  opts: WriteWithJobOptions = {},
): Promise<AsyncJobResult<T>> {
  let resp: HttpResponse<unknown>;
  try {
    resp = await settle(call, opts.signal);
  } catch (err: unknown) {
    // A failure inside the fast-path window arrives as an HTTP error whose
    // body carries the same errors[] a polled job would.
    if (err instanceof HttpErrorResponse) logFailure(err.url ?? 'write', (err.error as { errors?: LoggedError[] } | null)?.errors);
    throw err;
  }

  // 200-family (including 204): sync-fast. Body is the canonical fast-path
  // envelope `{state: 'COMPLETE', result: T}`; unwrap so the caller sees T
  // directly, matching the polled-handoff path's shape (job.result → state).
  if (resp.status >= 200 && resp.status < 202) {
    return { status: 'COMPLETE', state: unwrapFastPathBody(resp.body) as T | undefined };
  }

  // 202: handoff. Body must be a StratosJob with a stable id.
  if (resp.status === 202) {
    const handoff = resp.body as StratosJob | null;
    if (!handoff?.id) {
      // Server broke contract: there is no job to ask about, so the
      // operation has ended with a result nobody can determine.
      return { status: 'UNKNOWN', state: undefined };
    }
    return pollJob<T>(http, handoff.id, opts);
  }

  // 4xx/5xx would normally have thrown from the observable; if they land
  // here, treat as an opaque failure carrying the body through the error.
  throw new StratosJobError({
    id: '',
    kind: 'unknown',
    state: 'FAILED' as JobState,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // No detail, so the message is this title: name the status in it.
    errors: [{ code: `http.${resp.status}`, message: `HTTP ${resp.status} ${resp.statusText || 'request failed'}` }],
  });
}

// Failure messages show the broker's own words (see StratosJobError and
// extractHttpErrorMessage); the CF code and title they leave out go to the
// console here, the one place both paths pass through.
// A CF passthrough body names the title `title`, a Stratos job `message`.
type LoggedError = Partial<StratosError> & { title?: string };

function logFailure(what: string, errors: LoggedError[] | undefined): void {
  const first = errors?.[0];
  if (first) console.warn(`${what} failed: ${first.code} ${first.message ?? first.title}`, errors);
}

// Recognises the canonical Stratos fast-path 200 envelope and returns
// the unwrapped result. Anything that isn't a `{state: 'COMPLETE',
// result: ...}` object passes through verbatim — covers null bodies,
// 204 No Content, and any non-Stratos handler that bypasses the envelope.
function unwrapFastPathBody(body: unknown): unknown {
  if (
    body !== null
    && typeof body === 'object'
    && (body as Record<string, unknown>).state === 'COMPLETE'
    && 'result' in body
  ) {
    return (body as { result: unknown }).result;
  }
  return body;
}

// Whether a failed poll leaves the job's fate unknown for good. A 404 is
// the backend saying it does not know the job (ids resolve on any replica,
// so it is gone); any other 4xx but 429 means asking again cannot help.
// Everything else - no connection (status 0), a 5xx, 429, a non-HTTP error
// such as a timeout - says nothing about the job, which is still running.
function endsPolling(err: unknown): boolean {
  return err instanceof HttpErrorResponse
    && err.status >= 400 && err.status < 500 && err.status !== 429;
}

const abortError = (): DOMException => new DOMException('Stopped waiting for the job', 'AbortError');

// firstValueFrom that gives up when the caller aborts. Unsubscribing
// cancels an in-flight request; the job itself carries on server-side.
function settle<T>(source: Observable<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) {
    return firstValueFrom(source);
  }
  if (signal.aborted) {
    return Promise.reject(abortError());
  }
  const aborted$ = fromEvent(signal, 'abort').pipe(
    switchMap(() => throwError(abortError)),
  );
  return firstValueFrom(race(source, aborted$));
}

// Quick checks while a write is likely to end soon. Brokers decide how long
// an operation takes, often minutes, so after the first minute each wait
// doubles, up to one check every two minutes.
const EARLY_WAITS_MS = [500, 1000, 2000, 3000];
const QUICK_FOR_MS = 60_000;
const MAX_WAIT_MS = 120_000;

function pollWait(previousMs: number, i: number, elapsedMs: number): number {
  if (elapsedMs < QUICK_FOR_MS) {
    return EARLY_WAITS_MS[Math.min(i, EARLY_WAITS_MS.length - 1)];
  }
  return Math.min(previousMs * 2, MAX_WAIT_MS);
}

export async function pollJob<T>(
  http: HttpClient,
  jobId: string,
  opts: WriteWithJobOptions,
): Promise<AsyncJobResult<T>> {
  const backoff = opts.backoffMs;
  const startedAt = Date.now();
  const deadlineAt = opts.deadlineAt ?? startedAt + trackingLimitMs;
  let wait = 0;
  const url = `/pp/v1/stratos/jobs/${encodeURIComponent(jobId)}`;
  // Logged once when polls start failing and once when they recover, so a
  // long outage does not flood the console.
  let failing = false;

  for (let i = 0; ; i++) {
    let job: StratosJob | null = null;
    try {
      const resp = await settle(http.get<StratosJob>(url, { observe: 'response' }), opts.signal);
      // A 2xx without a job body tells us nothing; ask again.
      job = resp.status === 200 && resp.body ? resp.body : null;
    } catch (err: unknown) {
      if (opts.signal?.aborted) {
        throw err;
      }
      if (opts.pauseOnSignOut && err instanceof HttpErrorResponse && err.status === 401) {
        throw new SignedOutError(jobId);
      }
      if (endsPolling(err)) {
        return { status: 'UNKNOWN', state: undefined, jobId };
      }
      if (!failing) {
        failing = true;
        console.warn(`job ${jobId}: polling failed, retrying`, err);
      }
    }

    if (job) {
      if (failing) {
        failing = false;
        console.warn(`job ${jobId}: polling recovered`);
      }
      opts.onProgress?.(job);

      if (job.state === 'COMPLETE') {
        return { status: 'COMPLETE', state: job.result as T | undefined, jobId };
      }
      if (job.state === 'FAILED') {
        logFailure(job.kind, job.errors);
        throw new StratosJobError(job);
      }
    }

    // Past the limit, stop following: the job is still running in CF. The
    // last wait is cut short so the final check lands on the deadline.
    const left = deadlineAt - Date.now();
    if (left <= 0) {
      return { status: 'UNKNOWN', state: undefined, jobId, stillRunning: true };
    }
    wait = backoff ? backoff[Math.min(i, backoff.length - 1)] : pollWait(wait, i, Date.now() - startedAt);
    wait = Math.min(wait, left);
    // Tests pass backoffMs: [0] to bypass wall-clock waits. timer(0) still
    // schedules a macrotask which vitest may not drain inside the test
    // function — just yield a microtask instead so the HttpTestingController
    // sees the next request deterministically.
    if (wait > 0) {
      await settle(timer(wait), opts.signal);
    } else {
      await Promise.resolve();
      if (opts.signal?.aborted) {
        throw abortError();
      }
    }
  }
}
