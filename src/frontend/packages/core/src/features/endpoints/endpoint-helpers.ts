import { Type } from '@angular/core';

import { EndpointModel } from '../../../../store/src/public-api';
import { EndpointListDetailsComponent } from '../../shared/components/list/list-types/endpoint/endpoint-list.helpers';


export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export interface EndpointIcon {
  name: string;
  font: string;
}

// Any initial endpointTypes listDetailsComponent should be added here
export const coreEndpointListDetailsComponents: Type<EndpointListDetailsComponent>[] = [];

// Client Redirect URI for SSO
export function getSSOClientRedirectURI(): string {
  return window.location.protocol + '//' + window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') + '/pp/v1/auth/sso_login_callback';
}
