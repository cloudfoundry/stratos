import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';
import { combineReducers, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment';
import { APIEffect } from './effects/api.effects';
import { AppMetadataEffect } from './effects/app-metadata.effects';
import { AuthEffect } from './effects/auth.effects';
import { CNSISEffect } from './effects/cnsis.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { apiRequestReducer } from './reducers/api-request-reducer';
import { appMetadataRequestReducer } from './reducers/app-metadata-request.reducer';
import { appMetadataReducer } from './reducers/app-metadata.reducer';
import { authReducer } from './reducers/auth.reducer';
import { cnsisReducer } from './reducers/cnsis.reducer';
import { createAppReducer } from './reducers/create-application.reducer';
import { dashboardReducer } from './reducers/dashboard-reducer';
import { entitiesReducer } from './reducers/entity.reducer';
import { paginationReducer } from './reducers/pagination.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';


export function logger(reducer): any {
  // default, no options
  return storeLogger()(reducer);
}

export const metaReducers = environment.production ? [] : [logger];

@NgModule({
  imports: [
    StoreModule.forRoot({
      entities: entitiesReducer,
      auth: authReducer,
      uaaSetup: uaaSetupReducer,
      cnsis: cnsisReducer,
      pagination: paginationReducer,
      apiRequest: apiRequestReducer,
      dashboard: dashboardReducer,
      appMetadata: combineReducers({ 'values': appMetadataReducer, 'requests': appMetadataRequestReducer }),
      createApplication: createAppReducer,
    }, {
        metaReducers
      }),
    StoreDevtoolsModule.instrument({
      maxAge: 25
    }),

    HttpModule,
    EffectsModule.forRoot([
      APIEffect,
      AuthEffect,
      UAASetupEffect,
      CNSISEffect,
      CreateAppPageEffects,
      AppMetadataEffect,
    ]),
  ]
})
export class AppStoreModule { }
