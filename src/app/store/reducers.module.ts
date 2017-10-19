import { combineReducers, StoreModule, ActionReducerMap } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment.prod';
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

export const appReducers = {
  entities: entitiesReducer,
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  cnsis: cnsisReducer,
  pagination: paginationReducer,
  apiRequest: apiRequestReducer,
  dashboard: dashboardReducer,
  createApplication: createAppReducer,
  appMetadata: appMetaDataReducer
};

// export const metaReducers = environment.production ? [storeFreeze, logger] : [];
// function clearStore(reducer) {
//   return function (state, action) {
//     return reducer(action.type === LOGOUT_SUCCESS ? undefined : state, action);
//   };
// }
// export const metaReducers = [clearStore];

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
    })
  ]
})
export class AppReducersModule { }
