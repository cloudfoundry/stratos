import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { entityCatalog } from '../entity-catalog/entity-catalog.service';
import { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { EntityMonitor } from './entity-monitor';
import { AppState } from '../app-state';

@Injectable()
export class EntityMonitorFactory {

  constructor(private store: Store<AppState>) { }

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
      const monitor = catalogEntity.getEntityMonitor(
        this.store,
        id,
        {
          startWithNull,
          schemaKey: entityConfig.schemaKey
        }
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
