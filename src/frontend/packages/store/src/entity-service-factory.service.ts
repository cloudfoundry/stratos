import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { GeneralEntityAppState } from './app-state';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { EntityActionBuilderEntityConfig } from './entity-catalog/entity-catalog.types';
import { EntityService } from './entity-service';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { EntityRequestAction } from './types/request.types';

@Injectable()
export class EntityServiceFactory {
  private isConfig(config: string | EntityActionBuilderEntityConfig) {
    if (config) {
      return !!(config as EntityActionBuilderEntityConfig).entityGuid;
    }
    return false;
  }
  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory,
  ) { }

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
      const actionBuilder = entityCatalog.getEntity(config.endpointType, config.entityType).actionOrchestrator.getActionBuilder('get');
      return new EntityService<T>(this.store, entityMonitor, actionBuilder(
        config.entityGuid,
        config.endpointGuid,
        config.actionMetadata || {}
      ));
    }
    return new EntityService<T>(this.store, entityMonitor, action);
  }

}
