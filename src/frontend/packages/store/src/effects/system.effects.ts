import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap } from 'rxjs/operators';

import { GET_SYSTEM_INFO, GetSystemInfo, GetSystemSuccess } from '../actions/system.actions';
import { InternalAppState } from '../app-state';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { SystemInfo } from '../types/system.types';


@Injectable({
  providedIn: 'root'
})
export class SystemEffects {
  private httpClient = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<InternalAppState>>(Store);
  private appRef = inject(ApplicationRef);


   getInfo$ = createEffect(() => this.actions$.pipe(
    ofType<GetSystemInfo>(GET_SYSTEM_INFO),
    mergeMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      return this.httpClient.get('/pp/v1/info').pipe(
        mergeMap((info: SystemInfo) => {
          this.appRef.tick();
          return [
            new GetSystemSuccess(info, action.login),
            new WrapperRequestActionSuccess({ entities: {}, result: [] }, action)
          ];
        }), catchError((_e) => {
          this.appRef.tick();
          return [
            { type: action.actions[2] },
            new WrapperRequestActionFailed('Could not fetch system info', action)
          ];
        }));
    })));
}
