import { compose, createSelector } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { EntityCatalogHelpers } from '../entity-catalog/entity-catalog.helper';
import { InternalAppState, IRequestEntityTypeState } from '../app-state';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { EndpointModel, EndpointState } from '../types/endpoint.types';
import { selectEntities, selectEntity, selectRequestInfo } from './api.selectors';

// The custom status section
export const endpointStatusSelector = (state: InternalAppState): EndpointState => state.endpoints;

// All endpoint request data
// Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
const endpointEntityKey = EntityCatalogHelpers.buildEntityKey(endpointSchemaKey, STRATOS_ENDPOINT_TYPE);
export const endpointEntitiesSelector = selectEntities<EndpointModel>(endpointEntityKey);

export const endpointOfTypeSelector = (type: string) =>
  (endpoints: IRequestEntityTypeState<EndpointModel>): IRequestEntityTypeState<EndpointModel> => {
    return Object.values(endpoints).reduce((endpointsOfType, endpoint) => {
      if (endpoint.cnsi_type === type) {
        endpointsOfType[endpoint.guid] = endpoint;
      }
      return endpointsOfType;
    }, {});
  };

// TODO: Move this #3769
export const cfEndpointEntitiesSelector = endpointOfTypeSelector('cf');

export const getRegisteredEndpoints = (endpoints: IRequestEntityTypeState<EndpointModel>) =>
  Object.values(endpoints).reduce((registered, endpoint) => {
    if (endpoint.registered) {
      registered[endpoint.guid] = endpoint;
    }
    return registered;
  }, {} as IRequestEntityTypeState<EndpointModel>);

export const getConnectedEndpoints = (endpoints: IRequestEntityTypeState<EndpointModel>) =>
  Object.values(endpoints).reduce((connected, endpoint) => {
    if (endpoint.connectionStatus === 'connected') {
      connected[endpoint.guid] = endpoint;
    }
    return connected;
  }, {} as IRequestEntityTypeState<EndpointModel>);

// All Registered  endpoint request data
export const endpointsRegisteredEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  getRegisteredEndpoints
);

export const connectedEndpointsOfTypesSelector = (endpointType: string) => compose(
  getConnectedEndpoints,
  endpointOfTypeSelector(endpointType),
  getRegisteredEndpoints,
  endpointEntitiesSelector,
);

export const registeredEndpointsOfTypesSelector = (endpointType: string) => createSelector(
  endpointEntitiesSelector,
  endpointOfTypeSelector(endpointType),
  getRegisteredEndpoints
);

// TODO: Move this #3769
export const endpointsCFEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  cfEndpointEntitiesSelector
);

// TODO: Move this #3769
export const endpointsRegisteredCFEntitiesSelector = createSelector(
  endpointsCFEntitiesSelector,
  getRegisteredEndpoints
);

// Single endpoint request information
export const endpointsEntityRequestSelector = (guid: string) => selectRequestInfo(endpointEntityKey, guid);
// Single endpoint request data
export const endpointsEntityRequestDataSelector = (guid: string) => selectEntity<EndpointModel>(endpointEntityKey, guid);
