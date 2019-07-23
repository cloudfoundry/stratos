import { NgModule } from '@angular/core';
import { ActionReducerMap, StoreModule } from '@ngrx/store';

import { createAppReducer } from './reducers/create-application.reducer';
import { createServiceInstanceReducer } from './reducers/create-service-instance.reducer';
import { currentUserRolesReducer } from './reducers/current-user-roles-reducer/current-user-roles.reducer';
import { deployAppReducer } from './reducers/deploy-app.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { UsersRolesReducer } from './reducers/users-roles.reducer';

export const appReducers = {
  uaaSetup: uaaSetupReducer,
  createApplication: createAppReducer,
  deployApplication: deployAppReducer,
  createServiceInstance: createServiceInstanceReducer,
  manageUsersRoles: UsersRolesReducer,
  currentUserRoles: currentUserRolesReducer,
} as ActionReducerMap<{}>;

const storeModule = StoreModule.forRoot(
  appReducers
);

const imports = [storeModule];

@NgModule({
  imports
})
export class CloudFoundryReducersModule {}
