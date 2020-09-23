import { MetricsAPITargets, MetricsStratosInfo } from '../actions/metrics-api.actions';
import { EndpointType } from '../extension-types';

export const endpointListKey = 'endpoint-list';
export interface INewlyConnectedEndpointInfo {
  account: string;
  admin: boolean;
  api_endpoint: IApiEndpointInfo;
  token_expiry: number;
  user: EndpointUser;
}

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

export type EndpointRelationType = string | EndpointMetricRelationTypes;
export enum EndpointMetricRelationTypes {
  /**
   * Metrics endpoint provides kube metrics to a kubernetes endpoint
   */
  METRICS_KUBE = 'metrics-kube', // This will be moved into the kube package when it comes upstream
}
export const EndpointRelationshipTypeMetadataJob = 'job';
export interface EndpointRelationshipTypeMetadata {
  icon: string,
  value: (relMetadata: any) => string;
  label: string,
  type?: string,
}

/**
 * Definition of an endpoint relationship type. This can be used to render information about the metadata a relationship type has
 */
export interface EndpointRelationshipType {
  metadata: EndpointRelationshipTypeMetadata[];
}

/**
 * Information about each relationship type. This can be used to render information about the metadata a relationship type has
 */
export const EndpointRelationshipTypes: {
  [key: string]: EndpointRelationshipType,
} = {
  [EndpointMetricRelationTypes.METRICS_KUBE]: { // This will be moved into the kube package when it comes upstream
    metadata: [
      {
        icon: 'history',
        value: (relMetadata: any) => relMetadata.metrics_job,
        label: 'Prometheus Job',
      },
      {
        icon: 'history',
        value: (relMetadata: any) => relMetadata.metrics_environment,
        label: 'Prometheus Environment',
      },
    ]
  }
};

export interface EndpointsRelation {
  guid: string;
  metadata: { [key: string]: any; };
  type: EndpointRelationType;
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
  client_id?: string;
  user?: EndpointUser;
  metadata?: {
    /**
     * A collection of targets that are actively collecting metrics if this is a metrics endpoint.
     * Collected via MetricsAPIAction and MetricAPIQueryTypes.TARGETS
     */
    metrics_targets?: MetricsAPITargets;
    /**
     * A collection of stratos metric jobs if this is a metrics endpoint. Collected via MetricsStratosAction
     */
    metrics_stratos?: MetricsStratosInfo;
    userInviteAllowed?: 'true' | any;
    fullApiEndpoint?: string;
  };
  relations?: {
    provides: EndpointsRelation[];
    receives: EndpointsRelation[];
  };
  system_shared_token: boolean;
  sso_allowed: boolean;
  // These are generated client side when we login
  connectionStatus?: endpointConnectionStatus;
}

export const SystemSharedUserGuid = '00000000-1111-2222-3333-444444444444';

export type UserScopeStrings = string;

// Metadata for the user connected to an endpoint
export interface EndpointUser {
  guid: string;
  name: string;
  admin: boolean;
  scopes?: UserScopeStrings[];
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
