import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map } from 'rxjs/operators';

import { GET_CURRENT_CF_USER_RELATION, GetCurrentCfUserRelations } from '../../actions/permissions.actions';
import { CFAppState } from '../../cf-app-state';
import { fetchCfUserRole } from '../../user-permissions/cf-user-roles-fetch';

@Injectable()
export class PermissionEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<CFAppState>
  ) { }

  @Effect() getCurrentUsersPermissions$ = this.actions$.pipe(
    ofType<GetCurrentCfUserRelations>(GET_CURRENT_CF_USER_RELATION),
    map(action => {
      return fetchCfUserRole(this.store, action, this.httpClient).pipe(
        map(() => ({ type: action.actions[1] })),
        catchError(() => [{ type: action.actions[2] }])
      );
    })
  );
}
