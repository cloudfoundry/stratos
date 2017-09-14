import { Observable } from 'rxjs/Rx';
import { skipWhile } from 'rxjs/operator/skipWhile';
import { EntitiesState } from '../reducers/api.reducer';
import { AppState } from './../app-state';
import { denormalize, Schema } from 'normalizr';
import { RequestOptions } from '@angular/http';
import { Action, createFeatureSelector, createSelector, Store } from '@ngrx/store';

export const ApiActionTypes = {
  API_REQUEST: 'API_REQUEST',
  API_REQUEST_START: 'API_REQUEST_START',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

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

export const getEntity = (
  store: Store<AppState>,
  entityKey: string,
  schema: Schema,
  id: string,
  action: Action
) => {
  let fetching = false;
  return store.select('entities')
  .mergeMap((entities: EntitiesState) => {
    const entityList = entities[entityKey];
    const entity = entityList[id];
    if (!entity) {
      if (!fetching) {
        fetching = true;
        store.dispatch(action);
      }
    } else {
      fetching = false;
    }
    const data = {
      entity,
      entityList
    };
    return Observable.of(data);
  }).skipWhile(() => {
    return fetching;
  }).flatMap(data => {
    return Observable.of(denormalize(data.entity, schema, data.entityList));
  });
};

