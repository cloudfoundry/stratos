import { Action } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema } from '../../../core/src/base-entity-schemas';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { endpointStoreNames } from '../types/endpoint.types';
import { BaseEntityValues } from '../types/entity.types';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './api-request-reducers.generator.helpers';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './favorite.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';

function getInternalEntityKey(type: string) {
  return entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, type);
}

const baseDataReducer = requestDataReducerFactory(requestActions);
const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
extraReducers[getInternalEntityKey(endpointStoreNames.type)] = [systemEndpointsReducer];
extraReducers[getInternalEntityKey(userFavoritesEntitySchema.entityType)] = [
  addOrUpdateUserFavoriteMetadataReducer,
  deleteUserFavoriteMetadataReducer
];
const chainedReducers = chainApiReducers(baseDataReducer, extraReducers);

export function requestDataReducer(state: BaseEntityValues, action: Action) {
  return chainedReducers(state, action);
}

