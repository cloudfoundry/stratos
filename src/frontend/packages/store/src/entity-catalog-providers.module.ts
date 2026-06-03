import { NgModule } from '@angular/core';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';

/**
 * This module provides the entityCatalog singleton via an injection token to
 * break circular dependencies. The former ngrx `EntityServiceFactory` /
 * `EntityMonitorFactory` / `PaginationMonitorFactory` providers were removed
 * with the request/pagination store engine.
 */
@NgModule({
  providers: [
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class EntityCatalogProvidersModule { }
