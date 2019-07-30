import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { createAppReducer } from './reducers/create-application.reducer';
import { deployAppReducer } from './reducers/deploy-app.reducer';
import { createServiceInstanceReducer } from './reducers/create-service-instance.reducer';
import { UsersRolesReducer } from './reducers/users-roles.reducer';
@NgModule({
  imports: [
    StoreModule.forFeature('createApplication', createAppReducer),
    StoreModule.forFeature('deployApplication', deployAppReducer),
    StoreModule.forFeature('createServiceInstance', createServiceInstanceReducer),
    StoreModule.forFeature('manageUsersRoles', UsersRolesReducer),
  ]
})
export class CloudFoundryReducersModule { }
