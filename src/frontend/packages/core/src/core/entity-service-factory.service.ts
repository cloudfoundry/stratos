import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CFAppState } from '../../../store/src/app-state';
import { schema as normalizrSchema } from 'normalizr';
import { EntityService } from './entity-service';
import { IRequestAction } from '../../../store/src/types/request.types';
import { TRequestTypeKeys, RequestSectionKeys } from '../../../store/src/reducers/api-request-reducer/types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';
import { EntityCatalogueEntityConfig } from './entity-catalogue/entity-catalogue.types';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<CFAppState>,
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
