import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, firstValueFrom, timer } from 'rxjs';
import type {
  AsyncJobResult,
  JobState,
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
 *   - 500ms, 1s, 2s, cap 3s backoff
 *   - onProgress callback for UI wiring (button spinners, stepper progress)
 *   - 404 on poll → status UNKNOWN (the HA-degradation rule: k8s multi-
 *     replica deploys without session affinity can route the GET to a
 *     replica that doesn't know the job; caller refetches the target
 *     entity to determine actual state)
 *
 * Generic parameter T is the shape of the final state on COMPLETE — e.g.,
 * void for delete, StApp for start/stop. Both paths converge on the same
 * shape: T is the unwrapped backend result, never an envelope. Bodies
 * that don't match the envelope (legacy or non-Stratos callers) pass
 * through verbatim.
 */
export interface WriteWithJobOptions {
  onProgress?: (job: StratosJob) => void;
  /** Backoff sequence in ms (capped at last value). Default: [500, 1000, 2000, 3000]. */
  backoffMs?: readonly number[];
}

export async function writeWithJob<T>(
  http: HttpClient,
  call: Observable<HttpResponse<unknown>>,
  opts: WriteWithJobOptions = {},
): Promise<AsyncJobResult<T>> {
  const resp = await firstValueFrom(call);

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
      // Server broke contract. Treat as UNKNOWN so caller refetches;
      // better than throwing and leaving the UI in an ambiguous state.
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
    errors: [{ code: `http.${resp.status}`, message: resp.statusText || 'request failed' }],
  });
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

async function pollJob<T>(
  http: HttpClient,
  jobId: string,
  opts: WriteWithJobOptions,
): Promise<AsyncJobResult<T>> {
  const backoff = opts.backoffMs ?? [500, 1000, 2000, 3000];
  const url = `/pp/v1/stratos/jobs/${encodeURIComponent(jobId)}`;

  for (let i = 0; ; i++) {
    let job: StratosJob;
    try {
      const resp = await firstValueFrom(http.get<StratosJob>(url, { observe: 'response' }));
      if (resp.status === 200 && resp.body) {
        job = resp.body;
      } else {
        // Non-200 with a body — treat as unknown.
        return { status: 'UNKNOWN', state: undefined, jobId };
      }
    } catch (err) {
      // 404 → status unknown per HA-degradation rule. Other errors (e.g.,
      // network failures) also surface as UNKNOWN so the UI can refetch
      // instead of stranding on an exception during a polling loop.
      return { status: 'UNKNOWN', state: undefined, jobId };
    }

    opts.onProgress?.(job);

    if (job.state === 'COMPLETE') {
      return { status: 'COMPLETE', state: job.result as T | undefined, jobId };
    }
    if (job.state === 'FAILED') {
      throw new StratosJobError(job);
    }

    const wait = backoff[Math.min(i, backoff.length - 1)];
    // Tests pass backoffMs: [0] to bypass wall-clock waits. timer(0) still
    // schedules a macrotask which vitest may not drain inside the test
    // function — just yield a microtask instead so the HttpTestingController
    // sees the next request deterministically.
    if (wait > 0) {
      await firstValueFrom(timer(wait));
    } else {
      await Promise.resolve();
    }
  }
}
