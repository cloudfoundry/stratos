import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { GeneralEntityAppState } from '../../../store/src/app-state';
import { RequestSectionKeys, TRequestTypeKeys } from '../../../store/src/reducers/api-request-reducer/types';
import { IRequestAction } from '../../../store/src/types/request.types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { EntityService } from './entity-service';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }

  create<T>(
    // FIXME: Remove entityId and use action.guid (should be accessibly via IRequestAction-->SingleEntityAction) - STRAT-159
    // FIXME: Also we should bump this into the catalogue https://jira.capbristol.com/browse/STRAT-141
    entityId: string,
    action: IRequestAction,
    validateRelations = true,
    entitySection: TRequestTypeKeys = RequestSectionKeys.CF,
  ) {
    const entityMonitor = this.entityMonitorFactory.create<T>(
      entityId,
      action
    );
    return new EntityService<T>(this.store, entityMonitor, action, validateRelations, entitySection);
  }

}
