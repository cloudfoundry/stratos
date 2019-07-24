import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule, ActionReducer, Store } from '@ngrx/store';

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
    StoreModule.forFeature('cloud-foundry', appReducers)
  ]
})
export class CloudFoundryReducersModule { }
