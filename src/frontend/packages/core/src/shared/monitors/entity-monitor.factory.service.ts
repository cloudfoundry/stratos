import { AppState } from './../../../../store/src/app-state';
import { Injectable } from '@angular/core';
import { EntityMonitor } from './entity-monitor';
import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import { EntityCatalogueEntityConfig } from '../../core/entity-catalogue/entity-catalogue.types';

@Injectable()
export class EntityMonitorFactory {

  constructor(private store: Store<AppState>) { }

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
      const monitor = new EntityMonitor<T>(
        this.store,
        id,
        entityConfig,
        startWithNull
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }

}
