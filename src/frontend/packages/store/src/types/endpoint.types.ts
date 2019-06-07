import { ScopeStrings } from '../../../core/src/core/current-user-permissions.config';
import { EndpointType } from '../../../core/src/core/extension/extension-types';
import { MetricsAPITargets } from '../actions/metrics-api.actions';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { RequestSectionKeys, TRequestTypeKeys } from '../reducers/api-request-reducer/types';

export const endpointListKey = 'endpoint-list';
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
export enum EndpointRelationTypes {
  /**
   * Metrics endpoint provides cf metrics to a cloud foundry endpoint
   */
  METRICS_CF = 'metrics-cf',
  /**
   * Metrics endpoint provides kube metrics to a kubernetes endpoint
   */
  METRICS_KUBE = 'metrics-kube',
  /**
   * Metrics endpoint provides eirini (kube) metrics to a cloud foundry endpoint
   */
  METRICS_EIRINI = 'metrics-eirini'
}
export interface EndpointsRelation {
  guid: string;
  metadata: { [key: string]: any };
  type: EndpointRelationTypes;
}
export interface EndpointModel {
  api_endpoint?: IApiEndpointInfo;
  authorization_endpoint?: string;
  cnsi_type?: EndpointType;
  sub_type?: string;
  doppler_logging_endpoint?: string;
  guid?: string;
  name: string;
  skip_ssl_validation?: boolean;
  endpoint_metadata?: any;
  token_endpoint?: string;
  user?: EndpointUser;
  metadata?: {
    cfMetricsTargets?: MetricsAPITargets;
    userInviteAllowed?: 'true' | any;
    fullApiEndpoint?: string;
  };
  relations?: {
    provides: EndpointsRelation[]
    receives: EndpointsRelation[];
  };
  system_shared_token: boolean;
  sso_allowed: boolean;
  // These are generated client side when we login
  registered?: boolean;
  connectionStatus?: endpointConnectionStatus;
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

export interface StateUpdateAction {
  type: string;
  guid: string;
  endpointType?: EndpointType;
}
