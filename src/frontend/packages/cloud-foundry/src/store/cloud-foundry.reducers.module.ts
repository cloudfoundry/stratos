import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule, ActionReducer, Store } from '@ngrx/store';
import { createAppReducer } from './reducers/create-application.reducer';
import { deployAppReducer } from './reducers/deploy-app.reducer';

const appReducers = {
  // auth: authReducer,
  // uaaSetup: uaaSetupReducer,
  // endpoints: endpointsReducer,
  // pagination: requestPaginationReducer,
  // request: requestReducer,
  // requestData: requestDataReducer,
  // dashboard: dashboardReducer,
  // createApplication: createAppReducer,
  // deployApplication: deployAppReducer,
  // createServiceInstance: createServiceInstanceReducer,
  // actionHistory: actionHistoryReducer,
  // lists: listReducer,
  // routing: routingReducer,
  // manageUsersRoles: UsersRolesReducer,
  // internalEvents: internalEventReducer,
  // currentUserRoles: currentUserRolesReducer,
  // userFavoritesGroups: userFavoriteGroupsReducer,
  // recentlyVisited: recentlyVisitedReducer
} as ActionReducerMap<{}>;

@NgModule({
  imports: [
    StoreModule.forFeature('createApplication', createAppReducer),
    StoreModule.forFeature('deployApplication', deployAppReducer),
  ]
})
export class CloudFoundryReducersModule { }
