import type { EndpointModel } from './types/endpoint.types';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint?.api_endpoint ?
    `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}${endpoint.api_endpoint.Path}` : 'Unknown';
}
