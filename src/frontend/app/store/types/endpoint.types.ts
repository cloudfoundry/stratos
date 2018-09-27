import { endpointSchemaKey } from '../helpers/entity-factory';
import { RequestSectionKeys, TRequestTypeKeys } from '../reducers/api-request-reducer/types';
import { ScopeStrings } from '../../core/current-user-permissions.config';

export interface INewlyConnectedEndpointInfo {
  account: string;
  admin: boolean;
  api_endpoint: IApiEndpointInfo;
  token_expiry: number;
  user: EndpointUser;
}

export const endpointStoreNames: {
  section: TRequestTypeKeys,
  type: string
} = {
    section: RequestSectionKeys.Other,
    type: endpointSchemaKey
  };

export interface IApiEndpointInfo {
  ForceQuery: boolean;
  Fragment: string;
  Host: string;
  Opaque: string;
  Path: string;
  RawPath: string;
  RawQuery: string;
  Scheme: string;
  User: object;
}
export type endpointConnectionStatus = 'connected' | 'disconnected' | 'unknown' | 'checking';
export interface EndpointModel {
  api_endpoint?: IApiEndpointInfo;
  authorization_endpoint?: string;
  cnsi_type?: EndpointType;
  doppler_logging_endpoint?: string;
  guid?: string;
  name: string;
  skip_ssl_validation?: boolean;
  token_endpoint?: string;
  user?: EndpointUser;
  metadata?: {
    metrics: string
  };
  system_shared_token: boolean;
  sso_allowed: boolean;
  // These are generated client side when we login
  registered?: boolean;
  connectionStatus?: endpointConnectionStatus;
  metricsAvailable: boolean;
  //

}

// Metadata for the user connected to an endpoint
export interface EndpointUser {
  guid: string;
  name: string;
  admin: boolean;
  scopes?: ScopeStrings[];
}

export interface EndpointState {
  loading: boolean;
  error: boolean;
  message: string;
}

// If we support more endpoint types in future, this type should be extended
// We defined the build-in endpoints and allow for custom ones via any string
export type EndpointType = 'cf' | 'metrics' | string;

export interface StateUpdateAction {
  type: string;
  guid: string;
  endpointType?: EndpointType;
}
