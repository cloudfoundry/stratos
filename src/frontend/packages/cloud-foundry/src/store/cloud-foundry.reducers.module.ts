import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { createAppReducer } from './reducers/create-application.reducer';
import { deployAppReducer } from './reducers/deploy-app.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('createApplication', createAppReducer),
    StoreModule.forFeature('deployApplication', deployAppReducer),
  ]
})
export class CloudFoundryReducersModule { }
