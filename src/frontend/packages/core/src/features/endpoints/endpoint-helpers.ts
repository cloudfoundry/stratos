import { Type } from '@angular/core';
import {
  EndpointModel,
  EndpointsDataService,
} from '@stratosui/store';
import { Observable, defer, from } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { EndpointListDetailsComponent } from '../../shared/components/endpoint-list/endpoint-list.helpers';

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

/**
 * Wave 2 (W36-B): reads endpoint via {@link EndpointsDataService} signal
 * surface instead of `store.select(endpointEntitiesSelector)`.
 *
 * Returns `Observable<boolean>` to preserve consumer signatures (rxjs
 * pipelines in `app.effects.ts`). The observable defers until the service
 * has hydrated so callers behave the same as the legacy `take(1)` over a
 * BehaviorSubject-shaped selector.
 */
export function endpointHasMetrics(endpointGuid: string, endpointsService: EndpointsDataService): Observable<boolean> {
  return defer(() => from(endpointsService.whenReady())).pipe(
    map(() => {
      const endpoint = endpointsService.endpoints().get(endpointGuid);
      return !!endpoint?.metadata && !!endpoint.metadata.metrics;
    }),
    take(1)
  );
}

// There are two different methods for checking if an endpoint has metrics. Need to understand use cases
export function endpointHasMetricsByAvailable(endpointsService: EndpointsDataService, endpointId: string): Observable<boolean> {
  return defer(() => from(endpointsService.whenReady())).pipe(
    map(() => {
      const endpoint = endpointsService.endpoints().get(endpointId);
      return !!endpoint && !!endpoint.metricsAvailable;
    }),
    take(1)
  );
}

// Client Redirect URI for SSO
export function getSSOClientRedirectURI(): string {
  return window.location.protocol + '//' + window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') + '/pp/v1/auth/sso_login_callback';
}
