import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { entityCatalogue } from '../../core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/entity-catalogue/entity-catalogue.types';
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
    const catalogueEntity = entityCatalogue.getEntity(entityConfig.endpointType, entityConfig.entityType);
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
