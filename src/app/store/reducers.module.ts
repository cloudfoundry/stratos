import { requestDataReducer, requestReducer } from './reducers/api-request-reducers.generator';
import { CNSISEffect } from './effects/cnsis.effects';
import { EndpointSchema } from './actions/cnsis.actions';
import { ApiActionTypes, NonApiActionTypes } from './actions/request.actions';
import { combineReducers, StoreModule, ActionReducerMap, State } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment';
import { AppState } from './app-state';
import { appMetadataRequestReducer } from './reducers/app-metadata-request.reducer';
import { appMetadataReducer } from './reducers/app-metadata.reducer';
import { authReducer } from './reducers/auth.reducer';
import { cnsisReducer } from './reducers/cnsis.reducer';
import { createAppReducer } from './reducers/create-application.reducer';
import { dashboardReducer } from './reducers/dashboard-reducer';
import { createPaginationReducer } from './reducers/pagination-reducer/pagination.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { NgModule } from '@angular/core';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { routerReducer } from '@ngrx/router-store';
import { RouterStateSnapshot, Params } from '@angular/router';
import { actionHistoryReducer } from './reducers/action-history-reducer';
import { MetadataState } from './types/app-metadata.types';
import { listReducer } from './reducers/list.reducer';
import { generateDefaultState } from './reducers/api-request-reducer/request-helpers';
import { CfEntityStateNames } from './types/entity.types';
import { OtherEntityStateNames } from './types/other-entity.types';


export function logger(reducer): any {
  // default, no options
  return storeLogger()(reducer);
}

const appMetadataReducers: ActionReducerMap<MetadataState> = {
  values: appMetadataReducer,
  requests: appMetadataRequestReducer
};

export function appMetaDataReducer(state, action): MetadataState {
  // https://github.com/ngrx/platform/issues/116#issuecomment-317297642
  return combineReducers<MetadataState>(appMetadataReducers)(state, action);
}

export const appReducers = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  cnsis: cnsisReducer,
  pagination: createPaginationReducer([
    ApiActionTypes.API_REQUEST_START,
    ApiActionTypes.API_REQUEST_SUCCESS,
    ApiActionTypes.API_REQUEST_FAILED
  ]),
  request: requestReducer,
  requestData: requestDataReducer,
  dashboard: dashboardReducer,
  createApplication: createAppReducer,
  appMetadata: appMetaDataReducer,
  actionHistory: actionHistoryReducer,
  lists: listReducer,
  // routerReducer: routerReducer,  // Create action for router navigation
};

let metaReducers = [];
if (!environment.production) {
  metaReducers = [storeFreeze];
  if (environment.logEnableConsoleActions) {
    metaReducers.push(logger);
  }
}

@NgModule({
  imports: [
    StoreModule.forRoot(
      appReducers,
      {
        metaReducers
      }
    ),
    StoreDevtoolsModule.instrument({
      maxAge: 100
    }),
  ],
})
export class AppReducersModule { }
