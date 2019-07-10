import { Action } from '@ngrx/store';
import { appStatsEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema } from '../../../core/src/base-entity-schemas';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { endpointStoreNames } from '../types/endpoint.types';
import { BaseRequestDataState, IRequestState } from '../types/entity.types';
import { RequestTypes } from './../actions/request.actions';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { IRequestArray } from './api-request-reducer/types';
import { appStatsReducer } from './app-stats-request.reducer';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './favorite.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';


/**
 * This module uses the request data reducer and request reducer factories to create
 * the reducers to be used when making http requests
 */

const requestActions = [
  RequestTypes.START,
  RequestTypes.SUCCESS,
  RequestTypes.FAILED,
  RequestTypes.UPDATE
] as IRequestArray;

function chainReducers(baseReducer, extraReducers) {
  return (state, action) => {
    let newState = baseReducer(state, action);
    let nextState;
    Object.keys(extraReducers).forEach(key => {
      nextState = extraReducers[key].reduce((s, reducer) => {
        return reducer(s, action);
      }, newState[key]);
      if (nextState !== newState[key]) {
        newState = {
          ...newState,
          ...{
            [key]: nextState
          }
        };
      }
    });
    return newState;
  };
}

export function requestReducer(state: IRequestState, action: Action) {
  const baseRequestReducer = requestReducerFactory(requestActions);
  const extraReducers = {
    [appStatsEntityType]: [appStatsReducer]
  };
  return chainReducers(baseRequestReducer, extraReducers)(state, action);
}

function getInternalEntityKey(type: string) {
  return entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, type);
}

// TODO Add these reducers to the catalogue
export function requestDataReducer(state: BaseRequestDataState, action: Action) {
  const baseDataReducer = requestDataReducerFactory(requestActions);

  const extraReducers = entityCatalogue.getAllEntityReducers();
  extraReducers.set(getInternalEntityKey(endpointStoreNames.type), [systemEndpointsReducer]);
  extraReducers.set(getInternalEntityKey(userFavoritesEntitySchema.entityType), [
    addOrUpdateUserFavoriteMetadataReducer,
    deleteUserFavoriteMetadataReducer
  ]);
  return chainReducers(baseDataReducer, extraReducers)(state, action);
}
