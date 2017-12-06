import { SystemInfo } from './../types/system.types';
import { HttpClient } from '@angular/common/http';
import { GET_SYSTEM_INFO, GetSystemInfo, GetSystemSuccess, GetSystemFailed } from './../actions/system.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Actions, Effect } from '@ngrx/effects';
import { Injectable } from '@angular/core';

@Injectable()
export class SystemEffects {
    constructor(
        private httpClient: HttpClient,
        private actions$: Actions,
        private store: Store<AppState>
    ) { }

    @Effect() getInfo$ = this.actions$.ofType<GetSystemInfo>(GET_SYSTEM_INFO)
        .mergeMap(() => {
            return this.httpClient.get('/pp/v1/info')
                .map((info: SystemInfo) => {
                    return new GetSystemSuccess(info);
                });
        })
        .catch((e) => {
            return [new GetSystemFailed()];
        });
}
