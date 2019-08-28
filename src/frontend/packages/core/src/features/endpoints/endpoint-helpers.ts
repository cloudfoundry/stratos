import { Type } from '@angular/core';
import { Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { selectEntities } from '../../../../store/src/selectors/api.selectors';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { ExtensionService } from '../../core/extension/extension-service';
import {
  EndpointAuthTypeConfig,
  EndpointType,
  EndpointTypeConfig,
  EndpointTypeExtensionConfig,
} from '../../core/extension/extension-types';
import { EndpointListDetailsComponent } from '../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { CredentialsAuthFormComponent } from './connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { NoneAuthFormComponent } from './connect-endpoint-dialog/auth-forms/none-auth-form.component';
import { SSOAuthFormComponent } from './connect-endpoint-dialog/auth-forms/sso-auth-form.component';

export function getFullEndpointApiUrl(endpoint: EndpointModel) {
  return endpoint && endpoint.api_endpoint ?
    `${endpoint.api_endpoint.Scheme}://${endpoint.api_endpoint.Host}${endpoint.api_endpoint.Path}` : 'Unknown';
}

export function getEndpointUsername(endpoint: EndpointModel) {
  return endpoint && endpoint.user ? endpoint.user.name : '-';
}

export const DEFAULT_ENDPOINT_TYPE = 'cf';

export interface EndpointIcon {
  name: string;
  font: string;
}

export enum EndpointAuthTypeNames {
  CREDS = 'creds',
  SSO = 'sso',
  NONE = 'none'
}

const metricType: EndpointTypeExtensionConfig = {
  type: 'metrics',
  label: 'Metrics',
  allowTokenSharing: true,
  imagePath: '/core/assets/endpoint-icons/metrics.svg',
  homeLink: (guid) => ['/endpoints/metrics', guid],
  authTypes: [EndpointAuthTypeNames.CREDS, EndpointAuthTypeNames.NONE]
};

const endpointTypes: EndpointTypeConfig[] = [{
  ...metricType,
}];

export const endpointAuthTypeCreds: EndpointAuthTypeConfig = {
  name: 'Username and Password',
  value: EndpointAuthTypeNames.CREDS,
  form: {
    username: ['', Validators.required],
    password: ['', Validators.required],
  },
  types: new Array<EndpointType>(),
  component: CredentialsAuthFormComponent
};

export const endpointAuthTypeSso: EndpointAuthTypeConfig = {
  name: 'Single Sign-On (SSO)',
  value: EndpointAuthTypeNames.SSO,
  form: {},
  types: new Array<EndpointType>(),
  component: SSOAuthFormComponent
};

export const endpointAuthTypeNone: EndpointAuthTypeConfig = {
  name: 'No Authentication',
  value: EndpointAuthTypeNames.NONE,
  form: {},
  types: new Array<EndpointType>(),
  component: NoneAuthFormComponent
};

let endpointAuthTypes: EndpointAuthTypeConfig[] = [
  endpointAuthTypeCreds,
  endpointAuthTypeSso,
  endpointAuthTypeNone,
];

const endpointTypesMap = {};

// Any initial endpointTypes listDetailsComponent should be added here
export const coreEndpointListDetailsComponents: Type<EndpointListDetailsComponent>[] = [];

const createEndpointKey = (type: EndpointType, subType: string) => type + '-' + (subType || '');

export function initEndpointTypes(epTypes: EndpointTypeExtensionConfig[]) {
  epTypes.forEach(epType => {
    // Add endpoint type
    endpointTypes.push(epType);
    // Also add any sub endpoint types
    if (epType.subTypes && !!epType.subTypes.length) {
      // Sub types inherit all properties from parent type
      const { subTypes, ...baseEpType } = epType;
      epType.subTypes.forEach(subType => {
        endpointTypes.push({
          ...baseEpType,
          ...subType
        });
      });
    }

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
    endpointTypesMap[createEndpointKey(ept.type, ept.subType)] = ept;
    ept.techPreview = ept.techPreview || false;
  });

  // Sort endpoints given their order. 0 -> top, undefined/null -> bottom
  endpointTypes.sort((a, b) => {
    const aOrder = typeof (a.order) === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof (b.order) === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    return aOrder === bOrder ? 0 : aOrder < bOrder ? -1 : 1;
  });

}

export function addEndpointAuthTypes(extensions: EndpointAuthTypeConfig[]) {
  endpointAuthTypes.forEach(t => t.formType = t.value);
  endpointAuthTypes = endpointAuthTypes.concat(extensions);
}

// Get the name to display for a given Endpoint type
export function getNameForEndpointType(type: string, subType: string): string {
  const epT = getEndpointType(type, subType);
  return epT ? epT.label : 'Unknown';
}

export function getCanShareTokenForEndpointType(type: string, subType: string): boolean {
  const epT = getEndpointType(type, subType);
  return epT ? !!epT.allowTokenSharing : false;
}

export function getEndpointTypes(techPreviewEnabled = false) {
  // Filter out endpoints in tech preview if needed
  return endpointTypes.filter(item => !item.techPreview || item.techPreview && techPreviewEnabled);
}

export function getEndpointType(type: string, subType: string): EndpointTypeConfig {
  return getEndpointTypeByKey(createEndpointKey(type, subType)) || getDefaultEndpointTypeConfig(type, subType);
}

function getEndpointTypeByKey(key: string): EndpointTypeConfig {
  return endpointTypesMap[key];
}

function getDefaultEndpointTypeConfig(type: string, subType?: string): EndpointTypeConfig {
  return {
    label: 'Unknown',
    type,
    subType,
    doesNotSupportConnect: true
  };
}

export function getIconForEndpoint(type: string, subType: string): EndpointIcon {
  const icon = {
    name: 'settings_ethernet',
    font: ''
  };

  const ep = getEndpointType(type, subType);
  if (ep && ep.icon) {
    icon.name = ep.icon;
    icon.font = ep.iconFont;
  }
  return icon;
}

export function endpointHasMetrics(endpointGuid: string, store: Store<AppState>): Observable<boolean> {
  return store.select(selectEntities<EndpointModel>(endpointSchemaKey)).pipe(
    first(),
    map(state => !!state[endpointGuid].metadata && !!state[endpointGuid].metadata.metrics)
  );
}

export function getEndpointAuthTypes() {
  return endpointAuthTypes;
}

export function initEndpointExtensions(extService: ExtensionService) {
  // Register auth types before applying endpoint types
  const endpointExtConfig = extService.getEndpointExtensionConfig();
  addEndpointAuthTypes(endpointExtConfig.authTypes || []);
  initEndpointTypes(endpointExtConfig.endpointTypes || []);
}
