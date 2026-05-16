import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state';
import { EntityCatalogHelpers } from '../entity-catalog/entity-catalog.helper';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';
import { PaginationMonitor } from './pagination-monitor';

@Injectable()
export class PaginationMonitorFactory {
  private store = inject<Store<AppState>>(Store);
  private entityCatalog = inject<IEntityCatalog>(ENTITY_CATALOG_TOKEN);


  private monitorCache: {
    [key: string]: PaginationMonitor
  } = {};

  public create<T = any>(
    paginationKey: string,
    entityConfig: EntityCatalogEntityConfig,
    isLocal: boolean
  ) {
    const { endpointType, entityType } = entityConfig;
    // Defensive: callers like `BaseEndpointsDataSource` carry their own
    // schema on the action and no longer register a `stratos`/`endpoint`
    // catalog entry (retired in W36-B/C Wave 5). Fall back to the
    // deterministic `buildEntityKey` for the cache key when the catalog
    // lookup misses, rather than throwing.
    const catalogEntity = this.entityCatalog.getEntity(endpointType, entityType);
    const entityKey = catalogEntity ?
      catalogEntity.entityKey :
      EntityCatalogHelpers.buildEntityKey(entityType, endpointType);
    const cacheKey = paginationKey + entityKey;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey] as PaginationMonitor<T>;
    } else {
      const monitor = new PaginationMonitor<T>(
        this.store,
        paginationKey,
        entityConfig,
        isLocal
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
