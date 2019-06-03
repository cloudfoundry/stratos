import { Action } from '@ngrx/store';
import { EntityCatalogueHelpers } from '../../../core/src/core/entity-catalogue/entity-catalogue.helper';
import {
  applicationSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  cfUserSchemaKey,
  organizationSchemaKey,
  routeSchemaKey,
  serviceInstancesSchemaKey,
  spaceSchemaKey,
  userProvidedServiceInstanceSchemaKey
} from '../helpers/entity-factory';
import { endpointStoreNames } from '../types/endpoint.types';
import { BaseRequestDataState, IRequestState } from '../types/entity.types';
import { RequestTypes } from './../actions/request.actions';
import { requestDataReducerFactory } from './api-request-data-reducer/request-data-reducer.factory';
import { requestReducerFactory } from './api-request-reducer/request-reducer.factory';
import { IRequestArray } from './api-request-reducer/types';
import { appStatsReducer } from './app-stats-request.reducer';
import { applicationAddRemoveReducer } from './application-add-remove-reducer';
import { updateApplicationRoutesReducer } from './application-route.reducer';
import { endpointDisconnectApplicationReducer } from './endpoint-disconnect-application.reducer';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './favorite.reducer';
import { updateOrganizationSpaceReducer } from './organization-space.reducer';
import { routeReducer, updateAppSummaryRoutesReducer } from './routes.reducer';
import { serviceInstanceReducer } from './service-instance.reducer';
import { systemEndpointsReducer } from './system-endpoints.reducer';
import { endpointDisconnectUserReducer, userReducer, userSpaceOrgReducer } from './users.reducer';
import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';
import { userFavoritesEntitySchema, STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { entityCatalogue } from '../../../core/src/core/entity-catalogue/entity-catalogue.service';

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
    [appStatsSchemaKey]: [appStatsReducer]
  };
  return chainReducers(baseRequestReducer, extraReducers)(state, action);
}

function getCFEntityKey(type: string) {
  return EntityCatalogueHelpers.buildEntityKey(type, CF_ENDPOINT_TYPE);
}

function getInternalEntityKey(type: string) {
  return entityCatalogue.getEntityKey(STRATOS_ENDPOINT_TYPE, type);
}


// TODO Add these reducers to the catalogue
export function requestDataReducer(state: BaseRequestDataState, action: Action) {
  const baseDataReducer = requestDataReducerFactory(requestActions);

  const extraReducers = {
    [getCFEntityKey(cfUserSchemaKey)]: [userReducer, endpointDisconnectUserReducer],
    [getCFEntityKey(routeSchemaKey)]: [routeReducer],
    [getCFEntityKey(serviceInstancesSchemaKey)]: [serviceInstanceReducer],
    [getCFEntityKey(userProvidedServiceInstanceSchemaKey)]: [serviceInstanceReducer],
    [getInternalEntityKey(endpointStoreNames.type)]: [systemEndpointsReducer],
    [getCFEntityKey(appSummarySchemaKey)]: [updateAppSummaryRoutesReducer],
    [getCFEntityKey(applicationSchemaKey)]: [
      updateApplicationRoutesReducer(),
      endpointDisconnectApplicationReducer()
    ],
    [getCFEntityKey(spaceSchemaKey)]: [
      endpointDisconnectApplicationReducer(),
      applicationAddRemoveReducer(),
      userSpaceOrgReducer(true)
    ],
    [getCFEntityKey(organizationSchemaKey)]: [
      updateOrganizationSpaceReducer(),
      endpointDisconnectApplicationReducer(),
      userSpaceOrgReducer(false)
    ],
    [getInternalEntityKey(userFavoritesEntitySchema.entityType)]: [
      addOrUpdateUserFavoriteMetadataReducer,
      deleteUserFavoriteMetadataReducer
    ]
  };

  return chainReducers(baseDataReducer, extraReducers)(state, action);
}
