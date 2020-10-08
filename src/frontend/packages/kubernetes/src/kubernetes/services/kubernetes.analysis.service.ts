import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map, pairwise, startWith, tap } from 'rxjs/operators';

import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';
import { ResetPaginationOfType } from '../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../store/src/app-state';
import { ListActionState, RequestInfoState } from '../../../../store/src/reducers/api-request-reducer/types';
import { kubeEntityCatalog } from '../kubernetes-entity-catalog';
import { GetAnalysisReports } from '../store/analysis.actions';
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

@Injectable()
export class KubernetesAnalysisService {
  kubeGuid: string;

  public analyzers$: Observable<KubernetesAnalysisType[]>;
  public namespaceAnalyzers$: Observable<KubernetesAnalysisType[]>;

  public enabled$: Observable<boolean>;
  public hideAnalysis$: Observable<boolean>;

  private action: GetAnalysisReports;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    private snackbarService: SnackBarService
  ) {
    this.kubeGuid = kubeEndpointService.kubeGuid || getHelmReleaseDetailsFromGuid(activatedRoute.snapshot.params.guid).endpointId;

    // Is the backend plugin available?
    this.enabled$ = this.store.select('auth').pipe(
      map(auth => auth.sessionData.plugins && auth.sessionData.plugins.analysis)
    );

    this.hideAnalysis$ = this.enabled$.pipe(
      map(enabled => !enabled),
      startWith(true),
    );

    const allEngines = {
      popeye:
      {
        name: 'PopEye',
        id: 'popeye',
        namespaceAware: true,
        // iconUrl: '/core/assets/custom/analysis/popeye.png',
        // iconWidth: '80',
        descriptionUrl: '/core/assets/custom/analysis/popeye.md'
      },
      'kube-score':
      {
        name: 'Kube Score',
        id: 'kube-score',
        namespaceAware: true,
        // iconUrl: '/core/assets/custom/analysis/kubescore.png',
        // iconWidth: '120',
        descriptionUrl: '/core/assets/custom/analysis/kubescore.md'
      }
      // {
      //   name: 'Sonobuoy',
      //   id: 'sonobuoy',
      //   namespaceAware: false,
      //   iconUrl: '/core/assets/custom/analysis/sonobuoy.png',
      //   iconWidth: '70',
      //   descriptionUrl: '/core/assets/custom/analysis/sonobuoy.md'
      // }
    };

    // Determine which analyzers are enabled
    this.analyzers$ = this.store.select('auth').pipe(
      filter(auth => !!auth.sessionData['plugin-config']),
      map(auth => auth.sessionData['plugin-config'].analysisEngines),
      map(engines => engines.split(',').map(e => allEngines[e.trim()]).filter(e => !!e))
    );

    this.namespaceAnalyzers$ = combineLatest(
      this.analyzers$,
      this.enabled$
    ).pipe(
      map(([a, enabled]) => {
        if (!enabled) {
          return null;
        }
        return a.filter(v => v.namespaceAware);
      })
    );

    this.action = kubeEntityCatalog.analysisReport.actions.getMultiple(this.kubeGuid);
  }

  public delete(endpointID: string, item: { id: string, }) {
    return kubeEntityCatalog.analysisReport.api.delete(endpointID, item.id);
  }

  public refresh() {
    this.store.dispatch(new ResetPaginationOfType(this.action));
  }

  public run(id: string, endpointID: string, namespace?: string, app?: string): Observable<any> {
    const obs$ = kubeEntityCatalog.analysisReport.api.run<RequestInfoState>(endpointID, id, namespace, app).pipe(
      pairwise(),
      filter(([oldE, newE]) => oldE.creating && !newE.creating),
      map(([, newE]) => newE),
      first()
    );
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
      this.snackbarService.showReturn(msg, ['kubernetes', endpointID, 'analysis'], 'View', 5000);
      this.refresh();
    });
    return obs$;
  }

  public getByID(endpoint: string, id: string, refresh = false): Observable<AnalysisReport> {
    if (refresh) {
      kubeEntityCatalog.analysisReport.api.getById<RequestInfoState>(endpoint, id);
    }

    const entityService = kubeEntityCatalog.analysisReport.store.getById.getEntityService(endpoint, id);
    return entityService.waitForEntity$.pipe(
      map(e => e.entity),
      tap(entity => {
        if (!refresh && !entity.report) {
          kubeEntityCatalog.analysisReport.api.getById<RequestInfoState>(endpoint, id);
          refresh = true;
        }
      }),
      filter(entity => !!entity.report)
    );
  }

  public getByPath(endpointID: string, path: string, refresh = false): Observable<AnalysisReport[]> {
    if (refresh) {
      kubeEntityCatalog.analysisReport.api.getByPath<ListActionState>(endpointID, path);
    }
    return kubeEntityCatalog.analysisReport.store.getByPath.getPaginationService(endpointID, path).entities$.pipe(
      filter(entities => !!entities)
    );
  }

}
