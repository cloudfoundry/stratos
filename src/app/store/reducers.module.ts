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
import { paginationReducer } from './reducers/pagination.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { NgModule } from '@angular/core';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { routerReducer } from '@ngrx/router-store';
import { RouterStateSnapshot, Params } from '@angular/router';
import { actionHistoryReducer } from './reducers/action-history-reducer';
import { MetadataState } from './types/app-metadata.types';
import { listReducer } from './reducers/list.reducer';
import { requestReducerFactory } from './reducers/api-request-reducer/request-reducer.factory';
import { generateDefaultState } from './reducers/api-request-reducer/request-helpers';
import { requestDataReducerFactory } from './reducers/request-data-reducer.factory';
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

export const entitiesForReducer = [
  {
    name: 'cf',
    requestType: 'api',
    entityNames: CfEntityStateNames
  }, {
    name: 'other',
    requestType: 'non-api',
    entityNames: OtherEntityStateNames
  }
];

export function responseReducerFactor(api: boolean) {
  const factoryFunc = api ? requestReducerFactory : requestDataReducerFactory;
  return function responseReducer(state, action) {
    const reducers = {};
    for (const entity of entitiesForReducer) {
      reducers[entity.name] = factoryFunc(entity.entityNames, entity.requestType === 'api' ? [
        ApiActionTypes.API_REQUEST_START,
        ApiActionTypes.API_REQUEST_SUCCESS,
        ApiActionTypes.API_REQUEST_FAILED,
      ] : [
          NonApiActionTypes.START,
          NonApiActionTypes.SUCCESS,
          NonApiActionTypes.FAILED
        ]);
    }
    return combineReducers(reducers)(state, action);
  };
}

// export function responseReducer(state, action) {
//   const reducers = {};
//   for (const entity of entities) {
//     reducers[entity.name] = requestReducerFactory(entity.entityNames, entity.requestType === 'api' ? [
//       ApiActionTypes.API_REQUEST_START,
//       ApiActionTypes.API_REQUEST_SUCCESS,
//       ApiActionTypes.API_REQUEST_FAILED,
//     ] : [
//       NonApiActionTypes.START,
//       NonApiActionTypes.SUCCESS,
//       NonApiActionTypes.FAILED
//     ])
//   }
//   return combineReducers(reducers)(state, action);
// }

// export function requestDataReducer(state, action) {
//   return combineReducers({
//     entities: requestDataReducerFactory(entities.cf, [
//       ApiActionTypes.API_REQUEST_START,
//       ApiActionTypes.API_REQUEST_SUCCESS,
//       ApiActionTypes.API_REQUEST_FAILED,
//     ]),
//     other: requestDataReducerFactory(entities.other, [
//       NonApiActionTypes.START,
//       NonApiActionTypes.SUCCESS,
//       NonApiActionTypes.FAILED
//     ])
//   })(state, action);
// }

// TODO: RC
// export interface RequestDataState {
//   entities: EntitiesState;
//   other: any;
// }

// const requestDataReducers: ActionReducerMap<any> = ;

// export function requestDataReducers(state, action) {
//   // https://github.com/ngrx/platform/issues/116#issuecomment-317297642
//   return combineReducers({
//     entities: entitiesReducer,
//     other: requestsDataReducer
//   })(state, action);
// }

export const appReducers = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  cnsis: cnsisReducer,
  pagination: paginationReducer,
  request: responseReducerFactor(true),
  requestData: responseReducerFactor(false),
  dashboard: dashboardReducer,
  createApplication: createAppReducer,
  appMetadata: appMetaDataReducer,
  actionHistory: actionHistoryReducer,
  lists: listReducer,
  // entities: entitiesReducer,
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
