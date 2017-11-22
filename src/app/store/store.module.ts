import { PaginationEffects } from './effects/pagination.effects';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { APIEffect } from './effects/api.effects';
import { AppMetadataEffect } from './effects/app-metadata.effects';
import { AuthEffect } from './effects/auth.effects';
import { CNSISEffect } from './effects/cnsis.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { AppReducersModule } from './reducers.module';
import { appMetadataReducer } from './reducers/app-metadata.reducer';
import { appMetadataRequestReducer } from './reducers/app-metadata-request.reducer';
import { UpdateAppEffects } from './effects/update-app-effects';
import { ActionHistoryEffect } from './effects/action-history.effects';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { RouterEffect } from './effects/router.effects';


@NgModule({
  imports: [
    AppReducersModule,
    HttpModule,
    EffectsModule.forRoot([
      APIEffect,
      AuthEffect,
      UAASetupEffect,
      CNSISEffect,
      CreateAppPageEffects,
      AppMetadataEffect,
      UpdateAppEffects,
      PaginationEffects,
      ActionHistoryEffect,
      AppVariablesEffect,
      RouterEffect,
    ]),
  ]
})
export class AppStoreModule { }
