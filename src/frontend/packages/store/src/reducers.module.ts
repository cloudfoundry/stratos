import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule } from '@ngrx/store';

import { LocalStorageService } from './helpers/local-storage-service';
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

export const appReducers: ActionReducerMap<{}> = {
  auth: authReducer,
  uaaSetup: uaaSetupReducer,
  endpoints: endpointsReducer,
  pagination: requestPaginationReducer,
  request: requestReducer,
  // This is added as part of the entity catalog module.
  // requestData,
  dashboard: dashboardReducer,
  lists: listReducer,
  routing: routingReducer,
  internalEvents: internalEventReducer,
  currentUserRoles: currentUserRolesReducer,
  userFavoritesGroups: userFavoriteGroupsReducer,
  recentlyVisited: recentlyVisitedReducer,
};

@NgModule({
  imports: [
    StoreModule.forRoot(
      appReducers,
      {
        metaReducers: [
          LocalStorageService.storeToLocalStorageSyncReducer
        ],
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: false
        }
      }
    )
  ]
})
export class AppReducersModule { }
