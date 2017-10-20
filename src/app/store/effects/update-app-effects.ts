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
  IsNewAppNameFree
} from '../actions/create-applications-page.actions';
import { AppState } from './../app-state';
import { UpdateExistingApplication, UPDATE_SUCCESS, GetApplication, UPDATE } from '../actions/application.actions';
import { ApiActionTypes } from '../actions/api.actions';
import { GetAppMetadataAction, AppMetadataProperties } from '../actions/app-metadata.actions';
import { WrapperAPIActionSuccess } from '../types/api.types';
import { AppMetadataType } from '../types/app-metadata.types';


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

      const actions = [
        // TODO: RC REMOVE. At the moment this is done so the app metadata env vars environment_json matches that of the app
        new GetAppMetadataAction(action.apiAction.guid, action.apiAction.cnis, AppMetadataProperties.ENV_VARS as AppMetadataType)];

      return actions;
    });

}
