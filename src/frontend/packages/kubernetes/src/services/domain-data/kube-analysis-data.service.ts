import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, defer, firstValueFrom, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { KubeScoreReportHelper } from '../../kubernetes/services/kubescore-report.helper';
import { PopeyeReportHelper } from '../../kubernetes/services/popeye-report.helper';
import { AnalysisReport, StratosError } from '../endpoint-data/kube-types';

// Per-endpoint cache TTL — 60s mirrors the design doc's K8s-rate-limit
// guidance. The legacy ngrx datasource polled every 5s; the signal-
// native consumer drives refresh on user gesture (pull-to-refresh button)
// rather than wall-clock polling.
const REPORTS_TTL_MS = 60_000;

interface EndpointCache {
  reports: AnalysisReport[];
  fetchedAt: number;
  inFlight?: Observable<AnalysisReport[]>;
}

interface ReportByIdCache {
  report: AnalysisReport;
  fetchedAt: number;
  inFlight?: Observable<AnalysisReport>;
}

// Signal-native data service for analysis reports. Replaces the
// `analysisReport` slice of `kubeEntityCatalog`:
//   - List fetch: GET /pp/v1/analysis/reports/:endpoint
//   - Detail fetch: GET /pp/v1/analysis/reports/:endpoint/:id
// The service holds a per-endpoint cache of the list plus a per-(endpoint,id)
// cache of fetched detail reports. Both honour a 60s TTL with in-flight
// dedup so repeat calls during a navigation share the same wire request.
//
// Tristate: per-endpoint fetch failures push StratosErrors onto `_errors`
// and surface the endpoint guid in `_unavailable` so consumers can render
// "Not Available" instead of an empty table.
//
// Backend route discovery: see `src/jetstream/plugins/analysis/main.go`
// (lines 67-83). Routes confirmed:
//   GET /analysis/reports/:endpoint                — list
//   GET /analysis/reports/:endpoint/:id            — detail
//   DELETE /analysis/reports                       — delete N by id
//   POST /analysis/run/:analyzer/:endpoint         — run new analysis
// All routed under the `/pp/v1/...` session group.

@Injectable({ providedIn: 'root' })
export class KubeAnalysisDataService {
  private readonly http = inject(HttpClient);

  // Per-endpoint list cache, keyed by kubeGuid. Stored as a Map inside a
  // signal so consumers projecting `reportsForEndpoint(...)` recompute on
  // mutation.
  private readonly _byEndpoint = signal<Map<string, EndpointCache>>(new Map());
  private readonly _byId = signal<Map<string, ReportByIdCache>>(new Map());
  private readonly _errors = signal<StratosError[]>([]);
  private readonly _unavailable = signal<string[]>([]);

  // Public reactive view of the error / unavailable signals. Errors are
  // capped at 50 entries; older entries are dropped.
  readonly errorsSignal: Signal<StratosError[]> = this._errors.asReadonly();
  readonly unavailable: Signal<string[]> = this._unavailable.asReadonly();

  // Signal projection of the report list for a single endpoint. Returns
  // an empty array until a fetch completes — call `refresh({ kubeGuid })`
  // or `loadReports(kubeGuid)` to trigger an HTTP fetch.
  reportsForEndpoint(kubeGuid: string): Signal<AnalysisReport[]> {
    return computed(() => this._byEndpoint().get(kubeGuid)?.reports ?? []);
  }

  // Cross-endpoint aggregation. Useful for cluster-spanning views; the
  // current analysis tab is single-endpoint only so this folds to one.
  allReports(kubeGuids: readonly string[]): Signal<AnalysisReport[]> {
    const projections = kubeGuids.map(g => this.reportsForEndpoint(g));
    return computed(() => projections.flatMap(p => p()));
  }

  // Convenience errors accessor matching the namespace-data shape so
  // signal-configs can call `data.errors()` uniformly.
  errors(): Signal<StratosError[]> {
    return this.errorsSignal;
  }

  // Imperative: kick off a list fetch for the given endpoint. Honours
  // the TTL — if the cache is fresh, returns the cached list without
  // touching the network. Concurrent callers share one in-flight
  // observable via `shareReplay(1)`.
  loadReports(kubeGuid: string): Observable<AnalysisReport[]> {
    const cached = this._byEndpoint().get(kubeGuid);
    if (cached?.inFlight) {
      return cached.inFlight;
    }
    if (cached && Date.now() - cached.fetchedAt < REPORTS_TTL_MS) {
      return of(cached.reports);
    }
    return this.fetchReports(kubeGuid);
  }

  // Force a re-fetch of the named endpoint regardless of TTL. Drops the
  // cached entry first so a concurrent `loadReports` call sees a cold
  // cache and joins the fresh in-flight observable.
  async refresh(scope: { kubeGuid: string }): Promise<void> {
    this._byEndpoint.update(curr => {
      const next = new Map(curr);
      next.delete(scope.kubeGuid);
      return next;
    });
    this.clearUnavailable(scope.kubeGuid);
    await firstValueFrom(this.fetchReports(scope.kubeGuid));
  }

  // Detail fetch — emits the (possibly normalized) report. Format-
  // specific helpers (`PopeyeReportHelper`, `KubeScoreReportHelper`)
  // mutate `report.report` in place to attach a normalized alert map,
  // mirroring the legacy `AnalysisEffects.processReport()` behavior.
  reportById(kubeGuid: string, id: string, opts?: { refresh?: boolean }): Observable<AnalysisReport> {
    const key = `${kubeGuid}:${id}`;
    const cached = this._byId().get(key);
    if (cached?.inFlight) {
      return cached.inFlight;
    }
    if (cached && !opts?.refresh && Date.now() - cached.fetchedAt < REPORTS_TTL_MS) {
      return of(cached.report);
    }
    return this.fetchReportById(kubeGuid, id);
  }

  private fetchReports(kubeGuid: string): Observable<AnalysisReport[]> {
    const url = `/pp/v1/analysis/reports/${kubeGuid}`;
    const req = defer(() => this.http.get<AnalysisReport[]>(url)).pipe(
      map(items => Array.isArray(items) ? items : []),
      tap(items => {
        this._byEndpoint.update(curr => {
          const next = new Map(curr);
          next.set(kubeGuid, { reports: items, fetchedAt: Date.now() });
          return next;
        });
        this.clearUnavailable(kubeGuid);
      }),
      catchError((err: HttpErrorResponse | unknown) => {
        this.markUnavailable(kubeGuid, err, 'analysis-reports');
        // Cache the empty result so consumers don't loop on errors;
        // the next refresh() call clears the cache.
        this._byEndpoint.update(curr => {
          const next = new Map(curr);
          next.set(kubeGuid, { reports: [], fetchedAt: Date.now() });
          return next;
        });
        return of([] as AnalysisReport[]);
      }),
      finalize(() => {
        // Drop the in-flight handle once settled so a future stale-cache
        // request triggers a fresh fetch rather than re-subscribing the
        // completed observable.
        this._byEndpoint.update(curr => {
          const entry = curr.get(kubeGuid);
          if (!entry?.inFlight) return curr;
          const next = new Map(curr);
          next.set(kubeGuid, { reports: entry.reports, fetchedAt: entry.fetchedAt });
          return next;
        });
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    // Stamp the in-flight observable into the cache so concurrent
    // callers share one wire request.
    this._byEndpoint.update(curr => {
      const existing = curr.get(kubeGuid) ?? { reports: [], fetchedAt: 0 };
      const next = new Map(curr);
      next.set(kubeGuid, { ...existing, inFlight: req });
      return next;
    });
    return req;
  }

  private fetchReportById(kubeGuid: string, id: string): Observable<AnalysisReport> {
    const key = `${kubeGuid}:${id}`;
    const url = `/pp/v1/analysis/reports/${kubeGuid}/${id}`;
    const req = defer(() => this.http.get<AnalysisReport>(url)).pipe(
      map(report => {
        this.processReport(report);
        return report;
      }),
      tap(report => {
        this._byId.update(curr => {
          const next = new Map(curr);
          next.set(key, { report, fetchedAt: Date.now() });
          return next;
        });
      }),
      catchError((err: HttpErrorResponse | unknown) => {
        const status = (err as HttpErrorResponse)?.status;
        const code: StratosError['code'] = status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
        this.addError({
          scope: 'envelope',
          code,
          title: 'analysis-report-detail',
          detail: (err as Error)?.message ?? String(err),
          guid: id,
          affected: [kubeGuid],
        });
        // Re-throw so the consumer's catchError path runs (parity with
        // the legacy `getByID` which surfaced fetch errors to the
        // detail component).
        throw err;
      }),
      finalize(() => {
        this._byId.update(curr => {
          const entry = curr.get(key);
          if (!entry?.inFlight) return curr;
          const next = new Map(curr);
          next.set(key, { report: entry.report, fetchedAt: entry.fetchedAt });
          return next;
        });
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this._byId.update(curr => {
      const existing = curr.get(key);
      const next = new Map(curr);
      next.set(key, {
        report: existing?.report ?? ({} as AnalysisReport),
        fetchedAt: existing?.fetchedAt ?? 0,
        inFlight: req,
      });
      return next;
    });
    return req;
  }

  // Mirrors legacy AnalysisEffects.processReport: pick the right
  // per-format helper to mutate `report.report` in place. The detail
  // component renders the resulting normalized shape via
  // PopeyeReportViewerComponent / KubeScoreReportViewerComponent.
  private processReport(report: AnalysisReport): void {
    const path = (report as unknown as { path?: string }).path;
    if (!path || path.split('/').length !== 2) {
      return;
    }
    switch (report.format) {
      case 'popeye': {
        new PopeyeReportHelper(report as unknown as Record<string, unknown>).map();
        break;
      }
      case 'kubescore': {
        new KubeScoreReportHelper(report as unknown as Record<string, unknown>).map();
        break;
      }
      default:
        // Unknown format — leave as-is. The detail viewer's switch will
        // simply not render a body, mirroring legacy behavior.
        break;
    }
  }

  private addError(err: StratosError): void {
    this._errors.update(curr => [...curr, err].slice(0, 50));
  }

  private markUnavailable(kubeGuid: string, err: unknown, title: string): void {
    this._unavailable.update(curr => curr.includes(kubeGuid) ? curr : [...curr, kubeGuid]);
    const status = (err as HttpErrorResponse)?.status;
    const code: StratosError['code'] =
      status === 401 || status === 403 ? 'UNAUTHORIZED' : 'FETCH_ERROR';
    this.addError({
      scope: 'envelope',
      code,
      title,
      detail: (err as Error)?.message ?? String(err),
      affected: [kubeGuid],
    });
  }

  private clearUnavailable(kubeGuid: string): void {
    this._unavailable.update(curr => curr.filter(g => g !== kubeGuid));
    this._errors.update(curr => curr.filter(e => !(e.affected ?? []).includes(kubeGuid)));
  }
}
