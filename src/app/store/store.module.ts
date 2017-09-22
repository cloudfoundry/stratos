import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { storeLogger } from 'ngrx-store-logger';

import { entitiesReducer } from './reducers/entity.reducer';
import { authReducer } from './reducers/auth.reducer';
import { uaaSetupReducer } from './reducers/uaa-setup.reducers';
import { cnsisReducer } from './reducers/cnsis.reducer';
import { paginationReducer } from './reducers/pagination.reducer';
import { apiRequestReducer } from './reducers/api-request-reducer';

import { APIEffect } from './effects/api.effects';
import { AuthEffect } from './effects/auth.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { CNSISEffect } from './effects/cnsis.effects';

import { environment } from '../../environments/environment';


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
      apiRequest: apiRequestReducer
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
      CNSISEffect
    ]),
  ]
})
export class AppStoreModule { }
