import { NgModule } from '@angular/core';
import { ActionReducer, ActionReducerMap, StoreModule } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';

import { LocalStorageService, LocalStorageSyncTypes } from './helpers/local-storage-service';
import { getDashboardStateSessionId } from './public-api';
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
import { PaginationState } from './types/pagination.types';


// NOTE: Revisit when ngrx-store-logger supports Angular 7 (https://github.com/btroncone/ngrx-store-logger)

// import { storeLogger } from 'ngrx-store-logger';

// https://github.com/btroncone/ngrx-store-logger/issues/34
// export function logger(reducer) {
//   // default, no options
//   return storeLogger()(reducer);
// }

export const appReducers: ActionReducerMap<{}> = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  endpoints: endpointsReducer,
  pagination: requestPaginationReducer,
  request: requestReducer,
  // This is added as part of the entity catalog module.
  // requestData,
  dashboard: dashboardReducer,
  actionHistory: actionHistoryReducer,
  lists: listReducer,
  routing: routingReducer,
  internalEvents: internalEventReducer,
  currentUserRoles: currentUserRolesReducer,
  userFavoritesGroups: userFavoriteGroupsReducer,
  recentlyVisited: recentlyVisitedReducer,
};

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  // This is done to ensure we don't accidentally apply state from session storage from another user.
  let globalUserId = null;
  return localStorageSync({
    // Decide the key to store each section by
    storageKeySerializer: (storeKey: LocalStorageSyncTypes) => LocalStorageService.makeKey(globalUserId, storeKey),
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
    keys: [
      LocalStorageSyncTypes.DASHBOARD,
      LocalStorageSyncTypes.LISTS,
      {
        [LocalStorageSyncTypes.PAGINATION]: {
          serialize: (pagination: PaginationState) => LocalStorageService.parseForStorage<PaginationState>(
            pagination,
            LocalStorageSyncTypes.PAGINATION
          ),
        }
      },
      // encrypt: // TODO: RC only store guids, so shouldn't need
      // decrypt: // TODO: RC
    ],
    rehydrate: false,

  })(reducer);
}

const metaReducers = [localStorageSyncReducer];

@NgModule({
  imports: [
    StoreModule.forRoot(
      appReducers,
      {
        metaReducers,
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: false
        }
      }
    )
  ]
})
export class AppReducersModule { }
