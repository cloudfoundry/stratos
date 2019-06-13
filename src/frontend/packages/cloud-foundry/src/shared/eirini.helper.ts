import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { AppState } from '../../../store/src/app-state';
import { endpointsRegisteredMetricsEntitiesSelector } from '../../../store/src/selectors/endpoint.selectors';
import { EndpointModel, EndpointRelationTypes } from '../../../store/src/types/endpoint.types';

export enum CfScheduler {
  DIEGO = 'Diego',
  EIRINI = 'Eirini'
}

export const eiriniEnabled = (store: Store<AppState>): Observable<boolean> => {
  return store.select('auth').pipe(
    map((auth) => auth.sessionData &&
      auth.sessionData['plugin-config'] &&
      auth.sessionData['plugin-config'].eiriniEnabled === 'true'
    ),
  );
};

export const canConfigureEirini = (store: Store<AppState>): Observable<boolean> => {
  const hasConnectedMetricsEndpoints$ = store.select(endpointsRegisteredMetricsEntitiesSelector).pipe(
    first(),
    map(registeredMetrics => Object.values(registeredMetrics).filter(registeredMetric => !!registeredMetric.user)),
    map(connectedMetrics => !!connectedMetrics.length)
  );
  return combineLatest([
    eiriniEnabled(store),
    hasConnectedMetricsEndpoints$
  ]).pipe(
    map(([eirini, hasConnectedMetricsEndpoints]) => eirini && hasConnectedMetricsEndpoints)
  );
};

export const cfEiriniRelationship = (cf: EndpointModel) => {
  const relations = cf.relations ? cf.relations.receives : [];
  return relations.find(receive => receive.type === EndpointRelationTypes.METRICS_EIRINI);
};

export const cfEiriniRelationshipLabel = (cf: EndpointModel) => {
  return cfEiriniRelationship(cf) ? CfScheduler.EIRINI : CfScheduler.DIEGO;
};
