import { register } from 'ts-node/dist';
import { createSelector } from '@ngrx/store';
import { AppState } from '../app-state';
import { EndpointModel, EndpointState, endpointStoreNames } from '../types/endpoint.types';
import { selectEntities, selectRequestInfo, selectEntity } from './api.selectors';

// The custom status section
export const endpointStatusSelector = (state: AppState): EndpointState => state.endpoints;

// All endpoint request data
export const endpointEntitiesSelector = selectEntities<EndpointModel>(endpointStoreNames.type);
// All Registered  endpoint request data
export const endpointsRegisteredEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  endpoints => {
    const registered = {};
    Object.values(endpoints).map(endpoint => {
      if (endpoint.registered) {
        registered[endpoint.guid] = endpoint;
      }
      return registered;
    });
    return registered;
  },
);

// Single endpoint request information
export const endpointsEntityRequestSelector = (guid) => selectRequestInfo(endpointStoreNames.type, guid);
// Single endpoint request data
export const endpointsEntityRequestDataSelector = (guid) => selectEntity<EndpointModel>(endpointStoreNames.type, guid);
