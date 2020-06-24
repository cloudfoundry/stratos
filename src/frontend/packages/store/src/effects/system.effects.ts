import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { GET_SYSTEM_INFO, GetSystemFailed, GetSystemInfo, GetSystemSuccess } from '../actions/system.actions';
import { InternalAppState } from '../app-state';
import { STRATOS_ENDPOINT_TYPE } from '../base-entity-schemas';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../types/request.types';
import { SystemInfo, systemStoreNames } from '../types/system.types';

@Injectable()
export class SystemEffects {
  constructor(
    private httpClient: HttpClient,
    private actions$: Actions,
    private store: Store<InternalAppState>
  ) { }

  static guid = 'info';

  @Effect() getInfo$ = this.actions$.pipe(
    ofType<GetSystemInfo>(GET_SYSTEM_INFO),
    mergeMap(action => {
      const apiAction = {
        entityType: systemStoreNames.type,
        endpointType: STRATOS_ENDPOINT_TYPE,
        guid: SystemEffects.guid,
        type: action.type,
      } as EntityRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction));
      const { associatedAction } = action;
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(associatedAction, actionType));
      return this.httpClient.get('/pp/v1/info').pipe(
        mergeMap((info: SystemInfo) => {
          return [
            new GetSystemSuccess(info, action.login, associatedAction),
            new WrapperRequestActionSuccess({ entities: {}, result: [] }, apiAction)
          ];
        }), catchError((e) => {
          return [
            new GetSystemFailed(),
            new WrapperRequestActionFailed('Could not get system endpoints', associatedAction),
            new WrapperRequestActionFailed('Could not fetch system info', apiAction)
          ];
        }));
    }));
}
