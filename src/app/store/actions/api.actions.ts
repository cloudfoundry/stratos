
import { RequestOptions } from '@angular/http';
import { Action, compose, createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { AppState } from './../app-state';
import { EntityRequestState, ActionState } from './../reducers/api-request-reducer';
import { APIResource, APIResourceMetadata, EntityInfo } from '../types/api.types';
import { EntitiesState } from '../types/entity.types';
import { getEntityState, selectEntity, selectEntityRequestInfo } from '../selectors/api.selectors';


export const ApiActionTypes = {
  API_REQUEST: 'API_REQUEST',
  API_REQUEST_START: 'API_REQUEST_START',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

export const getEntityObservable = (
  store: Store<AppState>,
  entityKey: string,
  schema: Schema,
  id: string,
  action: Action
): Observable<EntityInfo> => {
  // This fetching var needs to end up in the state
  return Observable.combineLatest(
    store.select(getEntityState),
    store.select(selectEntity(entityKey, id)),
    store.select(selectEntityRequestInfo(entityKey, id))
  )
    .do(([entities, entity, entityRequestInfo]: [EntitiesState, APIResource, EntityRequestState]) => {
      if (
        !entityRequestInfo ||
        !entity &&
        !entityRequestInfo.fetching &&
        !entityRequestInfo.error &&
        !entityRequestInfo.deleting.busy &&
        !entityRequestInfo.deleting.deleted
      ) {
        store.dispatch(action);
      }
    })
    .filter(([entities, entity, entityRequestInfo]) => {
      return !!entityRequestInfo;
    })
    .map(([entities, entity, entityRequestInfo]) => {
      return {
        entityRequestInfo,
        entity: entity ? {
          entity: denormalize(entity, schema, entities).entity,
          metadata: entity.metadata
        } : null
      };
    });
};




