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
  // orgGuid, spaceName, memory, diskQuota, stackName, routes are tristate-
  // bearing: optional reflects the "value does not exist" state (absent
  // when handler couldn't compose them, listed in _meta.unavailable).
  // stackName is sourced inline from app.lifecycle.data.stack (V3
  // buildpack lifecycle); empty for non-buildpack lifecycles. routes is
  // populated by a server-side /v3/routes?app_guids=... batch fetch and
  // always-emits an array (defaults to []) so consumers can iterate
  // without a null guard.
  orgGuid?: string;
  spaceGuid: string;
  spaceName?: string;
  stackName?: string;
  instances: number;
  memory?: number;
  diskQuota?: number;
  routes: StAppRoute[];
  createdAt: string;
  updatedAt: string;
  cnsiGuid: string;
  _meta?: StratosMeta;
}

// Mirror of the backend StAppRoute DTO (native_types.go). Inline
// collection on StApp.routes — minimal compared to StRoute (just enough
// to render route URLs in an apps-list cell). Full route data lives at
// /pp/v1/cf/apps/{cnsi}/{app}/routes.
export interface StAppRoute {
  guid: string;
  url: string;
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

// V3 web-process shape. The web process owns the runtime config legacy v2
// callers read off the app entity itself (memory, disk, instances, command,
// health-check fields). Sourced from /v3/apps/:guid/processes/web.
export interface StProcess {
  guid: string;
  type: string;
  instances: number;
  memoryMb: number;
  diskMb: number;
  logRateLimitInBytesPerSecond: number;
  command: string;
  healthCheckType: string;
  healthCheckEndpoint?: string;
  healthCheckInvocationTimeoutSeconds?: number;
  healthCheckTimeoutSeconds?: number;
  readinessHealthCheckType?: string;
  ports: number[];
}

// V3 droplet shape. The droplet is the staged artifact CF runs — buildpack
// outputs, stack image, optional docker image. Sourced from
// /v3/apps/:guid/droplets/current. Null when the app has never been staged.
export interface StDroplet {
  guid: string;
  state: string;
  error?: string;
  lifecycleType: string;
  stack?: string;
  buildpacks: StDropletBuildpack[];
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StDropletBuildpack {
  name: string;
  detectOutput?: string;
  version?: string;
  buildpackName?: string;
}

// V3 package shape — the uploaded source bits (or docker image reference)
// that get staged into a droplet. `state` mirrors v2's package_state field
// (PROCESSING_UPLOAD / READY / FAILED / AWAITING_UPLOAD). Sourced from
// /v3/apps/:guid/packages with order_by=-created_at,limit=1.
export interface StPackage {
  guid: string;
  state: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// V3 build shape — the staging job that turns a package into a droplet.
// `error` populates the legacy staging_failed_description field. Sourced
// from /v3/apps/:guid/builds with order_by=-created_at,limit=1.
export interface StBuild {
  guid: string;
  state: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Composed v3 app-detail envelope. The Jetstream native handler at
// /pp/v1/cf/apps/{cnsi}/{appGuid} fans out to /v3/apps/:guid + /processes/web
// + /droplets/current + /packages + /builds + /ssh_enabled and returns this
// shape in one response. Missing sub-resources are listed in
// _meta.unavailable per the V2/V3 tristate pattern; consumers render those
// cells as "Not Available" rather than empty.
export interface StAppDetail {
  app: StApp;
  process: StProcess;
  droplet: StDroplet | null;
  pkg: StPackage | null;
  build: StBuild | null;
  sshEnabled: boolean;
  _meta?: StratosMeta;
}

// Composed v3 app-summary envelope. Sourced from
// /pp/v1/cf/apps/{cnsi}/{appGuid}/summary — same fan-out as StAppDetail
// plus /v3/apps/:guid/routes and /v3/apps/:guid/service_credential_bindings,
// flattened into the field set the legacy Summary tab template reads.
// Backend coerces missing v3 nullables (buildpack, stack, command,
// health-check fields) to undefined so the UI can branch on presence.
export interface StAppSummary {
  guid: string;
  name: string;
  state: string;
  memory: number;
  diskQuota: number;
  instances: number;
  routes: StAppRoute[];
  services: StServiceCredentialBinding[];
  buildpack?: string;
  detectedBuildpack?: string;
  stackName?: string;
  command?: string;
  healthCheckType?: string;
  healthCheckTimeout?: number;
  packageState?: string;
  packageUpdatedAt?: string;
  stagingFailedDescription?: string;
  _meta?: StratosMeta;
}

// V3 env-vars envelope. Sourced from /pp/v1/cf/apps/{cnsi}/{appGuid}/env,
// composed from /v3/apps/:guid/env and /v3/apps/:guid/environment_variables.
// `systemProvided` carries VCAP_SERVICES + VCAP_APPLICATION (typed as `any`
// because their inner shape is broker-defined and varies wildly).
export interface StEnvVars {
  environment: Record<string, string>;
  systemProvided: { VCAP_SERVICES?: any; VCAP_APPLICATION?: any };
  applicationProvided?: Record<string, string>;
  runningProvided?: Record<string, string>;
  stagingProvided?: Record<string, string>;
}

// V3 process-stats row, mirroring the backend StAppStatsInstance DTO.
// Sourced from /pp/v1/cf/app-stats/{cnsi}/{appGuid}, composed from
// /v3/apps/:guid/processes/web/stats. One row per running instance.
// Backend emits an empty `instances` array for STOPPED apps (it
// swallows CF-AppStoppedStatsError 400). `usage` carries the live
// CPU/memory/disk metrics auto-scaler / app-monitor consumers read;
// it's omitempty on the wire when CF reports no usage data (e.g.
// CRASHED instances).
export interface StAppStat {
  index: number;
  state: string;
  uptime: number;
  memQuota: number;
  diskQuota: number;
  fdsQuota: number;
  host?: string;
  usage?: StProcessUsage;
}

export interface StProcessUsage {
  time: string;
  cpu: number;
  mem: number;
  disk: number;
}

export interface StSpace {
  guid: string;
  name: string;
  orgGuid: string;
  createdAt: string;
  updatedAt: string;
  cnsiGuid: string;
  // Server-side aggregates (V3 deep-relations) — drive the spaces-list
  // "Apps" / "Routes" columns from a single payload. Always-emit, default 0
  // when the backend enrichment fetch fails.
  appCount: number;
  routeCount: number;
  // V3 space-feature `ssh` flag — populated only by detail handlers
  // (getNativeSpaceDetail). List handlers leave it `false` to avoid
  // an N+1 /v3/spaces/{guid}/features/ssh fetch per space.
  allowSsh: boolean;
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

// ---------------------------------------------------------------------------
// Services-domain refs (services-domain signal+V3 slice). All five service
// entity types use nested-ref form. `guid` is always populated; `name` and
// chain-leaf joins populate at `?return=summary`; extended fields populate
// at `?return=details`. Refs nest to mirror v3's include-relation tree
// (`servicePlan.serviceOffering.broker`, `space.organization`).
// ---------------------------------------------------------------------------

export interface StAppRef {
  guid: string;
  name?: string;
}

export interface StOrgRef {
  guid: string;
  name?: string;
}

export interface StSpaceRef {
  guid: string;
  name?: string;
  organization?: StOrgRef;
}

// StServiceBrokerRef — guid-only at base; name at summary+; url + space at
// details. `_meta` carries design-time tristate (notably `authUsername`,
// which v3 never returns on read by spec).
export interface StServiceBrokerRef {
  guid: string;
  name?: string;
  url?: string;
  space?: StSpaceRef;
  _meta?: StratosMeta;
}

// StServiceOfferingRef — guid+name at summary+; broker populated at
// summary+ via the v3 include chain. Extended fields are details-only.
export interface StServiceOfferingRef {
  guid: string;
  name?: string;
  broker?: StServiceBrokerRef;
  description?: string;
  tags?: string[];
  requires?: string[];
  documentationUrl?: string;
  brokerCatalogMetadata?: { [k: string]: unknown };
  available?: boolean;
  shareable?: boolean;
}

// StServicePlanRef — guid+name+free at summary+; serviceOffering chain at
// summary+; description/visibility/costs/schemas at details.
export interface StServicePlanRef {
  guid: string;
  name?: string;
  free?: boolean;
  serviceOffering?: StServiceOfferingRef;
  description?: string;
  visibilityType?: string;
  available?: boolean;
  costs?: StServicePlanCost[];
  schemas?: StPlanSchemas;
}

// StServiceInstanceRef — guid at base; name+type at summary+. Used from
// credential bindings and route bindings to refer back to an instance.
export interface StServiceInstanceRef {
  guid: string;
  name?: string;
  type?: string; // 'managed' | 'user-provided'
}

// StLastOperation mirrors v3's last_operation block on instances and
// bindings. Empty struct when the upstream resource has no operation
// recorded.
export interface StLastOperation {
  type?: string;
  state?: string;
  description?: string;
  updatedAt?: string;
  createdAt?: string;
}

// StMaintenanceInfo mirrors v3's maintenance_info field on plans and
// instances. Drives upgrade-available prompts.
export interface StMaintenanceInfo {
  version?: string;
  description?: string;
}

// StPlanSchemas mirrors v3's plan `schemas` — broker-advertised JSON-Schema
// blobs for create / update / bind parameter validation. Surfaced at
// `?return=details` only; bind stepper reads these to drive parameter
// form generation.
export interface StPlanSchemas {
  serviceInstance?: StPlanSchemaInstance;
  serviceBinding?: StPlanSchemaBinding;
}

export interface StPlanSchemaInstance {
  create?: StPlanSchemaParams;
  update?: StPlanSchemaParams;
}

export interface StPlanSchemaBinding {
  create?: StPlanSchemaParams;
}

export interface StPlanSchemaParams {
  parameters?: { [k: string]: unknown };
}

// ---------------------------------------------------------------------------
// StServiceCredentialBinding (renamed from legacy StServiceBinding).
// Mirrors v3's `service_credential_binding` resource, which unifies what v2
// split into `service_binding` (type=app) and `service_key` (type=key).
//
// Tier semantics:
// - base:    guid + cnsiGuid + type + serviceInstance{guid} + (app{guid}
//            for type=app)
// - summary: + serviceInstance.{name,type}, app.name (for type=app),
//            lastOperation, syslogDrainUrl
// - details: + servicePlan, serviceOffering, broker (B-fallback batches —
//            v3 service_credential_binding `include` only reaches
//            `app, service_instance`)
//
// Lazy: parameters are fetched separately via
// /v3/service_credential_bindings/:guid/parameters; credentials via
// /v3/service_credential_bindings/:guid/details/credentials (sensitive).
// ---------------------------------------------------------------------------
export interface StServiceCredentialBinding {
  guid: string;
  cnsiGuid: string;
  type: string; // 'app' | 'key'
  name?: string; // required for type=key; v3 standardised on bindings too

  serviceInstance: StServiceInstanceRef;
  app?: StAppRef; // type=app only

  lastOperation?: StLastOperation;
  syslogDrainUrl?: string;

  // Details-only — not reachable via v3 include chain on bindings:
  servicePlan?: StServicePlanRef;
  serviceOffering?: StServiceOfferingRef;
  broker?: StServiceBrokerRef;

  createdAt: string;
  updatedAt?: string;
  _meta?: StratosMeta;
}

export interface StServiceCredentialBindingsResponse {
  resources: StServiceCredentialBinding[];
  totalResults?: number;
  pagination?: { totalResults?: number };
}

export interface StOrgDetailResponse extends StOrgDetail {}

export interface StSpacesResponse {
  resources: StSpace[];
  totalResults: number;
}

// Mirror of the backend StServiceOffering DTO. One row per CF service
// offering — the catalog entry advertised by a broker, NOT an instantiated
// service. Drives the marketplace list page.
//
// Tier semantics:
// - base:    guid + cnsiGuid + name + createdAt
// - summary: + description + tags + available (`public` in legacy UI) +
//            broker.{guid,name}
// - details: + requires + documentationUrl + brokerCatalogMetadata +
//            shareable + broker fully expanded
//
// `tags` is normalised to a non-null array by the backend so consumers can
// `.join(',')` without a null guard.
export interface StServiceOffering {
  guid: string;
  cnsiGuid: string;
  name: string;
  description?: string;
  tags?: string[];
  available?: boolean;            // v3 `available` (legacy UI label "Public")
  shareable?: boolean;
  requires?: string[];
  documentationUrl?: string;
  brokerCatalogMetadata?: { [k: string]: unknown };

  broker?: StServiceBrokerRef;

  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
  createdAt: string;
  updatedAt?: string;
  _meta?: StratosMeta;
}

export interface StServiceOfferingsResponse {
  resources: StServiceOffering[];
  totalResults: number;
}

// Mirror of the backend StServiceInstance DTO. One row per CF service
// instance — `type` discriminates managed vs user-provided. Drives the
// /services list page.
//
// Tier semantics:
// - base:    guid + cnsiGuid + name + type + tags + lastOperation +
//            space.{guid} + (servicePlan.{guid} for managed) + createdAt
// - summary: + dashboardUrl/syslogDrainUrl/routeServiceUrl as applicable;
//            space.{name,organization{guid,name}};
//            servicePlan.{name,free,serviceOffering{guid,name,broker{guid,name}}}
// - details: + maintenanceInfo + upgradeAvailable + servicePlan/offering/broker
//            fully expanded with extended fields
//
// UPS rows omit `servicePlan` (genuinely doesn't apply for `type=user-provided`).
// `tags` is normalised to a non-null array.
//
// Cross-entity counts (e.g. bindingsCount) are NOT wire fields — the
// frontend derives them from the loaded credential-bindings signal
// filtered per instance.
export interface StServiceInstance {
  guid: string;
  cnsiGuid: string;
  name: string;
  type: string; // 'managed' | 'user-provided'
  tags: string[];
  lastOperation: StLastOperation;

  dashboardUrl?: string;
  syslogDrainUrl?: string;     // UPS-only
  routeServiceUrl?: string;    // UPS-only
  maintenanceInfo?: StMaintenanceInfo;
  upgradeAvailable?: boolean;
  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };

  space: StSpaceRef;
  servicePlan?: StServicePlanRef; // managed only

  createdAt: string;
  updatedAt?: string;
  _meta?: StratosMeta;
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

// Mirrors the Go StratosPagedResponse[T] envelope returned by multi-resource
// native handlers — paged metadata under `pagination`, not flat `totalResults`.
// Single-resource detail handlers do NOT use this; they return their resource
// shape directly.
export interface StratosPagedResponse<T> {
  resources: T[];
  pagination: {
    totalResults: number;
    totalPages?: number;
    page?: number;
    perPage?: number;
  };
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

// Mirror of the backend StServicePlan DTO. Service plan = catalog entry
// advertised by an offering. `visibilityType` is one of
// `public`/`admin`/`organization`/`space` and is managed via the
// /pp/v1/cf/service_plans/:cnsi/:planGuid/visibility endpoints (separate
// vertical). `space` is set only for plans with `visibilityType=space`.
//
// Tier semantics:
// - base:    guid + cnsiGuid + name + serviceOffering.{guid} + createdAt
// - summary: + description + free + available + visibilityType +
//            serviceOffering.{name, broker{guid,name}}
// - details: + costs + schemas + labels + annotations + serviceOffering fully expanded
export interface StServicePlan {
  guid: string;
  cnsiGuid: string;
  name: string;
  description?: string;
  free?: boolean;
  available?: boolean;
  visibilityType?: string;
  costs?: StServicePlanCost[];
  schemas?: StPlanSchemas;
  maintenanceInfo?: StMaintenanceInfo;

  serviceOffering?: StServiceOfferingRef;
  space?: StSpaceRef; // visibilityType=space only

  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
  createdAt: string;
  updatedAt?: string;
  _meta?: StratosMeta;
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

// Mirror of the backend StServiceBroker DTO. `url` is the broker endpoint
// Cloud Controller talks to (NOT a Stratos URL). `space` is set only for
// space-scoped brokers; absent for global ones.
//
// Tier semantics:
// - base:    guid + cnsiGuid + name + createdAt
// - summary: + url + space.{guid,name}
// - details: + labels + annotations + space fully expanded
//
// `_meta.unavailable: ['authUsername']` is emitted by the backend handler
// on every V3 read because v3's API never returns broker auth credentials
// (write-only by spec). Drives the tristate "Not Available" rendering on
// the broker detail card.
export interface StServiceBroker {
  guid: string;
  cnsiGuid: string;
  name: string;
  url?: string;

  space?: StSpaceRef;

  authUsername?: string; // tristate via _meta.unavailable

  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
  createdAt: string;
  updatedAt?: string;
  _meta?: StratosMeta;
}

export interface StServiceBrokersResponse {
  resources: StServiceBroker[];
  totalResults: number;
}
