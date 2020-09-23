import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { METRICS_ENDPOINT_TYPE } from '../../../../../store/src/helpers/stratos-entity-factory';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { EiriniMetricsService } from './eirini-metrics.service';

export enum CfContainerOrchestrator {
  DIEGO = 'Diego',
  EIRINI = 'Eirini'
}

@Injectable()
export class ContainerOrchestrationService {

  containerOrchestrator$: Observable<CfContainerOrchestrator>;

  /**
   *
   */
  constructor(
    private store: Store<AppState>,
    public eiriniService: EiriniMetricsService
  ) {
  }

  public static canConfigureOrchestrator(store: Store<AppState>): Observable<boolean> {
    const hasConnectedMetricsEndpoints$ = stratosEntityCatalog.endpoint.store.getPaginationService().entities$.pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => endpoints.filter(endpoint => endpoint.cnsi_type === METRICS_ENDPOINT_TYPE)),
      first(),
      map(registeredMetrics => Object.values(registeredMetrics).filter(registeredMetric => !!registeredMetric.user)),
      map(connectedMetrics => !!connectedMetrics.length)
    );
    return combineLatest([
      EiriniMetricsService.eiriniEnabled(store),
      hasConnectedMetricsEndpoints$
    ]).pipe(
      map(([eirini, hasConnectedMetricsEndpoints]) => eirini && hasConnectedMetricsEndpoints)
    );
  }

  public canConfigureOrchestrator(): Observable<boolean> {
    return ContainerOrchestrationService.canConfigureOrchestrator(this.store);
  }

  getContainerOrchestrator(cfGuid: string): Observable<CfContainerOrchestrator> {
    return stratosEntityCatalog.endpoint.store.getEntityService(cfGuid).waitForEntity$.pipe(
      // TODO: RC should do a better job here, mention we're assuming diego??
      // TODO: RC Improve... should not default to diego... try to determine if eirini
      map(cf => EiriniMetricsService.cfEiriniRelationship(cf.entity) ? CfContainerOrchestrator.EIRINI : CfContainerOrchestrator.DIEGO),
    );
  }

}