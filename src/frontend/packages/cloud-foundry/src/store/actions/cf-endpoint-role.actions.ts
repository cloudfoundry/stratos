import { Action } from '@ngrx/store';

import { EndpointUser, INewlyConnectedEndpointInfo } from '@stratosui/store';

/**
 * Wave 5 (W36-B) — CF endpoint role-state lifecycle actions.
 *
 * Replaces the legacy `EndpointActionComplete` listeners in
 * `currentCfUserRolesReducer` (REGISTER/CONNECT/DISCONNECT/UNREGISTER
 * `_ENDPOINTS_SUCCESS`). Dispatched by `CfEndpointRoleSyncService` from
 * signal effects on `EndpointsDataService`.
 */

export const CF_ROLE_ENDPOINT_REGISTERED = '[CF Roles] Endpoint registered';
export const CF_ROLE_ENDPOINT_CONNECTED = '[CF Roles] Endpoint connected';
export const CF_ROLE_ENDPOINT_REMOVED = '[CF Roles] Endpoint removed';

export class CfRoleEndpointRegisteredAction implements Action {
  public type = CF_ROLE_ENDPOINT_REGISTERED;
  constructor(public guid: string) { }
}

export class CfRoleEndpointConnectedAction implements Action {
  public type = CF_ROLE_ENDPOINT_CONNECTED;
  constructor(
    public guid: string,
    public user: EndpointUser | INewlyConnectedEndpointInfo['user'],
  ) { }
}

export class CfRoleEndpointRemovedAction implements Action {
  public type = CF_ROLE_ENDPOINT_REMOVED;
  constructor(public guid: string) { }
}
