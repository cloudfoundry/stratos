import { connectedEndpointsOfTypesSelector } from '../../../../store/src/selectors/endpoint.selectors';
import { CF_ENDPOINT_TYPE } from '../../cf-types';

export const endpointsCfEntitiesConnectedSelector = connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE);
