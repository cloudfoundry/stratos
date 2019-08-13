import { Injectable, Inject, Optional } from '@angular/core';
import { Store } from '@ngrx/store';

import { GeneralEntityAppState } from '../../../store/src/app-state';
import { EntityService, ENTITY_INFO_HANDLER, EntityInfoHandler } from './entity-service';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { EntityActionBuilderEntityConfig } from './entity-catalogue/entity-catalogue.types';
import { EntityInfo } from '../../../store/src/types/api.types';

@Injectable()
export class EntityServiceFactory {

  const infoValidator = (action) => {
    let validated = false;
    return (entityInfo) => {
      if (!entityInfo || entityInfo.entity) {
        if ((!validateRelations || validated || isEntityBlocked(entityInfo.entityRequestInfo))) {
          return;
        }
        validated = true;
        store.dispatch(new ValidateEntitiesStart(
          this.action as ICFAction,
          [entityInfo.entity.metadata.guid],
          false
        ));
      }
    }
  }

  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    @Optional() @Inject(ENTITY_INFO_HANDLER) entityInfoHandler: EntityInfoHandler
  ) { }

  create<T>(
    entityConfig: EntityActionBuilderEntityConfig,
  );
  create<T>(
    entityId: string,
    action: EntityRequestAction
  );
  create<T>(
    // FIXME: Remove entityId and use action.guid (should be accessibly via IRequestAction-->SingleEntityAction) - STRAT-159
    // FIXME: Also we should bump this into the catalogue https://jira.capbristol.com/browse/STRAT-141
    entityIdOrConfig: string | EntityActionBuilderEntityConfig,
    action?: EntityRequestAction
  ) {
    const config = entityIdOrConfig as EntityActionBuilderEntityConfig;
    const entityMonitor = this.entityMonitorFactory.create<T>(
      config.endpointGuid ? config.endpointGuid : entityIdOrConfig as string,
      action
    );
    return new EntityService<T>(this.store, entityMonitor, action, entityInfoHandler);
  }

}
