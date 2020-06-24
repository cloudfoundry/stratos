import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { GET_SYSTEM_INFO, GetSystemInfo, GetSystemSuccess } from '../actions/system.actions';
import { InternalAppState } from '../app-state';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { SystemInfo } from '../types/system.types';


@Injectable()
export class SystemEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<InternalAppState>
  ) { }

  @Effect() getInfo$ = this.actions$.pipe(
    ofType<GetSystemInfo>(GET_SYSTEM_INFO),
    mergeMap(action => {
      // Associated action with be either get endpoint or get all endpoints/
      // Start action for those two are dispatched here, as well as error handling
      // Success actions are handling in the effect associated with GetSystemSuccess
      this.store.dispatch(new StartRequestAction(action));
      const { associatedAction } = action;
      this.store.dispatch(new StartRequestAction(associatedAction, 'fetch'));
      return this.httpClient.get('/pp/v1/info').pipe(
        mergeMap((info: SystemInfo) => {
          return [
            new GetSystemSuccess(info, action.login, associatedAction),
            new WrapperRequestActionSuccess({ entities: {}, result: [] }, action)
          ];
        }), catchError((e) => {
          return [
            { type: action.actions[2] },
            new WrapperRequestActionFailed('Could not fetch system info', action)
          ];
        }));
    }));
}
