import { Validators } from '@angular/forms';

import { EndpointTypeExtension } from '../../core/extension/extension-manager-service';
import { urlValidationExpression } from '../../core/utils.service';
import { EndpointModel, EndpointType } from './../../store/types/endpoint.types';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';
export interface EndpointTypeHelper {
  value: EndpointType;
  label: string;
  urlValidation?: string;
  allowTokenSharing?: boolean;
}

const endpointTypes: EndpointTypeHelper[] = [
  {
    value: 'cf',
    label: 'Cloud Foundry',
    urlValidation: urlValidationExpression
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
    name: 'Kubernetes Config',
    value: 'kubeconfig',
    form: {
      kubeconfig: ['', Validators.required],
    },
    types: new Array<EndpointType>('k8s')
  },
];

const endpointTypesMap = {};

export function initEndpointTypes(epTypes: EndpointTypeExtension[]) {
  console.log('Init endpoint types');

  epTypes.forEach(type => {
    endpointTypes.push({
      value: type.type,
      label: type.label
    });

    // Map in the authentication providers
    type.authTypes.forEach(authType => {
      const endpointAuthType = endpointAuthTypes.find(a => a.value === authType);
      if (endpointAuthType) {
        endpointAuthType.types.push(type.type);
      }
    });
  });

  // TODO: Sort alphabetically

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

export function getEndpointAuthTypes() {
  return endpointAuthTypes;
}
