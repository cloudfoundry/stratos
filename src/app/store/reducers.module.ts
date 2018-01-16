import { NgModule } from '@angular/core';
import { ActionReducer, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment';
import { actionHistoryReducer } from './reducers/action-history-reducer';
import { requestDataReducer, requestReducer } from './reducers/api-request-reducers.generator';
import { authReducer } from './reducers/auth.reducer';
import { cnsisReducer } from './reducers/cnsis.reducer';
import { createAppReducer } from './reducers/create-application.reducer';
import { dashboardReducer } from './reducers/dashboard-reducer';
import { listReducer } from './reducers/list.reducer';
import { requestPaginationReducer } from './reducers/pagination-reducer.generator';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { ActionReducerMap } from '@ngrx/store/src/models';
// import { appMetaDataReducer } from './reducers/app-metadata-reducer.generator';


export function logger(reducer) {
  // default, no options
  return storeLogger()(reducer);
}

export const appReducers = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  cnsis: cnsisReducer,
  pagination: requestPaginationReducer,
  request: requestReducer,
  requestData: requestDataReducer,
  dashboard: dashboardReducer,
  createApplication: createAppReducer,
  // appMetadata: appMetaDataReducer,
  actionHistory: actionHistoryReducer,
  lists: listReducer
} as ActionReducerMap<{}>;

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
