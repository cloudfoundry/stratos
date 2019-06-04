import { createSelector } from '@ngrx/store';
import { IRequestEntityTypeState, InternalAppState } from '../app-state';
import { EndpointModel, EndpointState, } from '../types/endpoint.types';
import { selectEntities, selectRequestInfo, selectEntity } from './api.selectors';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { EntityCatalogueHelpers } from '../../../core/src/core/entity-catalogue/entity-catalogue.helper';

// The custom status section
export const endpointStatusSelector = (state: InternalAppState): EndpointState => state.endpoints;

// All endpoint request data
const endpointEntityKey = EntityCatalogueHelpers.buildEntityKey(endpointSchemaKey, STRATOS_ENDPOINT_TYPE);
export const endpointEntitiesSelector = selectEntities<EndpointModel>(endpointEntityKey);

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
export const endpointsEntityRequestSelector = (guid: string) => selectRequestInfo(endpointEntityKey, guid);
// Single endpoint request data
export const endpointsEntityRequestDataSelector = (guid: string) => selectEntity<EndpointModel>(endpointEntityKey, guid);
