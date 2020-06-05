import { Action } from '@ngrx/store';

export const GET_CURRENT_USER_RELATIONS = '[Current User] Get relations';
export const GET_CURRENT_USER_RELATIONS_SUCCESS = '[Current User] Get relations success';
export const GET_CURRENT_USER_RELATIONS_FAILED = '[Current User] Get relations failed';

export class GetCurrentUsersRelations implements Action {
  type = GET_CURRENT_USER_RELATIONS;
}