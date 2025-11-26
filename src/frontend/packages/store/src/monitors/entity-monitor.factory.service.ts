import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { AppState } from '../app-state';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';
import type { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import type { EntitySchema } from '../helpers/entity-schema';
import { ENTITY_CATALOG_TOKEN } from '../tokens/store-injection.tokens';
import { EntityMonitor } from './entity-monitor';

@Injectable()
export class EntityMonitorFactory {

  private monitorCache: {
    [key: string]: EntityMonitor<unknown>
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
      return this.monitorCache[cacheKey] as EntityMonitor<T>;
    } else {
      const catalogEntity = this.entityCatalog.getEntity(entityConfig);
      if (!catalogEntity) {
        throw new Error(`Could not find catalog entity for endpoint type '${endpointType}' and entity type '${entityType}'`);
      }
      const monitor = new EntityMonitor<T>(
        this.store,
        id,
        (catalogEntity as { entityKey: string }).entityKey,
        (catalogEntity as { getSchema: (key?: string) => EntitySchema }).getSchema(entityConfig.schemaKey),
        startWithNull
      );
      this.monitorCache[cacheKey] = monitor;
      return monitor;
    }
  }
}
