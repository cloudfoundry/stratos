import { Action } from '@ngrx/store';

import { EndpointUser, INewlyConnectedEndpointInfo, SessionData } from '@stratosui/store';

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
export const CF_ROLE_SESSION_ENDPOINTS = '[CF Roles] Session endpoints';

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

/**
 * Carries verified-session data so CF role-state can propagate admin
 * permissions from `sessionData.endpoints.cf`. Replaces the auth slice's
 * `SESSION_VERIFIED` (`VerifiedSession`) coupling — dispatched by
 * `CfEndpointRoleSyncService` from a signal effect on
 * `AuthDataService.sessionData`.
 */
export class CfRoleSessionEndpointsAction implements Action {
  public type = CF_ROLE_SESSION_ENDPOINTS;
  constructor(public sessionData: SessionData) { }
}
