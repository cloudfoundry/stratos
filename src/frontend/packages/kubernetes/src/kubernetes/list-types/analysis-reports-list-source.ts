import { NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { safeUnsubscribe } from '@stratosui/core';
import { ListDataSource } from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import { interval, type Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import type { AppState } from '../../../../store/src/public-api';
import { isFetchingPage } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import type { GetAnalysisReports } from '../store/analysis.actions';
import type { AnalysisReport } from '../store/kube.types';

export class AnalysisReportsDataSource extends ListDataSource<AnalysisReport> {


  private analysisAction: GetAnalysisReports;
  private pollInterval: Subscription;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<AnalysisReport>,
    endpointService: KubernetesEndpointService,
    ngZone: NgZone,
  ) {
    const action = kubeEntityCatalog.analysisReport.actions.getMultiple(endpointService.baseKube.guid);
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (entity: AnalysisReport) => action.entity[0].getId(entity),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig,
    });
    this.analysisAction = action;

    this.startPoll(store, ngZone);
  }

  destroy() {
    safeUnsubscribe(this.pollInterval);
  }

  private startPoll(store: Store<AppState>, ngZone: NgZone) {
    ngZone.runOutsideAngular(() => {
      this.pollInterval = interval(5000).subscribe(() => this.poll(store, ngZone));
    });
  }
  private poll(store: Store<AppState>, ngZone: NgZone) {
    kubeEntityCatalog.analysisReport.store.getPaginationMonitor(this.analysisAction.kubeGuid).pagination$.pipe(
      first(),
      map(isFetchingPage)
    ).subscribe(isFetchingPageRes => {
      if (!isFetchingPageRes) {
        ngZone.run(() => {
          store.dispatch(this.analysisAction);
        });
      }
    });
  }
}
