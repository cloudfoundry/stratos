import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { ActionHistoryEffect } from './effects/action-history.effects';
import { APIEffect } from './effects/api.effects';
import { AuthEffect } from './effects/auth.effects';
import { DashboardEffect } from './effects/dashboard.effects';
import { EndpointApiError } from './effects/endpoint-api-errors.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { MetricsEffect } from './effects/metrics.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { PermissionsEffects } from './effects/permissions.effect';
import { RecursiveDeleteEffect } from './effects/recursive-entity-delete.effect';
import { RouterEffect } from './effects/router.effects';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SystemEffects } from './effects/system.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { UserFavoritesEffect } from './effects/user-favorites-effect';
import { UserProfileEffect } from './effects/user-profile.effects';
import { PipelineHttpClient } from './entity-request-pipeline/pipline-http-client.service';
import { AppReducersModule } from './reducers.module';


@NgModule({
  providers: [
    PipelineHttpClient
  ],
  imports: [
    AppReducersModule,
    HttpClientModule,
    EffectsModule.forRoot([
      DashboardEffect,
      APIEffect,
      EndpointApiError,
      AuthEffect,
      UAASetupEffect,
      EndpointsEffect,
      PaginationEffects,
      ActionHistoryEffect,
      RouterEffect,
      SystemEffects,
      SetClientFilterEffect,
      MetricsEffect,
      UserProfileEffect,
      RecursiveDeleteEffect,
      UserFavoritesEffect,
      PermissionsEffects
    ])
  ]
})
export class AppStoreModule { }
