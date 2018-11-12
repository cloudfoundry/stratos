import { Validators } from '@angular/forms';

import { urlValidationExpression } from '../../core/utils.service';
import { EndpointModel, EndpointType } from './../../store/types/endpoint.types';
import { SSOAuthFormComponent } from './connect-endpoint-dialog/auth-forms/sso-auth-form.component';
import { CredentialsAuthFormComponent } from './connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { IAuthForm } from '../../core/extension/extension-types';
import { Type } from '@angular/core';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ? `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}` : 'Unknown';
}

export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

/**
 * Optional interface that an Endpoint Auth Form Component can implement
 * if it needs to supply content in the request body when connecting an endppoint
 * e.g. if it needs to send a config file
 **/
export interface IEndpointAuthComponent extends IAuthForm {
  getBody(): string;  // Get the body contents to send
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

export interface EndpointAuthType {
  name: string;
  value: string;
  formType?: string;
  types: Array<EndpointType>;
  form?: any;
  data?: any;
  component: Type<IAuthForm>;
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

let endpointAuthTypes: EndpointAuthType[] = [
  {
    name: 'Username and Password',
    value: 'creds',
    form: {
      username: ['', Validators.required],
      password: ['', Validators.required],
    },
    types: new Array<EndpointType>('cf', 'metrics'),
    component: CredentialsAuthFormComponent
  },
  {
    name: 'Single Sign-On (SSO)',
    value: 'sso',
    form: {},
    types: new Array<EndpointType>('cf'),
    component: SSOAuthFormComponent
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

export function addEndpointAuthTypes(extensions: EndpointAuthType[]) {
  endpointAuthTypes.forEach(t => t.formType = t.value);
  endpointAuthTypes = endpointAuthTypes.concat(extensions);
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
