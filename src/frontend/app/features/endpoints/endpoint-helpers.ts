import { Validators } from '@angular/forms';

import { urlValidationExpression } from '../../core/utils.service';
import { EndpointModel, EndpointType } from './../../store/types/endpoint.types';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}

export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';
export interface EndpointTypeConfig {
  value: EndpointType;
  label: string;
  urlValidation?: string;
  allowTokenSharing?: boolean;
  icon?: string;
  iconFont?: string;
  authTypes?: string[];
}

export interface EndpointIcon {
  name: string;
  font: string;
}

const endpointTypes: EndpointTypeConfig[] = [
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

const endpointAuthTypes = [
  {
    name: 'Username and Password',
    value: 'creds',
    form: {
      username: ['', Validators.required],
      password: ['', Validators.required],
    },
    types: new Array<EndpointType>('cf', 'metrics')
  },
  {
    name: 'Single Sign-On (SSO)',
    value: 'sso',
    form: {},
    types: new Array<EndpointType>('cf')
  },
];

const endpointTypesMap = {};

export function initEndpointTypes(epTypes: EndpointTypeConfig[]) {
  epTypes.forEach(epType => {
    endpointTypes.push(epType);

    if (epType.authTypes) {
      // Map in the authentication providers
      epType.authTypes.forEach(authType => {
        const endpointAuthType = endpointAuthTypes.find(a => a.value === authType);
        if (endpointAuthType) {
          endpointAuthType.types.push(endpointAuthType.value as EndpointType);
        }
      });
    }
  });

  endpointTypes.forEach(ept => {
    endpointTypesMap[ept.value] = ept;
  });
}

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
    name: 'settings_ethernet',
    font: ''
  };

  const ep = endpointTypesMap[type];
  if (ep && ep.icon) {
    icon.name = ep.icon;
    icon.font = ep.iconFont;
  }
  return icon;
}

export function getEndpointAuthTypes() {
  return endpointAuthTypes;
}
