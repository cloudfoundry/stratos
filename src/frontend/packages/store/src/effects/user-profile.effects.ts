
import { switchMap, mergeMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import {
  FetchUserProfileAction,
  GET_USERPROFILE,
  UPDATE_USERPASSWORD,
  UPDATE_USERPROFILE,
  UpdateUserPasswordAction,
  UpdateUserProfileAction,
} from '../actions/user-profile.actions';
import { AppState } from '../app-state';
import { rootUpdatingKey } from '../reducers/api-request-reducer/types';
import { UserProfileInfo, userProfileStoreNames } from '../types/user-profile.types';
import {
  IRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from './../types/request.types';
import { environment } from '../../../core/src/environments/environment';


const { proxyAPIVersion } = environment;

export const userProfilePasswordUpdatingKey = 'password';

@Injectable()
export class UserProfileEffect {

  public static guid = 'userProfile';

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpClient: HttpClient,
  ) { }

  @Effect() getUserProfileInfo$ = this.actions$.ofType<FetchUserProfileAction>(GET_USERPROFILE).pipe(
    mergeMap(action => {
      const apiAction = {
        entityKey: userProfileStoreNames.type,
        guid: UserProfileEffect.guid,
        type: action.type,
      } as IRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.httpClient.get(`/pp/${proxyAPIVersion}/uaa/Users/${action.guid}`).pipe(
        mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: { [userProfileStoreNames.type]: { [UserProfileEffect.guid]: info } },
              result: [UserProfileEffect.guid]
            }, apiAction)
          ];
        }), catchError((e) => {
          return [
            new WrapperRequestActionFailed('Could not get User Profile Info', apiAction),
          ];
        }));
    }));

  @Effect() updateUserProfileInfo$ = this.actions$.ofType<UpdateUserProfileAction>(UPDATE_USERPROFILE).pipe(
    mergeMap(action => {
      const apiAction = {
        entityKey: userProfileStoreNames.type,
        guid: UserProfileEffect.guid,
        type: action.type,
        updatingKey: rootUpdatingKey
      } as IRequestAction;
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const guid = action.profile.id;
      const version = action.profile.meta.version;
      const headers = { 'If-Match': version.toString() };
      if (action.password) {
        headers['x-stratos-password'] = action.password;
      }

      return this.httpClient.put(`/pp/${proxyAPIVersion}/uaa/Users/${guid}`, action.profile, { headers }).pipe(
        mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: { [userProfileStoreNames.type]: { [UserProfileEffect.guid]: info } },
              result: [UserProfileEffect.guid]
            }, apiAction)
          ];
        }), catchError((e) => {
          return [
            new WrapperRequestActionFailed('Could not update User Profile Info', apiAction),
          ];
        }));
    }));

  @Effect() updateUserPrassword$ = this.actions$.ofType<UpdateUserPasswordAction>(UPDATE_USERPASSWORD).pipe(
    mergeMap(action => {
      const apiAction = {
        entityKey: userProfileStoreNames.type,
        guid: UserProfileEffect.guid,
        type: action.type,
        updatingKey: userProfilePasswordUpdatingKey
      } as IRequestAction;
      // Use the creating action for password change
      const actionType = 'update';
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const guid = action.id;
      const headers = {
        'x-stratos-password': action.passwordChanges.oldPassword,
        'x-stratos-password-new': action.passwordChanges.password
      };
      return this.httpClient.put(`/pp/${proxyAPIVersion}/uaa/Users/${guid}/password`, action.passwordChanges, { headers }).pipe(
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
