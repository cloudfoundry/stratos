import { urlValidationExpression } from '../../core/utils.service';
import { EndpointModel, EndpointType } from './../../store/types/endpoint.types';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}

export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';

export interface EndpointTypeHelper {
  value: EndpointType;
  label: string;
  urlValidation?: string;
  allowTokenSharing?: boolean;
  icon?: string;
  iconFont?: string;
}

export interface EndpointIcon {
  name: string;
  font: string;
}

const endpointTypes: EndpointTypeHelper[] = [
  {
    value: 'cf',
    label: 'Cloud Foundry',
    urlValidation: urlValidationExpression,
    icon: 'cloud_foundry',
    iconFont: 'stratos-icons'
  },
  {
    value: 'metrics',
    label: 'Metrics',
    allowTokenSharing: true
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

export function getCanShareTokenForEndpointType(type: string): boolean {
  return endpointTypesMap[type] ? !!endpointTypesMap[type].allowTokenSharing : false;
}

export function getEndpointTypes() {
  return endpointTypes;
}

export function getIconForEndpoint(type: string): EndpointIcon {
  const icon = {
    name: 'endpoint',
    font: ''
  };

  const ep = endpointTypesMap[type];
  if (ep && ep.icon) {
    icon.name = ep.icon;
    icon.font = ep.iconFont;
  }
  return icon;
}
