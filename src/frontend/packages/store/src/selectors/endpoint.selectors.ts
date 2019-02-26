import { createSelector } from '@ngrx/store';

import { AppState, IRequestEntityTypeState } from '../app-state';
import { EndpointModel, EndpointState, endpointStoreNames } from '../types/endpoint.types';
import { selectEntities, selectEntity, selectRequestInfo } from './api.selectors';

// The custom status section
export const endpointStatusSelector = (state: AppState): EndpointState => state.endpoints;

// All endpoint request data
export const endpointEntitiesSelector = selectEntities<EndpointModel>(endpointStoreNames.type);

export const cfEndpointEntitiesSelector = (endpoints: IRequestEntityTypeState<EndpointModel>): IRequestEntityTypeState<EndpointModel> => {
  const cf = {};
  Object.values(endpoints).map(endpoint => {
    if (endpoint.cnsi_type === 'cf') {
      cf[endpoint.guid] = endpoint;
    }
  });
  return cf;
};

export const getRegisteredEndpoints = (endpoints: IRequestEntityTypeState<EndpointModel>) => {
  const registered = {} as IRequestEntityTypeState<EndpointModel>;
  Object.values(endpoints).map(endpoint => {
    if (endpoint.registered) {
      registered[endpoint.guid] = endpoint;
    }
    return registered;
  });
  return registered;
};
// All Registered  endpoint request data
export const endpointsRegisteredEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  getRegisteredEndpoints
);

export const endpointsCFEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  cfEndpointEntitiesSelector
);

export const endpointsRegisteredCFEntitiesSelector = createSelector(
  endpointsCFEntitiesSelector,
  getRegisteredEndpoints
);

// Single endpoint request information
export const endpointsEntityRequestSelector = (guid) => selectRequestInfo(endpointStoreNames.type, guid);
// Single endpoint request data
export const endpointsEntityRequestDataSelector = (guid) => selectEntity<EndpointModel>(endpointStoreNames.type, guid);
