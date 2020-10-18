import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { METRICS_ENDPOINT_TYPE } from '../../../../../store/src/helpers/stratos-entity-factory';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { DiegoContainerService } from './diego-container.service';
import { EiriniContainerService } from './eirini-container.service';

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
    public eiriniService: EiriniContainerService,
    public diegoService: DiegoContainerService
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
      EiriniContainerService.eiriniEnabled(store),
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
      // TODO: RC Improve... should not default to diego... try to determine if eirini.. or mention we're assuming deigo
      map(cf => EiriniContainerService.cfEiriniRelationship(cf.entity) ? CfContainerOrchestrator.EIRINI : CfContainerOrchestrator.DIEGO),
    );
  }

}