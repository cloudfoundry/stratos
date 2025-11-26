import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { AppState } from '../app-state';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';
import type { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';
import { PaginationMonitor } from './pagination-monitor';

@Injectable()
export class PaginationMonitorFactory {

  private monitorCache: {
    [key: string]: PaginationMonitor
  } = {};

  constructor(
    private store: Store<AppState>,
    @Inject(ENTITY_CATALOG_TOKEN) private entityCatalog: IEntityCatalog
  ) {}

  public create<T = unknown>(
    paginationKey: string,
    entityConfig: EntityCatalogEntityConfig,
    isLocal: boolean
  ) {
    const { endpointType, entityType } = entityConfig;
    const catalogEntity = this.entityCatalog.getEntity(endpointType, entityType);
    if (!catalogEntity) {
      throw new Error(`Could not find catalog entity for endpoint type '${endpointType}' and entity type '${entityType}'`);
    }
    const cacheKey = paginationKey + (catalogEntity as { entityKey: string }).entityKey;
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
