import { Type } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { EndpointOnlyAppState } from '../../../../store/src/app-state';
import { endpointEntitiesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { EndpointListDetailsComponent } from '../../shared/components/list/list-types/endpoint/endpoint-list.helpers';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ?
    `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}${endpoint.api_endpoint.Path}` : 'Unknown';
}

export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';

export interface EndpointIcon {
  name: string;
  font: string;
}

export enum EndpointAuthTypeNames {
  CREDS = 'creds',
  SSO = 'sso',
  NONE = 'none'
}

// Any initial endpointTypes listDetailsComponent should be added here
export const coreEndpointListDetailsComponents: Type<EndpointListDetailsComponent>[] = [];

export function endpointHasMetrics(endpointGuid: string, store: Store<EndpointOnlyAppState>): Observable<boolean> {
  return store.select(endpointEntitiesSelector).pipe(
    first(),
    map(state => !!state[endpointGuid].metadata && !!state[endpointGuid].metadata.metrics)
  );
}
