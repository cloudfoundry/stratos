import { NgModule } from '@angular/core';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { EntityServiceFactory } from './entity-service-factory.service';
import { PaginationMonitorFactory } from './monitors/pagination-monitor.factory';
import {
  ENTITY_CATALOG_TOKEN,
  ENTITY_SERVICE_FACTORY_TOKEN,
  PAGINATION_MONITOR_FACTORY_TOKEN
} from './tokens/store-injection.tokens';

/**
 * This module provides injection tokens for services to break circular dependencies.
 * It maps the tokens to the actual service instances.
 */
@NgModule({
  providers: [
    // Provide the actual services
    EntityServiceFactory,
    PaginationMonitorFactory,
    // Provide the entityCatalog singleton via token
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    },
    // Map tokens to the services
    {
      provide: ENTITY_SERVICE_FACTORY_TOKEN,
      useExisting: EntityServiceFactory
    },
    {
      provide: PAGINATION_MONITOR_FACTORY_TOKEN,
      useExisting: PaginationMonitorFactory
    }
  ]
})
export class EntityCatalogProvidersModule { }