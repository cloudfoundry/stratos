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

// Mirror of the backend StServiceInstance DTO
// (native_service_instances_reads.go). One row per CF service instance —
// `type` discriminates managed vs user-provided. Drives the /services
// list page.
//
// `serviceOfferingName` is populated by a two-step join (service_plan ->
// service_offering) on the backend for managed instances. User-provided
// instances have neither plan nor offering and the name stays empty —
// the UI labels the row "User Provided" instead. `lastOpState` mirrors
// CF's last_operation.state (e.g. "succeeded", "in progress", "failed");
// `tags` is normalised to a non-null array on the backend so consumers
// can `.join(',')` without a guard.
export interface StServiceInstance {
  guid: string;
  name: string;
  type: string; // "managed" | "user-provided"
  cnsiGuid: string;
  spaceGuid?: string;
  servicePlanGuid?: string;
  serviceOfferingGuid?: string;
  serviceOfferingName?: string;
  tags: string[];
  dashboardUrl?: string;
  lastOpType?: string;
  lastOpState?: string;
  lastOpDescription?: string;
  lastOpUpdatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StServiceInstancesResponse {
  resources: StServiceInstance[];
  totalResults: number;
}

// Mirror of the backend StUserOrgRole DTO (native_types.go). One bucket
// per (user, org) — each carries the prefix-stripped role names the user
// holds in that org (e.g. ["manager", "auditor"]).
export interface StUserOrgRole {
  orgGuid: string;
  roles: string[];
}

// Mirror of the backend StUserSpaceRole DTO. One bucket per (user, space)
// — each carries the prefix-stripped space-scoped role names. orgGuid is
// included so the per-row cell can compose "<org>/<space>: <roles>"
// without a second lookup.
export interface StUserSpaceRole {
  orgGuid: string;
  spaceGuid: string;
  roles: string[];
}

// Mirror of the backend StUser DTO (native_types.go). One row per CF user;
// org and space role grants are bucketed per-scope so the UI doesn't pay a
// second pass through the role list per render.
//
// Drives the CF-level users page and the per-space users tab — the
// per-space variant filters client-side on
// `spaceRoles.some(sr => sr.spaceGuid === lockedSpaceGuid)`.
//
// PresentationName + Origin are V3-only fields; the UI treats them as
// optional cells (em-dash placeholder when empty). orgRoles + spaceRoles
// are normalised to non-null arrays on the backend so consumers can `.length`
// without a guard.
export interface StUser {
  guid: string;
  username: string;
  presentationName?: string;
  origin?: string;
  cnsiGuid: string;
  orgRoles: StUserOrgRole[];
  spaceRoles: StUserSpaceRole[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StUsersResponse {
  resources: StUser[];
  totalResults: number;
}

// StStack is the Stratos-shaped DTO for a CF stack — the rootfs image flavor
// a Diego cell uses to run apps (e.g. cflinuxfs4). Drives the CF-level
// Stacks tab. cnsiGuid is stamped server-side so multi-CNSI rendering keys
// off (cnsi, stack) — same convention as StApp/StOrg/StRoute.
export interface StStack {
  guid: string;
  name: string;
  description: string;
  buildRootfsImage?: string;
  runRootfsImage?: string;
  default: boolean;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StStacksResponse {
  resources: StStack[];
  totalResults: number;
}

// StBuildpack is the Stratos-shaped DTO for a CF buildpack. Buildpacks
// govern how source bundles get staged before running on a Diego cell;
// each is pinned to one rootfs (Stack) and ordered by Position. Drives
// the CF-level Buildpacks tab. cnsiGuid is stamped server-side so
// multi-CNSI rows render keyed by (cnsi, buildpack) — same convention as
// StApp/StOrg/StStack. v3-only fields (state, lifecycle) flow through as
// plain strings; null filename/stack are coerced to '' on the backend.
export interface StBuildpack {
  guid: string;
  name: string;
  state: string;
  filename: string;
  stack: string;
  position: number;
  lifecycle: string;
  enabled: boolean;
  locked: boolean;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StBuildpacksResponse {
  resources: StBuildpack[];
  totalResults: number;
}
