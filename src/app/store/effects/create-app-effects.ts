import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { environment } from '../../../environments/environment';
import {
    AppNameFree,
    AppNameTaken,
    CHECK_NAME,
    IsNewAppNameFree,
    NewAppCFDetails,
    selectNewAppCFDetails,
} from '../actions/create-applications-page.actions';
import { CreateNewApplicationState } from '../reducers/create-application.reducer';
import { AppState } from './../app-state';


@Injectable()
export class CreateAppPageEffects {

    constructor(
        private http: Http,
        private actions$: Actions,
        private store: Store<AppState>
    ) {
        this.proxyAPIVersion = environment.proxyAPIVersion;
        this.cfAPIVersion = environment.cfAPIVersion;
    }

    proxyAPIVersion: string;
    cfAPIVersion: string;

    @Effect() CheckAppNameIsFree$ = this.actions$.ofType<IsNewAppNameFree>(CHECK_NAME)
        .withLatestFrom(this.store.select(selectNewAppCFDetails))
        .switchMap(([action, cfDetails]: [any, NewAppCFDetails]) => {
            const { cloudFoundry, org, space } = cfDetails;
            const headers = new Headers({ 'x-cap-cnsi-list': cloudFoundry.guid });
            return this.http.get(`/pp/${this.proxyAPIVersion}/proxy/${this.cfAPIVersion}/apps`, {
                params: {
                    'q': `name:${action.name};space_guid:${space.guid}`
                },
                headers
            })
                .map(res => {
                    const apps = res.json();
                    const ourCfApps = apps[cloudFoundry.guid];
                    if (ourCfApps.total_results) {
                        throw Observable.throw('Taken');
                    }
                    return new AppNameFree(action.name);
                })
                .catch(err => {
                    return Observable.of(new AppNameTaken(action.name));
                });
        });
}

export const selectNewAppState = (state: AppState): CreateNewApplicationState => state.createApplication;
