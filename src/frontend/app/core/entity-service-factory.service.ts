import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { schema as normalizrSchema } from 'normalizr';
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

  create<T>(
    entityKey: string,
    schema: normalizrSchema.Entity,
    entityId: string,
    action: IRequestAction,
    validateRelations = true,
    entitySection: TRequestTypeKeys = RequestSectionKeys.CF,
  ) {
    const entityMonitor = this.entityMonitorFactory.create<T>(
      entityId,
      entityKey,
      schema
    );
    return new EntityService<T>(this.store, entityMonitor, action, validateRelations, entitySection);
  }

}
