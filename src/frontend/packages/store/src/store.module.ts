import { HttpClientModule } from '@angular/common/http';
import { NgModule, inject } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { EntityCatalogProvidersModule } from './entity-catalog-providers.module';
import { AppReducersModule } from './reducers.module';
import { EndpointDisconnectCleanupService } from './services/endpoint-disconnect-cleanup.service';


@NgModule({
  imports: [
    AppReducersModule,
    EntityCatalogProvidersModule,
    HttpClientModule,
    EffectsModule.forRoot([])
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
