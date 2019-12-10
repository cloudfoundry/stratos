import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { entityCatalogue } from '../../../../store/src/entity-catalog/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../../../store/src/entity-catalog/entity-catalogue.types';
import { PaginationMonitor } from './pagination-monitor';

@Injectable()
export class PaginationMonitorFactory {

  constructor(private store: Store<CFAppState>) { }

  private monitorCache: {
    [key: string]: PaginationMonitor
  } = {};

  public create<T = any>(
    paginationKey: string,
    entityConfig: EntityCatalogueEntityConfig
  ) {
    const { endpointType, entityType } = entityConfig;
    const catalogueEntity = entityCatalogue.getEntity(endpointType, entityType);
    if (!catalogueEntity) {
      throw new Error(`Could not find catalogue entity for endpoint type '${endpointType}' and entity type '${entityType}'`);
    }
    const cacheKey = paginationKey + catalogueEntity.entityKey;
    if (this.monitorCache[cacheKey]) {
      return this.monitorCache[cacheKey] as PaginationMonitor<T>;
    } else {
      const monitor = new PaginationMonitor<T>(
        this.store,
        paginationKey,
        entityConfig
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
