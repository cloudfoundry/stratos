import { combineReducers, StoreModule, ActionReducerMap, State } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment';
import { AppState } from './app-state';
import { apiRequestReducer } from './reducers/api-request-reducer';
import { appMetadataRequestReducer } from './reducers/app-metadata-request.reducer';
import { appMetadataReducer } from './reducers/app-metadata.reducer';
import { authReducer } from './reducers/auth.reducer';
import { cnsisReducer } from './reducers/cnsis.reducer';
import { createAppReducer } from './reducers/create-application.reducer';
import { dashboardReducer } from './reducers/dashboard-reducer';
import { entitiesReducer } from './reducers/entity.reducer';
import { paginationReducer } from './reducers/pagination.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { NgModule } from '@angular/core';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
// import { StoreRouterConnectingModule, routerReducer, RouterStateSerializer } from '@ngrx/router-store';
import { RouterStateSnapshot, Params } from '@angular/router';
import { actionHistoryReducer } from './reducers/action-history-reducer';
import { MetadataState } from './types/app-metadata.types';


export function logger(reducer): any {
  // default, no options
  return storeLogger()(reducer);
}

const appMetadataReducers: ActionReducerMap<any> = {
  values: appMetadataReducer,
  requests: appMetadataRequestReducer
};

export function appMetaDataReducer(state, action): MetadataState {
  // https://github.com/ngrx/platform/issues/116#issuecomment-317297642
  return combineReducers<MetadataState>(appMetadataReducers)(state, action);
}


// https://stackoverflow.com/questions/46075374/can-ngrx-router-store-4-be-used-with-ngrx-store-2-2
// export interface RouterStateUrl {
//   url: string;
//   queryParams: Params;
// }
// export class CustomRouterStateSerializer
//   implements RouterStateSerializer<RouterStateUrl> {
//   serialize(routerState: RouterStateSnapshot): RouterStateUrl {
//     const { url } = routerState;
//     const queryParams = routerState.root.queryParams;

//     return { url, queryParams };
//   }
// }
// providers: [
//   { provide: RouterStateSerializer, useClass: CustomRouterStateSerializer },
// ]

export const appReducers = {
  entities: entitiesReducer,
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  cnsis: cnsisReducer,
  pagination: paginationReducer,
  apiRequest: apiRequestReducer,
  dashboard: dashboardReducer,
  createApplication: createAppReducer,
  appMetadata: appMetaDataReducer,
  actionHistory: actionHistoryReducer,
};
// TODO: Add the below line back in once https://github.com/ngrx/platform/issues/446 is confirmed fixed (bug spams ROUTER_CANCEL on log in)
// routerReducer: routerReducer,


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
    // StoreRouterConnectingModule
  ],

})
export class AppReducersModule { }
