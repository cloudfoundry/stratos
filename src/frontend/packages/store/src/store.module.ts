import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';

import { ActionHistoryEffect } from './effects/action-history.effects';
import { APIEffect } from './effects/api.effects';
import { AppVariablesEffect } from '../../cloud-foundry/src/store/effects/app-variables.effects';
import { AppEffects } from './effects/app.effects';
import { AuthEffect } from './effects/auth.effects';
import { CloudFoundryEffects } from './effects/cloud-foundry.effects';
import { EndpointApiError } from './effects/endpoint-api-errors.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { MetricsEffect } from './effects/metrics.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { RecursiveDeleteEffect } from './effects/recursive-entity-delete.effect';
import { RequestEffect } from './effects/request.effects';
import { RouteEffect } from './effects/route.effects';
import { RouterEffect } from './effects/router.effects';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SnackBarEffects } from './effects/snackBar.effects';
import { SystemEffects } from './effects/system.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { UpdateAppEffects } from './effects/update-app-effects';
import { UserFavoritesEffect } from './effects/user-favorites-effect';
import { UserProfileEffect } from './effects/user-profile.effects';
import { UsersRolesEffects } from './effects/users-roles.effects';
import { AppReducersModule } from './reducers.module';
import { PipelineHttpClient } from './entity-request-pipeline/pipline-http-client.service';

@NgModule({
  providers: [
    PipelineHttpClient
  ],
  imports: [
    AppReducersModule,
    HttpModule,
    HttpClientModule,
    EffectsModule.forRoot([
      APIEffect,
      EndpointApiError,
      AuthEffect,
      UAASetupEffect,
      EndpointsEffect,
      UpdateAppEffects,
      PaginationEffects,
      ActionHistoryEffect,
      AppVariablesEffect,
      RouterEffect,
      SystemEffects,
      SnackBarEffects,
      SetClientFilterEffect,
      CloudFoundryEffects,
      MetricsEffect,
      RequestEffect,
      UserProfileEffect,
      UsersRolesEffects,
      RecursiveDeleteEffect,
      AppEffects,
      RouteEffect,
      UserFavoritesEffect,
    ]),
  ]
})
export class AppStoreModule { }
