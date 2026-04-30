// src/frontend/packages/cloud-foundry/src/services/endpoint-data/stratos-types.ts

export interface StOrg {
  guid: string;
  name: string;
  status: string;
  // Mirrors v3's relationships.quota.data.guid stamped server-side. Empty
  // when the org has no quota linked. The legacy ngrx consumer reads this
  // as `org.entity.quota_definition_guid` via the V3-native adapter rename.
  quotaGuid: string;
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
  serviceBrokerGuid?: string;
  tags: string[];
  public: boolean;
  documentationUrl?: string;
  // brokerCatalogMetadata mirrors v3's broker_catalog.metadata — broker-
  // populated extras like longDescription, providerDisplayName, supportUrl.
  // Replaces the legacy v2 `extra` JSON blob (already pre-parsed on the
  // backend).
  brokerCatalogMetadata?: { [k: string]: unknown };
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

// StSecurityGroup is the Stratos-shaped DTO for a CF security group.
// Security groups govern egress traffic from app containers; each is a
// named bundle of rules (protocol/destination/ports) flagged globally
// enabled for running and/or staging lifecycles. Drives the CF-level
// Security Groups tab. Rule arrays + bound space arrays are reduced to
// counts on the list shape; a future detail screen will own the rule
// table. cnsiGuid is stamped server-side so multi-CNSI rendering keys
// off (cnsi, security group) — same convention as StApp/StOrg/StStack.
export interface StSecurityGroup {
  guid: string;
  name: string;
  globallyEnabledRunning: boolean;
  globallyEnabledStaging: boolean;
  ruleCount: number;
  runningSpaceCount: number;
  stagingSpaceCount: number;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StSecurityGroupsResponse {
  resources: StSecurityGroup[];
  totalResults: number;
}

// StFeatureFlag is the Stratos-shaped DTO for a CF feature flag.
// Feature flags govern user-visible affordances (e.g. user_org_creation,
// app_bits_upload) — global on/off switches with optional custom error
// messages. Drives the CF-level Feature Flags tab. Unlike most St*
// DTOs there is no GUID — name is the identity — and no createdAt;
// CF tracks only the last update timestamp. cnsiGuid is stamped
// server-side so multi-CNSI rendering keys off (cnsi, name).
// customErrorMessage and updatedAt come through as nullable on v3;
// both coerced to '' on the backend to keep the wire shape flat.
export interface StFeatureFlag {
  name: string;
  enabled: boolean;
  customErrorMessage: string;
  cnsiGuid: string;
  updatedAt: string;
}

export interface StFeatureFlagsResponse {
  resources: StFeatureFlag[];
  totalResults: number;
}

// StDomain is the Stratos-shaped DTO for a CF v3 domain — the DNS
// suffix routes attach to. owningOrgGuid is set for private domains
// (visible/usable only inside one org); empty for shared domains.
// sharedOrgGuids lists orgs a shared domain is explicitly shared with.
// internal flags container-to-container-only domains (no public
// ingress). routerGroupGuid associates TCP domains with a router
// group; empty for HTTP domains. cnsiGuid is stamped server-side so
// multi-CNSI rendering keys off (cnsi, domain).
export interface StDomain {
  guid: string;
  name: string;
  internal: boolean;
  routerGroupGuid?: string;
  supportedProtocols: string[];
  owningOrgGuid?: string;
  sharedOrgGuids: string[];
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StDomainsResponse {
  resources: StDomain[];
  totalResults: number;
}

// StOrgQuota is the Stratos-shaped DTO for a CF organization quota.
// Org quotas cap the apps / services / routes / domains an organization
// can hold across all its spaces. All limit fields use -1 to signal
// "Unlimited" — the v3 wire shape nulls a missing limit, which the
// backend coerces to -1 so the frontend renders "Unlimited" without
// null-guarding every cell.
export interface StOrgQuota {
  guid: string;
  name: string;
  totalMemoryInMB: number;
  totalInstanceMemoryInMB: number;
  totalInstances: number;
  totalAppTasks: number;
  paidServicesAllowed: boolean;
  totalServiceInstances: number;
  totalServiceKeys: number;
  totalRoutes: number;
  totalReservedPorts: number;
  totalDomains: number;
  organizationCount: number;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StOrgQuotasResponse {
  resources: StOrgQuota[];
  totalResults: number;
}

// StSpaceQuota is the Stratos-shaped DTO for a CF space quota. Space
// quotas cap apps / services / routes within a single org, optionally
// applied to specific spaces. Mirrors StOrgQuota minus the Domains gate
// plus an organizationGuid pointing at the parent org. Same -1 =
// "Unlimited" convention as StOrgQuota.
export interface StSpaceQuota {
  guid: string;
  name: string;
  totalMemoryInMB: number;
  totalInstanceMemoryInMB: number;
  totalInstances: number;
  totalAppTasks: number;
  paidServicesAllowed: boolean;
  totalServiceInstances: number;
  totalServiceKeys: number;
  totalRoutes: number;
  totalReservedPorts: number;
  organizationGuid: string;
  spaceCount: number;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StSpaceQuotasResponse {
  resources: StSpaceQuota[];
  totalResults: number;
}

// StAuditEvent is the Stratos-shaped DTO for a CF audit event. CF v3
// emits an event for every successful API mutation with actor, target,
// type, optional space/org context, and an arbitrary `data` payload.
// Drives the CF-level Events tab plus the org / space / app event tabs
// (which apply per-page filters via the signal-config service's
// basePredicate). cnsiGuid is stamped server-side for multi-CNSI keying.
//
// `data` is delivered as a JSON-encoded string — the v3 shape varies
// wildly per event type. The list view only shows whether data exists
// (and renders it expanded on demand); a future detail screen can
// JSON.parse() it.
export interface StAuditEvent {
  guid: string;
  type: string;
  actorGuid: string;
  actorType: string;
  actorName: string;
  targetGuid: string;
  targetType: string;
  targetName: string;
  spaceGuid: string;
  spaceName: string;
  organizationGuid: string;
  organizationName: string;
  data: string;
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StAuditEventsResponse {
  resources: StAuditEvent[];
  totalResults: number;
}

// Mirror of the backend StServicePlan DTO (native_service_plans_reads.go).
// Service plan = catalog entry advertised by an offering. `visibilityType`
// is one of `public`/`admin`/`organization`/`space` and is managed via the
// /pp/v1/cf/service_plans/:cnsi/:planGuid/visibility endpoints (separate
// vertical). `spaceGuid` is set only for plans with `visibilityType=space`.
export interface StServicePlan {
  guid: string;
  name: string;
  description: string;
  available: boolean;
  free: boolean;
  visibilityType: string;
  serviceOfferingGuid: string;
  spaceGuid?: string;
  costs: StServicePlanCost[];
  labels: { [k: string]: string };
  annotations: { [k: string]: string };
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StServicePlanCost {
  amount: number;
  currency: string;
  unit: string;
}

export interface StServicePlansResponse {
  resources: StServicePlan[];
  totalResults: number;
}

// Mirror of the backend StServicePlanVisibility DTO. CRUD-shape for one
// plan's visibility scope. Type is one of `public`/`admin`/`organization`/
// `space`; `organizations` is set for type=organization, `space` for
// type=space, both empty otherwise.
export interface StServicePlanVisibility {
  type: string;
  organizations?: StServicePlanVisibilityOrg[];
  space?: StServicePlanVisibilitySpace;
}

export interface StServicePlanVisibilityOrg {
  guid: string;
  name?: string;
}

export interface StServicePlanVisibilitySpace {
  guid: string;
  name?: string;
}

// Mirror of the backend StServiceBroker DTO (native_service_brokers_reads.go).
// `url` is the broker endpoint Cloud Controller talks to (NOT a Stratos URL).
// `spaceGuid` is set only for space-scoped brokers; empty for global ones.
// `authUsername` is tristate-bearing: V3 read responses do not expose it
// (write-only by CAPI design), V2 returns it. Until the broker handler grows
// a V2 fallback, this field is always listed in `_meta.unavailable` — see
// the synthesis in ServiceCatalogDataService.serviceBroker().
export interface StServiceBroker {
  guid: string;
  name: string;
  url: string;
  spaceGuid?: string;
  authUsername?: string;
  labels: { [k: string]: string };
  annotations: { [k: string]: string };
  cnsiGuid: string;
  createdAt: string;
  updatedAt: string;
  _meta?: StratosMeta;
}

export interface StServiceBrokersResponse {
  resources: StServiceBroker[];
  totalResults: number;
}
