import { Inject, Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { EntityActionBuilderEntityConfig } from './entity-catalogue/entity-catalogue.types';
import { EntityInfoHandler, EntityService, ENTITY_INFO_HANDLER } from './entity-service';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    @Optional() @Inject(ENTITY_INFO_HANDLER) private entityInfoHandler: EntityInfoHandler
  ) { }

  create<T>(
    entityConfig: EntityActionBuilderEntityConfig,
  ): EntityService<T>;
  create<T>(
    entityId: string,
    action: EntityRequestAction
  ): EntityService<T>;
  create<T>(
    // FIXME: Remove entityId and use action.guid (should be accessibly via IRequestAction-->SingleEntityAction) - STRAT-159
    // FIXME: Also we should bump this into the catalogue https://jira.capbristol.com/browse/STRAT-141
    entityIdOrConfig: string | EntityActionBuilderEntityConfig,
    action?: EntityRequestAction
  ): EntityService<T> {
    const config = entityIdOrConfig as EntityActionBuilderEntityConfig;
    const entityMonitor = this.entityMonitorFactory.create<T>(
      config.endpointGuid ? config.endpointGuid : entityIdOrConfig as string,
      action
    );
    return new EntityService<T>(this.store, entityMonitor, action, this.entityInfoHandler);
  }

}
