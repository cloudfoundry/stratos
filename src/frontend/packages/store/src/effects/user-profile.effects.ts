import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';

import {
  FetchUserProfileAction,
  GET_USERPROFILE,
  UPDATE_USERPASSWORD,
  UPDATE_USERPROFILE,
  UpdateUserPasswordAction,
  UpdateUserProfileAction,
} from '../actions/user-profile.actions';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { proxyAPIVersion } from '../jetstream';
import { UserProfileInfo } from '../types/user-profile.types';
import { DispatchOnlyAppState } from './../app-state';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from './../types/request.types';


@Injectable()
export class UserProfileEffect {

  constructor(
    private actions$: Actions,
    private store: Store<DispatchOnlyAppState>,
    private httpClient: HttpClient,
  ) { }

  @Effect() getUserProfileInfo$ = this.actions$.pipe(
    ofType<FetchUserProfileAction>(GET_USERPROFILE),
    mergeMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const entityKey = entityCatalog.getEntityKey(action);
      return this.httpClient.get(`/pp/${proxyAPIVersion}/users/${action.userGuid}`).pipe(
        mergeMap((info: UserProfileInfo) => [
          new WrapperRequestActionSuccess({
            entities: { [entityKey]: { [action.guid]: info } },
            result: [action.guid]
          }, action)
        ]),
        catchError((e) => [
          new WrapperRequestActionFailed('Could not get User Profile Info', action),
        ])
      );
    }));

  @Effect() updateUserProfileInfo$ = this.actions$.pipe(
    ofType<UpdateUserProfileAction>(UPDATE_USERPROFILE),
    mergeMap((action: UpdateUserProfileAction) => {
      this.store.dispatch(new StartRequestAction(action, 'update'));
      const userGuid = action.profile.id;
      const version = action.profile.meta.version;
      const headers = { 'If-Match': version.toString() };
      if (action.password) {
        headers['x-stratos-password'] = action.password;
      }

      return this.httpClient.put(`/pp/${proxyAPIVersion}/users/${userGuid}`, action.profile, { headers }).pipe(
        mergeMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: {},
              result: []
            }, action),
          ];
        }),
        catchError((e) => [
          new WrapperRequestActionFailed('Could not update User Profile Info', action),
        ]));
    }));

  @Effect() updateUserPassword$ = this.actions$.pipe(
    ofType<UpdateUserPasswordAction>(UPDATE_USERPASSWORD),
    mergeMap((action: UpdateUserPasswordAction) => {
      this.store.dispatch(new StartRequestAction(action, 'update'));
      const userGuid = action.id;
      const headers = {
        'x-stratos-password': action.passwordChanges.oldPassword,
        'x-stratos-password-new': action.passwordChanges.password
      };
      return this.httpClient.put(`/pp/${proxyAPIVersion}/users/${userGuid}/password`, action.passwordChanges, { headers }).pipe(
        switchMap((info: UserProfileInfo) => {
          return [
            new WrapperRequestActionSuccess({
              entities: {},
              result: []
            }, action)
          ];
        }),
        catchError((e) => [
          new WrapperRequestActionFailed('Could not update User Password', action),
        ])
      );
    }));
}
