import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';

import { userProfileEntitySchema } from '../../../core/src/base-entity-schemas';
import { environment } from '../../../core/src/environments/environment';
import {
  FetchUserProfileAction,
  GET_USERPROFILE,
  UPDATE_USERPASSWORD,
  UPDATE_USERPROFILE,
  UpdateUserPasswordAction,
  UpdateUserProfileAction,
} from '../actions/user-profile.actions';
import { entityCatalog } from '../entity-catalog/entity-catalog.service';
import { rootUpdatingKey } from '../reducers/api-request-reducer/types';
import { UserProfileInfo } from '../types/user-profile.types';
import { DispatchOnlyAppState } from './../app-state';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from './../types/request.types';


const { proxyAPIVersion } = environment;

export const userProfilePasswordUpdatingKey = 'password';

@Injectable()
export class UserProfileEffect {

  stratosUserConfig = entityCatalog.getEntity(userProfileEntitySchema.endpointType, userProfileEntitySchema.entityType);
  private stratosUserEntityType = userProfileEntitySchema.entityType;
  private stratosUserEndpointType = userProfileEntitySchema.endpointType;

  constructor(
    private actions$: Actions,
    private store: Store<DispatchOnlyAppState>,
    private httpClient: HttpClient,
  ) { }

  @Effect() getUserProfileInfo$ = this.actions$.pipe(
    ofType<FetchUserProfileAction>(GET_USERPROFILE),
    mergeMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      return this.httpClient.get(`/pp/${proxyAPIVersion}/users/${action.userGuid}`).pipe(
        mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: { [this.stratosUserConfig.entityKey]: { [action.guid]: info } },
              result: [action.guid]
            }, action)
          ];
        }), catchError((e) => {
          return [
            new WrapperRequestActionFailed('Could not get User Profile Info', action),
          ];
        }));
    }));

  @Effect() updateUserProfileInfo$ = this.actions$.pipe(
    ofType<UpdateUserProfileAction>(UPDATE_USERPROFILE),
    mergeMap(action => {
      const apiAction = {
        entityType: this.stratosUserEntityType,
        endpointType: this.stratosUserEndpointType,
        guid: FetchUserProfileAction.guid,
        type: action.type,
        updatingKey: rootUpdatingKey
      } as EntityRequestAction;
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const guid = action.profile.id;
      const version = action.profile.meta.version;
      const headers = { 'If-Match': version.toString() };
      if (action.password) {
        headers['x-stratos-password'] = action.password;
      }

      return this.httpClient.put(`/pp/${proxyAPIVersion}/users/${guid}`, action.profile, { headers }).pipe(
        mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: {},
              result: []
            }, apiAction),
          ];
        }), catchError((e) => {
          return [
            new WrapperRequestActionFailed('Could not update User Profile Info', apiAction),
          ];
        }));
    }));

  @Effect() updateUserPassword$ = this.actions$.pipe(
    ofType<UpdateUserPasswordAction>(UPDATE_USERPASSWORD),
    mergeMap(action => {
      const apiAction = {
        entityType: this.stratosUserEntityType,
        endpointType: this.stratosUserEndpointType,
        guid: FetchUserProfileAction.guid,
        type: action.type,
        updatingKey: userProfilePasswordUpdatingKey
      } as EntityRequestAction;
      // Use the creating action for password change
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const guid = action.id;
      const headers = {
        'x-stratos-password': action.passwordChanges.oldPassword,
        'x-stratos-password-new': action.passwordChanges.password
      };
      return this.httpClient.put(`/pp/${proxyAPIVersion}/users/${guid}/password`, action.passwordChanges, { headers }).pipe(
        switchMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: {},
              result: []
            }, apiAction)
          ];
        }), catchError((e) => {
          return [
            new WrapperRequestActionFailed('Could not update User Password', apiAction),
          ];
        }));
    }));
}
