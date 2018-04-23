import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppState } from '../app-state';
import { IRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess, StartRequestAction } from './../types/request.types';
import { FetchUserProfileAction, GET_USERPROFILE, UpdateUserProfileAction,
  UPDATE_USERPROFILE, UpdateUserPasswordAction, UPDATE_USERPASSWORD } from '../actions/user-profile.actions';
import { userProfileSchemaKey } from '../helpers/entity-factory';
import { userProfileStoreNames, UserProfileInfo } from '../types/user-profile.types';
import { environment } from './../../../environments/environment.prod';
import { rootUpdatingKey } from '../reducers/api-request-reducer/types';

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

  @Effect() getUserProfileInfo$ = this.actions$.ofType<FetchUserProfileAction>(GET_USERPROFILE)
    .mergeMap(action => {
      const apiAction = {
        entityKey: userProfileStoreNames.type,
        guid: UserProfileEffect.guid,
        type: action.type,
      } as IRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      return this.httpClient.get(`/pp/${proxyAPIVersion}/uaa/Users/${action.guid}`)
        .mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: { [userProfileStoreNames.type]: { [UserProfileEffect.guid]: info } },
              result: [UserProfileEffect.guid]
            }, apiAction)
          ];
        }).catch((e) => {
          return [
            new WrapperRequestActionFailed('Could not get User Profile Info', apiAction),
          ];
        });
    });

  @Effect() updateUserProfileInfo$ = this.actions$.ofType<UpdateUserProfileAction>(UPDATE_USERPROFILE)
    .mergeMap(action => {
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
      const headers = {'If-Match': version.toString()};
      if (action.password) {
        headers['x-stratos-password'] = action.password;
      }

      console.log(headers);
      return this.httpClient.put(`/pp/${proxyAPIVersion}/uaa/Users/${guid}`, action.profile, { headers } )
        .mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: { [userProfileStoreNames.type]: { [UserProfileEffect.guid]: info } },
              result: [UserProfileEffect.guid]
            }, apiAction)
          ];
        }).catch((e) => {
          return [
            new WrapperRequestActionFailed('Could not update User Profile Info', apiAction),
          ];
        });
    });

    @Effect() updateUserPrassword$ = this.actions$.ofType<UpdateUserPasswordAction>(UPDATE_USERPASSWORD)
    .mergeMap(action => {
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
      return this.httpClient.put(`/pp/${proxyAPIVersion}/uaa/Users/${guid}/password`, action.passwordChanges, { headers })
        .mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: {},
              result: []
            }, apiAction)
          ];
        }).catch((e) => {
          return [
            new WrapperRequestActionFailed('Could not update User Password', apiAction),
          ];
        });
    });
}
