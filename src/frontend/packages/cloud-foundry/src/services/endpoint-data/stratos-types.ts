// src/frontend/packages/cloud-foundry/src/services/endpoint-data/stratos-types.ts

export interface StOrg {
  guid: string;
  name: string;
  status: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  cnsiGuid: string;
}

export interface StApp {
  guid: string;
  name: string;
  state: string;
  // orgGuid, memory, diskQuota are tristate-bearing: optional reflects the
  // "value does not exist" state (absent when handler couldn't compose them,
  // listed in _meta.unavailable). See Track 2 page 1 plan Groups 3/4.
  orgGuid?: string;
  spaceGuid: string;
  instances: number;
  memory?: number;
  diskQuota?: number;
  createdAt: string;
  updatedAt: string;
  cnsiGuid: string;
  _meta?: StratosMeta;
}

export interface StratosMeta {
  unavailable?: string[];
  errors?: StratosError[];
}

export interface StratosError {
  scope?: 'envelope' | 'row';
  code: string;
  title: string;
  detail?: string;
  guid?: string;
  affected?: string[];
  affectedGuids?: string[];
}

export interface StSpace {
  guid: string;
  name: string;
  orgGuid: string;
  createdAt: string;
  updatedAt: string;
  cnsiGuid: string;
}

export interface StOrgDetail extends StOrg {
  spaces: StSpace[];
}

export interface StError {
  resource: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  message: string;
  recoverable: boolean;
  detail?: unknown;
}

export interface StEndpointData {
  orgs: StOrg[];
  orgCount: number;
  apps: StApp[];
  recentApps: StApp[];
  appCount: number;
  spaces: StSpace[];
  routeCount: number;
}

// Jetstream response shapes
export interface StOrgsResponse {
  resources: StOrg[];
  totalResults: number;
}

export interface StAppsResponse {
  resources: StApp[];
  totalResults: number;
}

export interface StRoutesResponse {
  resources?: StRoute[];
  totalResults: number;
}

// Mirror of the backend StRoute DTO (native_types.go). `url` is the
// CF-rendered full URL so the UI can display it directly; no need to
// re-compose from host + domain + port. `port` is undefined for HTTP
// routes, set for TCP. `appGuids` is populated by the backend via a
// /v3/routes/{guid}/destinations fan-out; omit when the list was fetched
// via the counts path.
export interface StRoute {
  guid: string;
  url: string;
  host: string;
  path: string;
  port?: number;
  domainGuid: string;
  spaceGuid: string;
  cnsiGuid: string;
  appGuids?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StAppRoutesResponse {
  resources: StRoute[];
  totalResults: number;
}

// Mirror of backend StServiceBinding (native_types.go). Populated by the
// two-step join in /pp/v1/cf/apps/{cnsi}/{app}/service_bindings —
// `serviceInstanceName` and `serviceInstanceType` come from a batch fetch of
// /v3/service_instances; they fall back to the binding's own name when the
// name-lookup fails.
export interface StServiceBinding {
  guid: string;
  name: string;
  bindingType: string; // "app" or "key"
  appGuid?: string;
  serviceInstanceGuid: string;
  serviceInstanceName: string;
  serviceInstanceType: string; // "managed" | "user-provided"
  createdAt: string;
  updatedAt: string;
}

export interface StAppServiceBindingsResponse {
  resources: StServiceBinding[];
  totalResults: number;
}

export interface StOrgDetailResponse extends StOrgDetail {}

export interface StSpacesResponse {
  resources: StSpace[];
  totalResults: number;
}

// Mirror of the backend StServiceOffering DTO
// (native_service_offerings_reads.go). One row per CF service offering — the
// catalog entry advertised by a broker, NOT an instantiated service. Drives
// the marketplace list page.
//
// `public` corresponds to CF v3's `available` boolean (legacy Stratos UI
// labelled it "Public"). `brokerName` is populated by the backend via a
// batch fetch of /v3/service_brokers; falls back to '' on broker-list error.
// `tags` is normalised to a non-null array on the backend so consumers can
// `.join(',')` without a null guard.
export interface StServiceOffering {
  guid: string;
  name: string;
  description: string;
  brokerName: string;
  tags: string[];
  public: boolean;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StServiceOfferingsResponse {
  resources: StServiceOffering[];
  totalResults: number;
}
