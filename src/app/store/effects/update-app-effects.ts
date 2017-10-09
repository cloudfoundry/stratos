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
import { UpdateExistingApplication, UPDATE_SUCCESS, GetApplication, GetApplicationSummary, UPDATE } from '../actions/application.actions';
import { WrapperAPIActionSuccess, ApiActionTypes } from '../actions/api.actions';


@Injectable()
export class UpdateAppEffects {

    constructor(
        private http: Http,
        private actions$: Actions,
        private store: Store<AppState>
    ) {
    }

    @Effect({ dispatch: false }) UpdateAppInStore$ = this.actions$.ofType<WrapperAPIActionSuccess>(UPDATE_SUCCESS)
        .do((action: WrapperAPIActionSuccess) => {
            this.store.dispatch(new GetApplication(
                action.apiAction.guid,
                action.apiAction.cnis,
            ));
            this.store.dispatch(new GetApplicationSummary(
                action.apiAction.guid,
                action.apiAction.cnis,
            ));
        });

}
