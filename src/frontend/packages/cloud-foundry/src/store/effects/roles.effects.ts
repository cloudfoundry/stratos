import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { GET_CURRENT_USER_RELATION, GetUserRelations } from '../../actions/permissions.actions';
import { CFAppState } from '../../cf-app-state';
import { fetchCfUserRole } from '../../user-permissions/cf-user-roles-fetch';

// TODO: RC MOVE all GET_CURRENT_USER_RELATION
@Injectable()
export class PermissionEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<CFAppState>
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetUserRelations>(GET_CURRENT_USER_RELATION),
    map(action => {
      return fetchCfUserRole(this.store, action, this.httpClient).pipe(
        map((success) => ({ type: action.actions[1] })) // TODO: RC FIX error handling
      );
    })
  );
}