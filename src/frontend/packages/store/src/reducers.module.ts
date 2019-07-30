import { NgModule } from '@angular/core';
import { ActionReducer, ActionReducerMap, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { storeFreeze } from 'ngrx-store-freeze';
import { localStorageSync } from 'ngrx-store-localstorage';

import { environment } from '../../core/src/environments/environment';
import { getDashboardStateSessionId } from './helpers/store-helpers';
import { actionHistoryReducer } from './reducers/action-history-reducer';
import { requestReducer } from './reducers/api-request-reducers.generator';
import { authReducer } from './reducers/auth.reducer';
import { currentUserRolesReducer } from './reducers/current-user-roles-reducer/current-user-roles.reducer';
import { recentlyVisitedReducer } from './reducers/current-user-roles-reducer/recently-visited.reducer';
import { userFavoriteGroupsReducer } from './reducers/current-user-roles-reducer/user-favorites-groups.reducer';
import { dashboardReducer } from './reducers/dashboard-reducer';
import { endpointsReducer } from './reducers/endpoints.reducer';
import { internalEventReducer } from './reducers/internal-events.reducer';
import { listReducer } from './reducers/list.reducer';
import { requestPaginationReducer } from './reducers/pagination-reducer.generator';
import { routingReducer } from './reducers/routing.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';

// NOTE: Revisit when ngrx-store-logger supports Angular 7 (https://github.com/btroncone/ngrx-store-logger)

// import { storeLogger } from 'ngrx-store-logger';

// https://github.com/btroncone/ngrx-store-logger/issues/34
// export function logger(reducer) {
//   // default, no options
//   return storeLogger()(reducer);
// }

export const appReducers = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  endpoints: endpointsReducer,
  pagination: requestPaginationReducer,
  request: requestReducer,
  // This is added as part of the entity catalogue module.
  // requestData,
  dashboard: dashboardReducer,
  actionHistory: actionHistoryReducer,
  lists: listReducer,
  routing: routingReducer,
  internalEvents: internalEventReducer,
  currentUserRoles: currentUserRolesReducer,
  userFavoritesGroups: userFavoriteGroupsReducer,
  recentlyVisited: recentlyVisitedReducer,
} as ActionReducerMap<{}>;

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  // This is done to ensure we don't accidentally apply state from session storage from another user.
  let globalUserId = null;
  return localStorageSync({
    storageKeySerializer: (id) => {
      return globalUserId || id;
    },
    syncCondition: () => {
      if (globalUserId) {
        return true;
      }
      const userId = getDashboardStateSessionId();
      if (userId) {
        globalUserId = userId;
        return true;
      }
      return false;
    },
    keys: ['dashboard'],
    rehydrate: false,

  })(reducer);
}
const metaReducers = [localStorageSyncReducer];
if (!environment.production) {
  metaReducers.push(storeFreeze);
  // if (environment.logEnableConsoleActions) {
  //   metaReducers.push(logger);
  // }
}
const storeModule = StoreModule.forRoot(
  appReducers,
  {
    metaReducers
  }
);
const imports = environment.production ? [
  storeModule
] : [
    storeModule,
    StoreDevtoolsModule.instrument({
      maxAge: 100,
      logOnly: !environment.production
    })
  ];

@NgModule({
  imports
})
export class AppReducersModule { }
