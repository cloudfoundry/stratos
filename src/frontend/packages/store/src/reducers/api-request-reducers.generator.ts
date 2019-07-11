import { Action, ActionReducer } from '@ngrx/store';
import { appStatsEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema } from '../../../core/src/base-entity-schemas';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { endpointStoreNames } from '../types/endpoint.types';
import { BaseRequestDataState, IRequestState } from '../types/entity.types';
import { RequestTypes } from './../actions/request.actions';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { IRequestArray, RequestInfoState } from './api-request-reducer/types';
import { appStatsReducer } from './app-stats-request.reducer';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './favorite.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { chainApiReducers, ExtraApiReducers } from './api-request-reducers.generator.helpers';
import { IRequestEntityTypeState } from '../app-state';

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


export function requestReducer(state: IRequestState, action: Action) {
  const baseRequestReducer = requestReducerFactory(requestActions);
  const extraReducers = {
    [appStatsEntityType]: [appStatsReducer]
  } as ExtraApiReducers<IRequestEntityTypeState<RequestInfoState>>;
  return chainApiReducers<IRequestEntityTypeState<RequestInfoState>>(baseRequestReducer, extraReducers)(state, action);
}

function getInternalEntityKey(type: string) {
  return entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, type);
}

// TODO Add these reducers to the catalogue
export function requestDataReducer() {
  const baseDataReducer = requestDataReducerFactory(requestActions);
  const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
  extraReducers[getInternalEntityKey(endpointStoreNames.type)] = [systemEndpointsReducer];
  extraReducers[getInternalEntityKey(userFavoritesEntitySchema.entityType)] = [
    addOrUpdateUserFavoriteMetadataReducer,
    deleteUserFavoriteMetadataReducer
  ];
  const chained = chainApiReducers(baseDataReducer, extraReducers);
  return (state: BaseRequestDataState, action: Action) => chained(state, action);
}
