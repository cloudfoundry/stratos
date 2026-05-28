import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { createAppReducer } from './reducers/create-application.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature('createApplication', createAppReducer),
  ]
})
export class CloudFoundryReducersModule { }
