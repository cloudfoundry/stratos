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
import { UpdateExistingApplication, UPDATE_SUCCESS, GetApplication, UPDATE } from '../actions/application.actions';
import { WrapperAPIActionSuccess, ApiActionTypes } from '../actions/api.actions';
import { GetAppMetadataAction, AppMetadataProperties, AppMetadataType } from '../actions/app-metadata.actions';


@Injectable()
export class UpdateAppEffects {

    constructor(
        private http: Http,
        private actions$: Actions,
        private store: Store<AppState>
    ) {
    }

    @Effect() UpdateAppInStore$ = this.actions$.ofType<WrapperAPIActionSuccess>(UPDATE_SUCCESS)
        .mergeMap((action: WrapperAPIActionSuccess) => {


            const actions = [new GetApplication(
                action.apiAction.guid,
                action.apiAction.cnis,
            ),
            // TODO: RC REMOVE
            new GetAppMetadataAction(action.apiAction.guid, action.apiAction.cnis, AppMetadataProperties.ENV_VARS as AppMetadataType)];

            const app = action.response.entities.application;
            if (app && app.entity && app.entity.entity && app.entity.entity.state === 'STARTED') {
                actions.push(
                    new GetAppMetadataAction(action.apiAction.guid, action.apiAction.cnis,
                        AppMetadataProperties.INSTANCES as AppMetadataType));
            }
            return actions;
        });

}
