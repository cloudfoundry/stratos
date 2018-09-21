import { urlValidationExpression } from '../../core/utils.service';
import { EndpointModel, EndpointType } from './../../store/types/endpoint.types';
import { Validators } from '@angular/forms';

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
}

export interface EndpointAuthType {
  name: string;
  value: string;
  formType?: string;
  types: Array<EndpointType>;
  form?: any;
  data?: any;
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

let authTypes: EndpointAuthType[] = [
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
    name: 'Single sign-on',
    value: 'sso',
    form: {},
    types: new Array<EndpointType>('cf')
  },
  // Config file support for custom endpoint types
  {
    name: 'Configuration file',
    value: 'config',
    form: {
      config: ['', Validators.required],
    },
    types: new Array<EndpointType>()
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

export function getEndpointAuthTypes() {
  return authTypes;
}

export function addEndpointAuthTypes(extensions: EndpointAuthType[]) {
  authTypes.forEach(t => t.formType = t.value);
  authTypes = authTypes.concat(extensions);
}
