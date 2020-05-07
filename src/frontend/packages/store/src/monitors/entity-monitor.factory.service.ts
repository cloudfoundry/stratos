import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { EntityMonitor } from './entity-monitor';

@Injectable()
export class EntityMonitorFactory {

  constructor(
    private store: Store<AppState>,
  ) { }

  private monitorCache: {
    [key: string]: EntityMonitor
  } = {};

  public create<T>(
    id: string,
    entityConfig: EntityCatalogEntityConfig,
    startWithNull = true
  ): EntityMonitor<T> {
    const { endpointType, entityType } = entityConfig;
    const cacheKey = id + endpointType + entityType;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const catalogEntity = entityCatalog.getEntity(entityConfig);
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
