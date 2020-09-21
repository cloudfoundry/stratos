import { EndpointModel, EndpointRelationTypes } from '../../../store/src/types/endpoint.types';

export enum CfContainerOrchestrator {
  DIEGO = 'Diego',
  EIRINI = 'Eirini'
}

// TODO: RC move all eirini style helpers into service. MOVED
// export const eiriniEnabled = (store: Store<AppState>): Observable<boolean> => {
//   return store.select('auth').pipe(
//     map((auth) => auth.sessionData &&
//       auth.sessionData['plugin-config'] &&
//       auth.sessionData['plugin-config'].eiriniEnabled === 'true'
//     ),
//   );
// };

// export const canConfigureOrchestrator = (store: Store<AppState>): Observable<boolean> => {
//   const hasConnectedMetricsEndpoints$ = store.select(endpointsRegisteredMetricsEntitiesSelector).pipe(
//     first(),
//     map(registeredMetrics => Object.values(registeredMetrics).filter(registeredMetric => !!registeredMetric.user)),
//     map(connectedMetrics => !!connectedMetrics.length)
//   );
//   return combineLatest([
//     eiriniEnabled(store),
//     hasConnectedMetricsEndpoints$
//   ]).pipe(
//     map(([eirini, hasConnectedMetricsEndpoints]) => eirini && hasConnectedMetricsEndpoints)
//   );
// };

// TODO: RC move these two??
export const cfEiriniRelationship = (cf: EndpointModel) => {
  const relations = cf.relations ? cf.relations.receives : [];
  return relations.find(receive => receive.type === EndpointRelationTypes.METRICS_EIRINI);
};

export const cfEiriniRelationshipLabel = (cf: EndpointModel) => {
  // TODO: RC Improve... should not default to diego... try to determine if eirini
  return;
};
