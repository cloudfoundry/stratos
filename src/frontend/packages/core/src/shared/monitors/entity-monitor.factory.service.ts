import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { entityCatalogue } from '../../core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/entity-catalogue/entity-catalogue.types';
import { CFAppState } from './../../../../store/src/app-state';
import { EntityMonitor } from './entity-monitor';

@Injectable()
export class EntityMonitorFactory {

  constructor(private store: Store<CFAppState>) { }

  private monitorCache: {
    [key: string]: EntityMonitor
  } = {};

  public create<T>(
    id: string,
    entityConfig: EntityCatalogueEntityConfig,
    startWithNull = true
  ): EntityMonitor<T> {
    const { endpointType, entityType } = entityConfig;
    const cacheKey = id + endpointType + entityType;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey];
    } else {
      const catalogueEntity = entityCatalogue.getEntity(entityConfig);
      const monitor = catalogueEntity.getEntityMonitor(
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