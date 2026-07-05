import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, of, timer } from 'rxjs';
import { map, mergeMap, reduce, retry, switchMap } from 'rxjs/operators';

// Shared page-drain for Stratos-shape list endpoints, used by
// EndpointDataService and CfUsersPagedDataService. Page 1 inline, pages
// 2..N in parallel (concurrency=4). Reads totalPages from the
// StratosPagedResponse pagination meta (stratos_paging.go:68). Reduces to
// a single {resources, totalResults, totalPages} envelope so the caller
// can populate count signals from page-1 metadata without an extra fetch.
// Tolerates both StratosPagedResponse and the older flat-envelope shape
// (totalResults at the top level) — the backend PR #5337 era still has
// handlers in transition.

export interface DrainedPages<T> {
  resources: T[];
  totalResults: number;
  totalPages: number;
}

// Statuses that indicate a transient transport/gateway failure rather
// than a real CF answer: 0 = network error / connection refused,
// 502/503/504 = gateway-layer failures. Anything else only counts as
// transient when Jetstream explicitly classified it (reason header).
const TRANSIENT_STATUSES = new Set([0, 502, 503, 504]);

// Same cadence as the backend's listWithRouterFlapRetry (2x, 500ms/1s) —
// long enough for a gorouter route-table flap or a rolling restart to
// pass, short enough that a genuinely-down endpoint fails in ~1.5s extra.
const RETRY_DELAYS_MS = [500, 1000];

// The machine-readable classification Jetstream's native-CF error
// middleware sets (native_errors.go). 'unreachable' means a router-level
// or origin availability failure — worth a brief retry regardless of the
// mapped status code.
const STRATOS_ERROR_REASON_HEADER = 'X-Stratos-Error-Reason';

function isTransientCfError(err: unknown): boolean {
  return err instanceof HttpErrorResponse &&
    (TRANSIENT_STATUSES.has(err.status) ||
      err.headers?.get(STRATOS_ERROR_REASON_HEADER) === 'unreachable');
}

export function drainCfPages<T>(http: HttpClient, urlBase: string): Observable<DrainedPages<T>> {
  const perPage = 500;
  type Paged<U> = { resources: U[]; totalResults?: number; pagination?: { totalResults?: number; totalPages?: number } };
  const totalResultsOf = <U>(r: Paged<U>): number => r.pagination?.totalResults ?? r.totalResults ?? r.resources.length;
  // Per-page retry (not whole-drain): a transient failure on page 7 of 12
  // re-fetches only page 7. Non-transient errors rethrow immediately and
  // fail the drain as before.
  const fetchPage = (page: number) =>
    http.get<Paged<T>>(`${urlBase}?per_page=${perPage}&page=${page}`).pipe(
      retry({
        count: RETRY_DELAYS_MS.length,
        delay: (err, retryCount) => {
          if (!isTransientCfError(err)) { throw err; }
          return timer(RETRY_DELAYS_MS[retryCount - 1]);
        },
      }),
    );
  return fetchPage(1).pipe(
    switchMap(firstResp => {
      const totalResults = totalResultsOf(firstResp);
      const totalPages = firstResp.pagination?.totalPages ?? 1;
      const firstResources = firstResp.resources;
      if (totalPages <= 1) {
        return of({ resources: firstResources, totalResults, totalPages });
      }
      const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      return from(remainingPages).pipe(
        mergeMap(p => fetchPage(p).pipe(map(r => r.resources)), 4 /* concurrency */),
        reduce((acc, resources) => [...acc, ...resources], [...firstResources]),
        map(allResources => ({ resources: allResources, totalResults, totalPages })),
      );
    }),
  );
}
