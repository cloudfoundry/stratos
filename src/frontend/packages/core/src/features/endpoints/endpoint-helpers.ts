import { Type } from '@angular/core';

import { EndpointModel } from '../../../../store/src/public-api';
import { EndpointListDetailsComponent } from '../../shared/components/list/list-types/endpoint/endpoint-list.helpers';


export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';

export interface EndpointIcon {
  name: string;
  font: string;
}

// Any initial endpointTypes listDetailsComponent should be added here
export const coreEndpointListDetailsComponents: Type<EndpointListDetailsComponent>[] = [];

// TODO: RC
// export function endpointHasMetrics(endpointGuid: string, store: Store<EndpointOnlyAppState>): Observable<boolean> {
//   return store.select(endpointEntitiesSelector).pipe(
//     first(),
//     map(endpointHasCfMetrics)
//   );
// }

// TODO: RC move to metrics or endpoints service. This required succeedEndpointInfo to add given endpointHasMetrics
// There are two different methods for checking if an endpoint has metrics. Need to understand use cases
// export function endpointHasMetricsByAvailable(store: Store<AppState>, endpointId: string): Observable<boolean> {
//   return stratosEntityCatalog.endpoint.store.getEntityService(endpointId).waitForEntity$.pipe(
//     map(endpoint => endpoint.metricsAvailable),
//     first()
//   );
// }

// Client Redirect URI for SSO
export function getSSOClientRedirectURI(): string {
  return window.location.protocol + '//' + window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') + '/pp/v1/auth/sso_login_callback';
}
