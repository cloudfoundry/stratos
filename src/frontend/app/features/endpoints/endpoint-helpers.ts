import { EndpointModel } from './../../store/types/endpoint.types';
export function getFullEndpointApiUrl(endpoint: EndpointModel) {
    return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}
