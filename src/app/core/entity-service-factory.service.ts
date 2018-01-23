import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { Schema } from 'normalizr';
import { EntityService } from './entity-service';
import { IRequestAction } from '../store/types/request.types';
import { TRequestTypeKeys, RequestSectionKeys } from '../store/reducers/api-request-reducer/types';

@Injectable()
export class EntityServiceFactory {

  constructor(private store: Store<AppState>) { }

  create(
    entityKey: string,
    schema: Schema,
    entityId: string,
    action: IRequestAction,
    entitySection: TRequestTypeKeys = RequestSectionKeys.CF
  ) {
    return new EntityService(this.store, entityKey, schema, entityId, action, entitySection);
  }

}
