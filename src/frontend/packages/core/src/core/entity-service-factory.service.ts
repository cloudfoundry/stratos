import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState } from '../../../store/src/app-state';
import { EntityService } from './entity-service';
import { IRequestAction } from '../../../store/src/types/request.types';
import { TRequestTypeKeys, RequestSectionKeys } from '../../../store/src/reducers/api-request-reducer/types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<GeneralEntityAppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }

  create<T>(
    // TODO Can we reliably get the ID from the action? NJ
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
