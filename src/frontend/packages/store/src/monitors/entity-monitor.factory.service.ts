import { inject, Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';
import { EntityMonitor } from './entity-monitor';

@Injectable()
export class EntityMonitorFactory {

  private monitorCache: {
    [key: string]: EntityMonitor
  } = {};

  constructor(
    private store: Store<AppState>,
    @Inject(ENTITY_CATALOG_TOKEN) private entityCatalog: IEntityCatalog
  ) {}

  public create<T>(
    id: string,
    entityConfig: EntityCatalogEntityConfig,
    startWithNull = true
  ): EntityMonitor<T> {
    const { endpointType, entityType, schemaKey, subType } = entityConfig;
    const cacheKey = id + endpointType + entityType + schemaKey + subType;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const catalogEntity = this.entityCatalog.getEntity(entityConfig);
      if (!catalogEntity) {
        throw new Error(`Could not find catalog entity for endpoint type '${endpointType}' and entity type '${entityType}'`);
      }
      const monitor = new EntityMonitor<T>(
        this.store,
        id,
        catalogEntity.entityKey,
        catalogEntity.getSchema(entityConfig.schemaKey),
        startWithNull
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }
}
