import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { schema } from 'normalizr';
import { EntityService } from './entity-service';
import { IRequestAction } from '../store/types/request.types';
import { TRequestTypeKeys, RequestSectionKeys } from '../store/reducers/api-request-reducer/types';
import { EntityMonitorFactory } from '../shared/monitors/entity-monitor.factory.service';

@Injectable()
export class EntityServiceFactory {

  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }

  create(
    entityKey: string,
    schema: schema.Entity,
    entityId: string,
    action: IRequestAction,
    entitySection: TRequestTypeKeys = RequestSectionKeys.CF
  ) {
    const entityMonitor = this.entityMonitorFactory.create(
      entityId,
      entityKey,
      schema
    );
    return new EntityService(this.store, entityMonitor, action, entitySection);
  }

}
