import { HttpClient } from '@angular/common/http';
import { Injectable, computed, Injector, inject, runInInjectionContext } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import { SessionService } from '../../../../core/src/core/session.service';
import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';
import { KubeScoreReportHelper } from './kubescore-report.helper';
import { PopeyeReportHelper } from './popeye-report.helper';
import { AnalysisReport } from '../store/kube.types';
import { getHelmReleaseDetailsFromGuid } from '../workloads/store/workloads-entity-factory';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

export interface KubernetesAnalysisType {
  name: string;
  id: string;
  namespaceAware: boolean;
  iconUrl?: string;
  descriptionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KubernetesAnalysisService {
  kubeEndpointService = inject(KubernetesEndpointService);
  activatedRoute = inject(ActivatedRoute);
  private session = inject(SessionService);
  private http = inject(HttpClient);
  private snackbarService = inject(SnackBarService);

  kubeGuid: string;

  public analyzers$: Observable<KubernetesAnalysisType[]>;
  // strict: assigned inside the constructor's runInInjectionContext callback;
  // emits null when analysis is disabled (template guards with @if/async).
  public namespaceAnalyzers$!: Observable<KubernetesAnalysisType[] | null>;

  public enabled$: Observable<boolean>;
  public hideAnalysis$: Observable<boolean>;

  // Wave-3.5: refresh trigger replaces the legacy
  // `ResetPaginationOfType(action)` ngrx dispatch. Consumers that
  // re-fetch the report list now subscribe to a stream gated on this
  // BehaviorSubject's tick.
  private readonly refreshTrigger$ = new BehaviorSubject<number>(0);

  // Reads the `plugins.analysis` flag from session data via the
  // signal-native SessionService — no ngrx Store / `store.select('auth')`.
  public static isAnalysisEnabled(session: SessionService): Observable<boolean> {
    return of(!!session?.sessionData()?.plugins?.analysis).pipe(startWith(false));
  }

  private injector = inject(Injector);

  constructor() {
    const kubeEndpointService = this.kubeEndpointService;
    const activatedRoute = this.activatedRoute;

    this.kubeGuid = kubeEndpointService.kubeGuid || getHelmReleaseDetailsFromGuid(activatedRoute.snapshot.params.guid).endpointId;

    // Is the backend plugin available?
    this.enabled$ = KubernetesAnalysisService.isAnalysisEnabled(this.session);
    this.hideAnalysis$ = this.enabled$.pipe(map(enabled => !enabled));

    const allEngines: Record<string, { name: string; id: string; namespaceAware: boolean; descriptionUrl: string }> = {
      popeye:
      {
        name: 'PopEye',
        id: 'popeye',
        namespaceAware: true,
        descriptionUrl: '/core/assets/custom/analysis/popeye.md'
      },
      'kube-score':
      {
        name: 'Kube Score',
        id: 'kube-score',
        namespaceAware: true,
        descriptionUrl: '/core/assets/custom/analysis/kubescore.md'
      }
    };

    // Determine which analyzers are enabled — read off plugin-config via
    // the SessionService signal-native shim instead of store.select('auth').
    const pluginCfg = this.session.sessionData()?.['plugin-config'];
    const enginesCsv = pluginCfg?.analysisEngines;
    const enabledAnalyzers: KubernetesAnalysisType[] = enginesCsv
      ? enginesCsv.split(',').map(e => allEngines[e.trim()]).filter(e => !!e)
      : [];
    this.analyzers$ = of(enabledAnalyzers);

    // Convert to signals for computed within injection context
    runInInjectionContext(this.injector, () => {
      const analyzersSignal = toSignal(
        this.analyzers$,
        { initialValue: [] as KubernetesAnalysisType[] }
      );

      const enabledSignal = toSignal(
        this.enabled$,
        { initialValue: false }
      );

      // Compute namespace analyzers
      const namespaceAnalyzersComputed = computed(() => {
        const analyzers = analyzersSignal();
        const enabled = enabledSignal();
        if (!enabled) {
          return null;
        }
        return analyzers.filter(v => v.namespaceAware);
      });

      this.namespaceAnalyzers$ = toObservable(namespaceAnalyzersComputed);
    });
  }

  public delete(endpointID: string, item: { id: string }): Observable<any> {
    const url = `/pp/v1/analysis/reports`;
    return this.http.delete(url, { body: [item.id] }).pipe(
      tap(() => this.refresh()),
    );
  }

  // Bump the refresh tick — consumers that watch the refresh stream
  // (e.g. report-list pages) will re-issue their fetch. Replaces the
  // legacy `store.dispatch(new ResetPaginationOfType(action))` flow.
  public refresh(): void {
    this.refreshTrigger$.next(this.refreshTrigger$.value + 1);
  }

  public run(id: string, endpointID: string, namespace?: string, app?: string): Observable<any> {
    const url = `/pp/v1/analysis/run/${id}/${endpointID}`;
    const obs$ = this.http.post<AnalysisReport>(url, { namespace, app });
    obs$.subscribe(() => {
      const type = id.charAt(0).toUpperCase() + id.substring(1);
      let msg;
      if (app) {
        msg = `${type} analysis started for workload '${app}'`;
      } else if (namespace) {
        msg = `${type} analysis started for namespace '${namespace}'`;
      } else {
        msg = `${type} analysis started for the Kubernetes cluster`;
      }
      this.snackbarService.showWithLink(msg, ['kubernetes', endpointID, 'analysis'], 'View', 5000);
      this.refresh();
    });
    return obs$;
  }

  public getByID(endpoint: string, id: string, _refresh = false): Observable<AnalysisReport> {
    // Always do a network fetch — there's no entity cache to wait for.
    // The detail view requires the heavy `report` payload, which is only
    // returned on this dedicated detail endpoint (the list endpoint
    // returns headers only).
    const url = `/pp/v1/analysis/reports/${endpoint}/${id}`;
    return this.http.get<AnalysisReport>(url).pipe(
      map(report => {
        this.processReport(report);
        return report;
      }),
      filter(entity => !!entity?.report),
    );
  }

  public getByPath(endpointID: string, path: string, _refresh = false): Observable<AnalysisReport[]> {
    const url = `/pp/v1/analysis/completed/${endpointID}/${path}`;
    // Re-fire the request on each refresh tick. switchMap cancels any
    // in-flight request, mirroring the legacy ResetPaginationOfType
    // semantics.
    return this.refreshTrigger$.pipe(
      switchMap(() => this.http.get<AnalysisReport[]>(url).pipe(
        catchError(() => of([] as AnalysisReport[])),
      )),
      filter(entities => !!entities),
    );
  }

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
        break;
    }
  }
}
