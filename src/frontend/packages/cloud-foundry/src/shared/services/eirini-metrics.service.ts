import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { RouterNav } from '../../../../store/src/actions/router.actions';
import { AppState } from '../../../../store/src/app-state';
import { METRICS_ENDPOINT_TYPE } from '../../../../store/src/helpers/stratos-entity-factory';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import { EndpointsRelation } from '../../../../store/src/types/endpoint.types';
import { cfEiriniRelationship } from '../eirini.helper';

@Injectable()
export class EiriniMetricsService {

  constructor(
    private store: Store<AppState>,
  ) {

  }

  public eiriniEnabled(): Observable<boolean> {
    return this.store.select('auth').pipe(
      map(auth => auth.sessionData &&
        auth.sessionData['plugin-config'] &&
        auth.sessionData['plugin-config'].eiriniEnabled === 'true'
      ),
    );
  }

  public canConfigureOrchestrator(): Observable<boolean> {
    const hasConnectedMetricsEndpoints$ = stratosEntityCatalog.endpoint.store.getPaginationService().entities$.pipe(
      filter(endpoints => !!endpoints),
      map(endpoints => endpoints.filter(endpoint => endpoint.cnsi_type === METRICS_ENDPOINT_TYPE)),
      first(),
      map(registeredMetrics => Object.values(registeredMetrics).filter(registeredMetric => !!registeredMetric.user)),
      map(connectedMetrics => !!connectedMetrics.length)
    );
    return combineLatest([
      this.eiriniEnabled(),
      hasConnectedMetricsEndpoints$
    ]).pipe(
      map(([eirini, hasConnectedMetricsEndpoints]) => eirini && hasConnectedMetricsEndpoints)
    );
  };

  public eiriniMetricsProvider(endpointId: string): Observable<EndpointsRelation> {
    const eiriniProvider$ = stratosEntityCatalog.endpoint.store.getEntityService(endpointId).waitForEntity$.pipe(
      map(em => cfEiriniRelationship(em.entity))
    );
    return combineLatest([
      this.eiriniEnabled(),
      eiriniProvider$
    ]).pipe(
      map(([eirini, eiriniProvider]) => eirini ? eiriniProvider : null)
    );
  }

  // public hasEiriniMetrics(endpointId: string): Observable<boolean> {
  //   return this.eiriniMetricsProvider(endpointId).pipe(
  //     map(eirini => !!eirini)
  //   );
  // }

  configureEirini(cfGuid: string) {
    this.store.dispatch(new RouterNav({ path: `${cfGuid}/eirini`, query: { cf: true } }));
  }
}