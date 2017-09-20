import { Observable } from 'rxjs/Rx';
import { skipWhile } from 'rxjs/operator/skipWhile';
import { EntitiesState } from '../reducers/api.reducer';
import { AppState } from './../app-state';
import { denormalize, Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action, createFeatureSelector, createSelector, Store, compose, State } from '@ngrx/store';


export const ApiActionTypes = {
  API_REQUEST: 'API_REQUEST',
  API_REQUEST_START: 'API_REQUEST_START',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

export interface APIResource {
  metadata: APIResourceMetadata;
  entity: any;
}

export interface APIResourceMetadata {
  created_at: string;
  guid: string;
  update_at: string;
  url: string;
}

export class APIAction implements Action {
  actions: string[];
  type = ApiActionTypes.API_REQUEST;
  options: RequestOptions;
  entity: Schema;
  entityKey: string;
  paginationKey?: string;
  cnis?: string;
}

export class StartAPIAction implements Action {
  constructor(
    public apiAction: APIAction
  ) {
  }
  type = ApiActionTypes.API_REQUEST_START;
}

export class WrapperAPIActionSuccess implements Action {
  constructor(
    public type: string,
    public response: {},
    public entityKey: string,
    public paginationKey?: string
  ) { }
  apiType = ApiActionTypes.API_REQUEST_SUCCESS;
}

export class WrapperAPIActionFailed implements Action {
  constructor(
    public type: string,
    public message: string,
    public entityKey: string,
    public paginationKey?: string
  ) { }
  apiType = ApiActionTypes.API_REQUEST_FAILED;
}

export const selectEntities = createFeatureSelector<EntitiesState>('entities');

export const createEntitySelector = (entity: string) => {
  return createSelector(selectEntities, (state: EntitiesState) => state[entity]);
};

export const getEntityObservable = (
  store: Store<AppState>,
  entityKey: string,
  schema: Schema,
  id: string,
  action: Action
): Observable<any> => {
  // This fetching var needs to end up in the state
  let fetching = false;
  return Observable.combineLatest(
    store.select(getEntityState),
    store.select(selectEntity(entityKey, id))
  )
  .mergeMap(([entities, entity]) => {
    if (entity) {
      fetching = false;
    }
    if (!entity && !fetching) {
        fetching = true;
        store.dispatch(action);
    }
    return Observable.of({
      entity,
      entities
    });
  }).skipWhile(() => {
    return fetching;
  }).mergeMap(data => {
    return Observable.of(denormalize(data.entity, schema, data.entities));
  });
};

export function selectEntity(type: string, guid: string) {
  return compose(
    getAPIResourceEntity,
    getEntityById(guid),
    getEntityType(type),
    getEntityState
  );
}

export function getEntityState(state: AppState) {
  return state.entities || {};
}

export function getEntityType(type: string) {
  return (entityState) => {
    return entityState[type] || {};
  };
}

export const getEntityById = (guid: string) => (entities) => entities[guid];
const getValueOrNull = (object, key) => object ? object[key] ? object[key] : null : null;
export const getAPIResourceMetadata = (resource: APIResource): APIResourceMetadata => getValueOrNull(resource, 'metadata');
export const getAPIResourceEntity = (resource: APIResource): any => getValueOrNull(resource, 'entity');
export const getMetadataGuid = (metadata: APIResourceMetadata): string =>  getValueOrNull(metadata, 'guid');
export const getAPIResourceGuid = compose(
    getMetadataGuid,
    getAPIResourceMetadata
);


