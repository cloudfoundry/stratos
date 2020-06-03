import { compose, createSelector } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { InternalAppState, IRequestEntityTypeState } from '../app-state';
import { EntityCatalogHelpers } from '../entity-catalog/entity-catalog.helper';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { EndpointModel, EndpointState } from '../types/endpoint.types';
import { selectEntities, selectEntity, selectRequestInfo } from './api.selectors';

// The custom status section
export const endpointStatusSelector = (state: InternalAppState): EndpointState => state.endpoints;

// All endpoint request data
// Note - Replacing `buildEntityKey` with `entityCatalog.getEntityKey` will cause circular dependency
const endpointEntityKey = EntityCatalogHelpers.buildEntityKey(endpointSchemaKey, STRATOS_ENDPOINT_TYPE);
export const endpointEntitiesSelector = selectEntities<EndpointModel>(endpointEntityKey);

const endpointOfType = (type: string) =>
  (endpoints: IRequestEntityTypeState<EndpointModel>): IRequestEntityTypeState<EndpointModel> => {
    return Object.values(endpoints || {}).reduce((endpointsOfType, endpoint) => {
      if (endpoint.cnsi_type === type) {
        endpointsOfType[endpoint.guid] = endpoint;
      }
      return endpointsOfType;
    }, {} as IRequestEntityTypeState<EndpointModel>);
  };

export const endpointOfTypeSelector = (endpointType: string) => compose(
  endpointOfType(endpointType),
  endpointEntitiesSelector,
);

// TODO: Move this #3769
const cfEndpointEntitiesSelector = endpointOfType('cf');

const getConnectedEndpoints = (endpoints: IRequestEntityTypeState<EndpointModel>) =>
  Object.values(endpoints || {}).reduce((connected, endpoint) => {
    // FIXME: This won't work for helm as endpoint type is `unConnectable`. We have the info to determine endpoint type `unConnectable`(see
    // `isEndpointConnected`) however it would bring in `entityCatalog`.. which creates circular references
    if (endpoint.connectionStatus === 'connected') {
      connected[endpoint.guid] = endpoint;
    }
    return connected;
  }, {} as IRequestEntityTypeState<EndpointModel>);

export const connectedEndpointsSelector = () => compose(
  getConnectedEndpoints,
  endpointEntitiesSelector,
);

export const connectedEndpointsOfTypesSelector = (endpointType: string) => compose(
  getConnectedEndpoints,
  endpointOfType(endpointType),
  endpointEntitiesSelector,
);


// TODO: Move this #3769
export const endpointsCFEntitiesSelector = createSelector(
  endpointEntitiesSelector,
  cfEndpointEntitiesSelector
);

// const log = (label) => {
//   return (val) => console.log(label, val);
// };

// TODO: Move this #3769
export const endpointsCfEntitiesConnectedSelector = connectedEndpointsOfTypesSelector('cf');

// Single endpoint request information
export const endpointsEntityRequestSelector = (guid: string) => selectRequestInfo(endpointEntityKey, guid);
// Single endpoint request data
export const endpointsEntityRequestDataSelector = (guid: string) => selectEntity<EndpointModel>(endpointEntityKey, guid);
