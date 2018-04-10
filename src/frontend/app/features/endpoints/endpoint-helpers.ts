import { EndpointModel } from './../../store/types/endpoint.types';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
    return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}

const endpointTypes = [
  {
    value: 'cf',
    label: 'Cloud Foundry'
  },
  {
    value: 'metrics',
    label: 'Metrics'
  },
];

const endpointTypesMap = {};

endpointTypes.forEach(ept => {
  endpointTypesMap[ept.value] = ept;
});

// Get the name to display for a given Endpoint type
export function getNameForEndpointType(type: string): string {
  return endpointTypesMap[type] ? endpointTypesMap[type].label : 'Unknown';
}

export function getEndpointTypes() {
  return endpointTypes;
}
