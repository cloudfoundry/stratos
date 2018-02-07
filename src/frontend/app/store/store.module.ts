import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';

import { ActionHistoryEffect } from './effects/action-history.effects';
import { APIEffect } from './effects/api.effects';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { AuthEffect } from './effects/auth.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { DeployAppEffects } from './effects/deploy-app.effects';
import { GithubEffects } from './effects/github.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { RouterEffect } from './effects/router.effects';
import { SetAPIFilterEffect } from './effects/set-api-filter.effect';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SnackBarEffects } from './effects/snackBar.effects';
import { SystemEffects } from './effects/system.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { UpdateAppEffects } from './effects/update-app-effects';
import { AppReducersModule } from './reducers.module';

@NgModule({
  imports: [
    AppReducersModule,
    HttpModule,
    HttpClientModule,
    EffectsModule.forRoot([
      APIEffect,
      AuthEffect,
      UAASetupEffect,
      EndpointsEffect,
      CreateAppPageEffects,
      UpdateAppEffects,
      PaginationEffects,
      ActionHistoryEffect,
      AppVariablesEffect,
      RouterEffect,
      SystemEffects,
      SnackBarEffects,
      SetClientFilterEffect,
      SetAPIFilterEffect,
      DeployAppEffects,
      GithubEffects
    ])
  ]
})
export class AppStoreModule {}
