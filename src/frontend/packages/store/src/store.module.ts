import { HttpClientModule } from '@angular/common/http';
import { NgModule, inject } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { APIEffect } from './effects/api.effects';
import { ApiKeyEffect } from './effects/apiKey.effects';
import { AuthEffect } from './effects/auth.effects';
import { EndpointApiError } from './effects/endpoint-api-errors.effects';
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
import { EndpointDisconnectCleanupService } from './services/endpoint-disconnect-cleanup.service';


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
export class AppStoreModule {
  // Wave 4 part 1 (W36-B): Eagerly instantiate the cleanup service so its
  // constructor signal effects start observing EndpointsDataService deltas
  // before any user-driven endpoint mutation can fire. The service has
  // `providedIn: 'root'`, so this `inject` triggers the singleton creation.
  constructor() {
    inject(EndpointDisconnectCleanupService);
  }
}
