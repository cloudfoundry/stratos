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

  // // TODO: RC getSystemInfo vs getAllEndpoints. when to do start/finish. which to kick off process
  // static guid = 'info';

  @Effect() getInfo$ = this.actions$.pipe(
    ofType<GetSystemInfo>(GET_SYSTEM_INFO),
    mergeMap(action => {
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
            // new GetSystemFailed(),
            { type: action.actions[2] },
            // new WrapperRequestActionFailed('Could not get system endpoints', associatedAction),
            new WrapperRequestActionFailed('Could not fetch system info', action)
          ];
        }));
    }));
}
