import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { cfUsersRolesReducer } from './reducers/cf-users-roles.reducer';
import { createAppReducer } from './reducers/create-application.reducer';
import { createServiceInstanceReducer } from './reducers/create-service-instance.reducer';
import { deployAppReducer } from './reducers/deploy-app.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('createApplication', createAppReducer),
    StoreModule.forFeature('deployApplication', deployAppReducer),
    StoreModule.forFeature('createServiceInstance', createServiceInstanceReducer),
    StoreModule.forFeature('manageUsersRoles', cfUsersRolesReducer),
  ]
})
export class CloudFoundryReducersModule { }
