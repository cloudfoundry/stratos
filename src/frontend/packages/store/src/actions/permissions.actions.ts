import { Action } from '@ngrx/store';

import { SessionData } from '../types/auth.types';

export const GET_CURRENT_USER_RELATIONS = '[Current User] Get relations';
export const GET_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get relations success';
export const GET_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get relations failed';

export const CURRENT_USER_ROLES_SESSION_VERIFIED = '[Current User] Session verified';

export class GetCurrentUsersRelations implements Action {
  type = GET_CURRENT_USER_RELATIONS;
}

/**
 * Carries verified-session data so the current-user-roles slice can apply the
 * session user's internal admin scopes. Replaces the auth slice's
 * `SESSION_VERIFIED` (`VerifiedSession`) coupling — dispatched by
 * {@link AuthDataService} on a successful verify.
 */
export class CurrentUserRolesSessionVerified implements Action {
  type = CURRENT_USER_ROLES_SESSION_VERIFIED;
  constructor(public sessionData: SessionData) { }
}
