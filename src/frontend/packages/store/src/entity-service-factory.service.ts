import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { GeneralEntityAppState } from './app-state';
import type { IEntityCatalog } from './entity-catalog/entity-catalog.interface';
import type { EntityActionBuilderEntityConfig } from './entity-catalog/entity-catalog.types';
import { EntityService } from './entity-service';
import type { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';
import type { EntityRequestAction } from './types/request.types';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    @Inject(ENTITY_CATALOG_TOKEN) private entityCatalog: IEntityCatalog
  ) {}

  private isConfig(config: string | EntityActionBuilderEntityConfig) {
    if (config) {
      return !!(config as EntityActionBuilderEntityConfig).entityGuid;
    }
    return false;
  }

  // FIXME: See #3833. Improve typing of action passed to entity service factory create
  create<T>(
    entityConfig: EntityActionBuilderEntityConfig,
  ): EntityService<T>;
  create<T>(
    entityId: string,
    action: EntityRequestAction
  ): EntityService<T>;
  create<T>(
    // FIXME: Remove entityId and use action.guid (should be accessibly via IRequestAction-->SingleEntityAction) - STRAT-159
    // FIXME: Also we should bump this into the catalog https://jira.capbristol.com/browse/STRAT-141
    entityIdOrConfig: string | EntityActionBuilderEntityConfig,
    action?: EntityRequestAction
  ): EntityService<T> {
    const config = entityIdOrConfig as EntityActionBuilderEntityConfig;
    const isConfig = this.isConfig(config);

    const entityMonitor = this.entityMonitorFactory.create<T>(
      isConfig ? config.entityGuid : entityIdOrConfig as string,
      isConfig ? config : action
    );
    if (isConfig) {
      // Get the get action from the entity catalog.
      const catalogEntity = this.entityCatalog.getEntity(config.endpointType, config.entityType) as { actionOrchestrator: { getActionBuilder: (key: string) => (guid: string, endpointGuid: string, metadata: Record<string, unknown>) => unknown } };
      const actionBuilder = catalogEntity.actionOrchestrator.getActionBuilder('get');
      return new EntityService<T>(this.store, entityMonitor, actionBuilder(
        config.entityGuid,
        config.endpointGuid,
        config.actionMetadata || {}
      ) as EntityRequestAction, this.entityCatalog);
    }
    return new EntityService<T>(this.store, entityMonitor, action, this.entityCatalog);
  }

}
