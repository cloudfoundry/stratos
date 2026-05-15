import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { APIEffect } from './effects/api.effects';
import { ApiKeyEffect } from './effects/apiKey.effects';
import { AuthEffect } from './effects/auth.effects';
import { EndpointApiError } from './effects/endpoint-api-errors.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { MetricsEffect } from './effects/metrics.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { PermissionsEffects } from './effects/permissions.effect';
import { RecursiveDeleteEffect } from './effects/recursive-entity-delete.effect';
import { RouterEffect } from './effects/router.effects';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SystemEffects } from './effects/system.effects';
import { UserFavoritesEffect } from './effects/user-favorites-effect';
import { UserProfileEffect } from './effects/user-profile.effects';
import { EntityCatalogProvidersModule } from './entity-catalog-providers.module';
import { PipelineHttpClient } from './entity-request-pipeline/pipline-http-client.service';
import { AppReducersModule } from './reducers.module';


@NgModule({
  providers: [
    // Explicitly provide PipelineHttpClient for Angular 20 DI compatibility
    // Even though it has providedIn: 'root', re-declaring helps ensure proper initialization
    PipelineHttpClient
  ],
  imports: [
    AppReducersModule,
    EntityCatalogProvidersModule,
    HttpClientModule,
    EffectsModule.forRoot([
      APIEffect,
      EndpointApiError,
      AuthEffect,
      EndpointsEffect,
      PaginationEffects,
      RouterEffect,
      SystemEffects,
      SetClientFilterEffect,
      MetricsEffect,
      UserProfileEffect,
      RecursiveDeleteEffect,
      UserFavoritesEffect,
      PermissionsEffects,
      ApiKeyEffect
    ])
  ]
})
export class AppStoreModule { }
