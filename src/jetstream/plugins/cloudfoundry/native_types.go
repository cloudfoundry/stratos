// src/jetstream/plugins/cloudfoundry/native_types.go
package cloudfoundry

// Stratos-shaped response DTOs for native CF routes.
// These are our clean contract — not bound by CF v2 or v3 shape.
// Version communicated via X-Stratos-Schema-Version response header.

type StOrg struct {
	GUID   string `json:"guid"`
	Name   string `json:"name"`
	Status string `json:"status"`
	// QuotaGUID mirrors v3's relationships.quota.data.guid — the org's
	// associated quota_definition. Empty when the org has no quota linked
	// or when the source response omitted the relationship envelope.
	QuotaGUID   string            `json:"quotaGuid"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt"`
	// SpacesCount is a server-side aggregate from /v3/spaces filtered by
	// organization_guids — drives the orgs-list "Spaces" column from a
	// single payload. Always-emit (default 0) so the wire shape stays
	// predictable; on enrichment failure the default-path handler degrades
	// silently (mirrors the StSpace AppCount/RouteCount pattern).
	SpacesCount int `json:"spacesCount"`
}

type StApp struct {
	GUID      string  `json:"guid"`
	Name      string  `json:"name"`
	State     string  `json:"state"`
	SpaceGUID string  `json:"spaceGuid"`
	SpaceName string  `json:"spaceName,omitempty"`
	OrgGUID   *string `json:"orgGuid,omitempty"`
	// StackName is sourced inline from CF v3's app.lifecycle.data.stack
	// (buildpack lifecycle) — V3 has no stack GUID, the name IS the
	// identity. No extra HTTP call: it ships on every /v3/apps row.
	StackName string `json:"stackName,omitempty"`
	Instances int    `json:"instances"`
	Memory    *int   `json:"memory,omitempty"`
	DiskQuota *int   `json:"diskQuota,omitempty"`
	// Routes is the set of routes mapped to this app, populated by a
	// batched /v3/routes?app_guids=... fetch on the apps list paths.
	// Always-emit (default []) so frontend renderers can iterate without
	// a null guard. On routes-fetch failure the field stays empty and
	// "routes" surfaces in _meta.unavailable for tristate handling.
	Routes    []StAppRoute `json:"routes"`
	CreatedAt string       `json:"createdAt"`
	UpdatedAt string       `json:"updatedAt"`
	Meta      *StratosMeta `json:"_meta,omitempty"`
}

// StAppRoute is the inline-collection shape carried on StApp.Routes.
// Minimal compared to the standalone StRoute — the apps list only needs
// enough to render route URLs in a cell; the dedicated routes endpoints
// keep the full DTO.
type StAppRoute struct {
	GUID string `json:"guid"`
	URL  string `json:"url"`
}

type StSpace struct {
	GUID      string `json:"guid"`
	Name      string `json:"name"`
	OrgGUID   string `json:"orgGuid"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
	// AppCount and RouteCount are server-side aggregates from /v3/apps and
	// /v3/routes filtered by space_guids — drives the spaces-list "Apps"
	// and "Routes" columns from a single payload. Always-emit (default 0)
	// so the wire shape stays predictable; on enrichment failure the
	// default-path handler degrades silently (mirrors the StApp-Space
	// pattern's lazy-non-fatal default branch).
	AppCount   int `json:"appCount"`
	RouteCount int `json:"routeCount"`
	// AllowSSH mirrors the V3 space-feature `ssh` (V3 moved this off the
	// space resource onto /v3/spaces/{guid}/features/ssh). Populated only
	// by detail handlers (getNativeSpaceDetail); list handlers leave it at
	// the default `false` to avoid an N+1 feature fetch per space.
	AllowSSH bool `json:"allowSsh"`
}

type StOrgDetail struct {
	StOrg
	Spaces []StSpace `json:"spaces"`
}

// StSpaceDetail is the per-space detail wrapper. Kept as a thin embed
// of StSpace today (mirrors StOrgDetail) so we can extend the detail
// payload without breaking the list shape.
type StSpaceDetail struct {
	StSpace
}

type StOrgsResponse struct {
	Resources    []StOrg `json:"resources"`
	TotalResults int     `json:"totalResults"`
}

type StAppsResponse struct {
	Resources    []StApp `json:"resources"`
	TotalResults int     `json:"totalResults"`
}

type StRoutesResponse struct {
	Resources    []StRoute `json:"resources,omitempty"`
	TotalResults int       `json:"totalResults"`
}

// StRoute is the Stratos-shaped DTO for a CF route. Used by the delete-app
// flow's route-selection picker and future route-management UIs.
//
// Port is a pointer so TCP routes (port set) and HTTP routes (port unset) are
// distinguishable downstream; marshals as a number or omitted entirely.
// URL is the CF-rendered full URL (e.g. "my-app.apps.example.com" or
// "tcp.example.com:4040") — the frontend can render it directly without
// re-composing from host + domain + port.
type StRoute struct {
	GUID       string   `json:"guid"`
	URL        string   `json:"url"`
	Host       string   `json:"host"`
	Path       string   `json:"path"`
	Port       *int     `json:"port,omitempty"`
	DomainGUID string   `json:"domainGuid"`
	SpaceGUID  string   `json:"spaceGuid"`
	CnsiGUID   string   `json:"cnsiGuid"`
	AppGUIDs   []string `json:"appGuids,omitempty"`
	CreatedAt  string   `json:"createdAt"`
	UpdatedAt  string   `json:"updatedAt"`
}

type StAppRoutesResponse struct {
	Resources    []StRoute `json:"resources"`
	TotalResults int       `json:"totalResults"`
}

// StServiceCredentialBinding mirrors v3's service_credential_binding
// resource — type discriminates app bindings from service keys. Drives
// the app-detail Services tab, the delete-app picker, and the
// service-key management UI.
//
// Tier semantics:
//   - base:    guid + cnsiGuid + type + serviceInstance.{guid} + (app.{guid}
//     for type=app)
//   - summary: + name + serviceInstance.{name,type} + app.{name?} +
//     lastOperation + syslogDrainUrl
//   - details: + servicePlan / serviceOffering / broker via batched lookups
//     (v3's include on credential_bindings only reaches `app,
//     service_instance`, so plan/offering/broker need a follow-up
//     fetch).
type StServiceCredentialBinding struct {
	GUID            string               `json:"guid"`
	CnsiGUID        string               `json:"cnsiGuid"`
	Type            string               `json:"type"` // 'app' | 'key'
	Name            string               `json:"name,omitempty"`
	ServiceInstance StServiceInstanceRef `json:"serviceInstance"`
	App             *StAppRef            `json:"app,omitempty"` // type=app only
	LastOperation   *StLastOperation     `json:"lastOperation,omitempty"`
	SyslogDrainURL  string               `json:"syslogDrainUrl,omitempty"`

	// Details-only — not reachable via v3 include chain on bindings:
	ServicePlan     *StServicePlanRef     `json:"servicePlan,omitempty"`
	ServiceOffering *StServiceOfferingRef `json:"serviceOffering,omitempty"`
	Broker          *StServiceBrokerRef   `json:"broker,omitempty"`

	CreatedAt string       `json:"createdAt"`
	UpdatedAt string       `json:"updatedAt,omitempty"`
	Meta      *StratosMeta `json:"_meta,omitempty"`
}

type StSpacesResponse struct {
	Resources    []StSpace `json:"resources"`
	TotalResults int       `json:"totalResults"`
}

// StServiceOffering is the Stratos-shaped DTO for a CF service offering —
// the catalog entry advertised by a broker, NOT an instantiated service.
// Drives the marketplace list page.
//
// Tier semantics, mirrored exactly by the frontend type at
// src/frontend/packages/cloud-foundry/src/services/endpoint-data/stratos-types.ts:
//   - base:    guid + cnsiGuid + name + createdAt
//   - summary: + description + tags + available (legacy UI label "Public")
//   - broker.{guid,name}
//   - details: + requires + documentationUrl + brokerCatalogMetadata +
//     shareable + broker fully expanded (URL etc.)
//
// `Available` and `Shareable` are *bool so callers can distinguish "false"
// from "not populated at this tier" — base mode emits neither, summary
// emits Available, details emits both.
//
// Broker is the nested ref shape (StServiceBrokerRef) populated at
// summary+ via the v3 `?include=service_broker` chain; at base it's nil
// and consumers can resolve via the broker GUID carried on the underlying
// v3 relationship if needed (broker.guid alone is omitted at base since
// the wire-shape already strips relationships).
type StServiceOffering struct {
	GUID                  string                 `json:"guid"`
	CnsiGUID              string                 `json:"cnsiGuid"`
	Name                  string                 `json:"name"`
	Description           string                 `json:"description,omitempty"`
	Tags                  []string               `json:"tags,omitempty"`
	Available             *bool                  `json:"available,omitempty"`
	Shareable             *bool                  `json:"shareable,omitempty"`
	Requires              []string               `json:"requires,omitempty"`
	DocumentationURL      string                 `json:"documentationUrl,omitempty"`
	BrokerCatalogMetadata map[string]interface{} `json:"brokerCatalogMetadata,omitempty"`

	Broker *StServiceBrokerRef `json:"broker,omitempty"`

	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt,omitempty"`
	Meta        *StratosMeta      `json:"_meta,omitempty"`
}

// StServicePlan is the Stratos-shaped DTO for a CF service plan — a
// catalog entry advertised by a service offering, NOT an instantiated
// service.
//
// VisibilityType mirrors CF v3's plan visibility discriminator: one of
// `public`, `admin`, `organization`, or `space` — managed via the
// /v3/service_plans/{guid}/visibility endpoint, surfaced as a separate
// vertical. Free / Available are *bool so callers can distinguish
// "false" from "not populated at this tier" (base mode emits neither).
//
// ServiceOffering is the nested ref shape (StServiceOfferingRef)
// populated at summary+ via the v3 `?include=service_offering,
// service_offering.service_broker` chain. At base it carries guid only.
// Space nests under StSpaceRef and is set only for plans with
// `visibility_type=space`.
//
// Tier policy:
//   - base:    guid + cnsiGuid + name + serviceOffering.{guid} + createdAt
//   - summary: + description + free + available + visibilityType +
//     serviceOffering.{name, broker{guid,name}} + updatedAt
//   - details: + costs + schemas + labels + annotations + serviceOffering
//     expanded (broker.url, etc.)
type StServicePlan struct {
	GUID            string                `json:"guid"`
	CnsiGUID        string                `json:"cnsiGuid"`
	Name            string                `json:"name"`
	Description     string                `json:"description,omitempty"`
	Free            *bool                 `json:"free,omitempty"`
	Available       *bool                 `json:"available,omitempty"`
	VisibilityType  string                `json:"visibilityType,omitempty"`
	ServiceOffering *StServiceOfferingRef `json:"serviceOffering,omitempty"`
	Space           *StSpaceRef           `json:"space,omitempty"`
	Costs           []StServicePlanCost   `json:"costs,omitempty"`
	Schemas         *StPlanSchemas        `json:"schemas,omitempty"`
	MaintenanceInfo *StMaintenanceInfo    `json:"maintenanceInfo,omitempty"`
	Labels          map[string]string     `json:"labels,omitempty"`
	Annotations     map[string]string     `json:"annotations,omitempty"`
	CreatedAt       string                `json:"createdAt"`
	UpdatedAt       string                `json:"updatedAt,omitempty"`
	Meta            *StratosMeta          `json:"_meta,omitempty"`
}

// StServicePlanCost mirrors CAPI's plan cost row verbatim — amount per
// currency per unit. Kept as a flat struct rather than nested under a
// container so the wire shape matches the UI's expectations directly.
type StServicePlanCost struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Unit     string  `json:"unit"`
}

// StServicePlansResponse is the legacy flat envelope kept for the
// `?return=counts` fast path. New paginated responses use
// StratosPagedResponse[StServicePlan] instead.
type StServicePlansResponse struct {
	Resources    []StServicePlan `json:"resources"`
	TotalResults int             `json:"totalResults"`
}

// StServicePlanVisibility is the Stratos-shape DTO for a CF v3
// service-plan visibility record. Mirrors CAPI's shape closely
// because the visibility surface is fundamentally CRUD on this exact
// structure — there's nothing to flatten or join.
//
// Type is one of `public`, `admin`, `organization`, `space`. When
// type=organization the Organizations slice carries the allowed orgs
// (each with guid + name). When type=space the Space pointer carries
// the allowed space. Other types leave both empty.
type StServicePlanVisibility struct {
	Type          string                        `json:"type"`
	Organizations []StServicePlanVisibilityOrg  `json:"organizations,omitempty"`
	Space         *StServicePlanVisibilitySpace `json:"space,omitempty"`
}

type StServicePlanVisibilityOrg struct {
	GUID string `json:"guid"`
	Name string `json:"name,omitempty"`
}

type StServicePlanVisibilitySpace struct {
	GUID string `json:"guid"`
	Name string `json:"name,omitempty"`
}

// StServicePlanVisibilityRequest is the inbound write shape used by both
// POST (replace) and PATCH (apply/merge) endpoints. Mirrors CAPI's
// request body — `type` plus an optional org-guid list. A space-typed
// visibility uses the same request body but with type=space.
type StServicePlanVisibilityRequest struct {
	Type          string   `json:"type"`
	Organizations []string `json:"organizations,omitempty"`
}

// StServiceBroker is the Stratos-shape DTO for a CF v3 service broker —
// the broker process that registers offerings/plans into the
// marketplace. URL is the broker endpoint Cloud Controller talks to
// (NOT the Stratos-facing URL). Space is the nested ref shape
// (StSpaceRef) populated at summary+ via `?include=space`; nil for
// global brokers. AuthUsername is always tristate-unavailable on read
// (CF v3 never returns broker credentials) — handlers emit
// `_meta.unavailable: ['authUsername']` on every non-counts response
// so the frontend renders "Not Available" with a V3 tooltip.
//
// Tier policy:
//   - base:    guid + cnsiGuid + name + url + createdAt
//   - summary: + space.{guid,name} + updatedAt
//   - details: + labels + annotations
type StServiceBroker struct {
	GUID         string            `json:"guid"`
	CnsiGUID     string            `json:"cnsiGuid"`
	Name         string            `json:"name"`
	URL          string            `json:"url,omitempty"`
	Space        *StSpaceRef       `json:"space,omitempty"`
	AuthUsername string            `json:"authUsername,omitempty"`
	Labels       map[string]string `json:"labels,omitempty"`
	Annotations  map[string]string `json:"annotations,omitempty"`
	CreatedAt    string            `json:"createdAt"`
	UpdatedAt    string            `json:"updatedAt,omitempty"`
	Meta         *StratosMeta      `json:"_meta,omitempty"`
}

// StServiceBrokersResponse is the legacy flat envelope kept for the
// `?return=counts` fast path. Paginated responses use
// StratosPagedResponse[StServiceBroker] instead.
type StServiceBrokersResponse struct {
	Resources    []StServiceBroker `json:"resources"`
	TotalResults int               `json:"totalResults"`
}

// StDomain is the Stratos-shape DTO for a CF v3 domain — the DNS
// suffix routes attach to. OwningOrgGUID is set for private domains
// (visible/usable only inside one org); empty for shared domains
// (visible to the whole platform). SharedOrgGUIDs lists orgs a shared
// domain is explicitly shared with — empty when the domain is shared
// platform-wide. Internal flags container-to-container-only domains
// (no public ingress). RouterGroupGUID associates TCP domains with a
// router group; empty for HTTP domains.
type StDomain struct {
	GUID               string            `json:"guid"`
	Name               string            `json:"name"`
	Internal           bool              `json:"internal"`
	RouterGroupGUID    string            `json:"routerGroupGuid,omitempty"`
	SupportedProtocols []string          `json:"supportedProtocols"`
	OwningOrgGUID      string            `json:"owningOrgGuid,omitempty"`
	SharedOrgGUIDs     []string          `json:"sharedOrgGuids"`
	Labels             map[string]string `json:"labels"`
	Annotations        map[string]string `json:"annotations"`
	CnsiGUID           string            `json:"cnsiGuid"`
	CreatedAt          string            `json:"createdAt"`
	UpdatedAt          string            `json:"updatedAt"`
}

// StDomainsResponse is the legacy flat envelope kept for the
// `?return=counts` fast path. Paginated responses use
// StratosPagedResponse[StDomain] instead.
type StDomainsResponse struct {
	Resources    []StDomain `json:"resources"`
	TotalResults int        `json:"totalResults"`
}

// StServiceInstance is the Stratos-shaped DTO for an instantiated CF service —
// either a managed instance broker-provisioned from a /v3/service_plans
// catalog entry or a user-provided instance representing an external service
// the platform doesn't manage. Drives the /services list page.
//
// Type carries the CF v3 discriminator ("managed" or "user-provided").
// User-provided instances omit `servicePlan` (genuinely doesn't apply).
//
// Cross-entity counts (e.g. bound-app count) are NOT wire fields — the
// frontend derives them from the loaded credential-bindings signal
// filtered per instance. Removed in the slice rework along with the
// per-page bindings drain.
//
// Tier policy:
//   - base:    guid + cnsiGuid + name + type + tags + lastOperation +
//     space.{guid} + servicePlan.{guid} (managed) + createdAt
//   - summary: + dashboardUrl/syslogDrainUrl/routeServiceUrl as applicable
//   - space.{name, organization{guid,name}}
//   - servicePlan.{name, free, serviceOffering{guid,name,broker{guid,name}}}
//   - updatedAt
//   - details: + maintenanceInfo + upgradeAvailable + labels + annotations
//   - servicePlan / offering / broker fully expanded
type StServiceInstance struct {
	GUID             string             `json:"guid"`
	CnsiGUID         string             `json:"cnsiGuid"`
	Name             string             `json:"name"`
	Type             string             `json:"type"`
	Tags             []string           `json:"tags"`
	LastOperation    *StLastOperation   `json:"lastOperation,omitempty"`
	Space            *StSpaceRef        `json:"space,omitempty"`
	ServicePlan      *StServicePlanRef  `json:"servicePlan,omitempty"`
	DashboardURL     string             `json:"dashboardUrl,omitempty"`
	SyslogDrainURL   string             `json:"syslogDrainUrl,omitempty"`
	RouteServiceURL  string             `json:"routeServiceUrl,omitempty"`
	MaintenanceInfo  *StMaintenanceInfo `json:"maintenanceInfo,omitempty"`
	UpgradeAvailable *bool              `json:"upgradeAvailable,omitempty"`
	Labels           map[string]string  `json:"labels,omitempty"`
	Annotations      map[string]string  `json:"annotations,omitempty"`
	CreatedAt        string             `json:"createdAt"`
	UpdatedAt        string             `json:"updatedAt,omitempty"`
	Meta             *StratosMeta       `json:"_meta,omitempty"`
}

// StUserProvidedServiceRequest is the inbound write shape for both
// POST (create) and PATCH (update) on user-provided service instances.
// `name` is required for create and optional for update; `spaceGuid`
// is required for create and ignored for update (v3 forbids changing
// the parent space). `credentials`, `syslogDrainUrl`, `routeServiceUrl`,
// and `tags` are UPS-specific config — credentials never appear on a
// read response, only on writes.
type StUserProvidedServiceRequest struct {
	Name            string                 `json:"name,omitempty"`
	SpaceGUID       string                 `json:"spaceGuid,omitempty"`
	Credentials     map[string]interface{} `json:"credentials,omitempty"`
	SyslogDrainURL  string                 `json:"syslogDrainUrl,omitempty"`
	RouteServiceURL string                 `json:"routeServiceUrl,omitempty"`
	Tags            []string               `json:"tags,omitempty"`
}

type StServiceInstancesResponse struct {
	Resources    []StServiceInstance `json:"resources"`
	TotalResults int                 `json:"totalResults"`
}

// StUserOrgRole bundles every org-scoped role grant (organization_manager,
// organization_auditor, organization_user, organization_billing_manager) a
// user holds in a given org. Buckets per-org so the UI can render
// "<orgName>: org_manager, org_auditor" without scanning the role list per
// row. Roles strip the "organization_" prefix before bucketing — easier to
// read in cells than the raw V3 enum.
type StUserOrgRole struct {
	OrgGuid string   `json:"orgGuid"`
	Roles   []string `json:"roles"`
}

// StUserSpaceRole is the space-scoped sibling of StUserOrgRole. Carries
// OrgGuid as well as SpaceGuid so a per-space filter (per-space users tab)
// can scope without resolving space → org each row, and a CF-level cell can
// render "<orgName>/<spaceName>: <roles>" off a single struct. Roles strip
// the "space_" prefix.
type StUserSpaceRole struct {
	OrgGuid   string   `json:"orgGuid"`
	SpaceGuid string   `json:"spaceGuid"`
	Roles     []string `json:"roles"`
}

// StUser is the Stratos-shaped DTO for a CF user — the joined view of
// /v3/users (identity) and /v3/roles (role grants). One row per user;
// org and space role grants are bucketed onto the row so the UI doesn't
// need a second pass through the role list per render.
//
// Drives the CF-level users page and the per-space users tab. The per-space
// tab filters client-side on `spaceRoles[].spaceGuid == lockedSpaceGuid`.
//
// Manage Roles + Remove User flows stay legacy in this round — write-side
// scope is intentionally absent. CnsiGuid is stamped server-side so multi-
// CNSI rows + favorites/links can be keyed by (cnsi, user) consistently with
// every other St* DTO. PresentationName + Origin are V3-only fields not
// surfaced in the V2 user shape; the UI treats them as optional cells.
type StUser struct {
	Guid             string            `json:"guid"`
	Username         string            `json:"username"`
	PresentationName string            `json:"presentationName,omitempty"`
	Origin           string            `json:"origin,omitempty"`
	CnsiGuid         string            `json:"cnsiGuid"`
	OrgRoles         []StUserOrgRole   `json:"orgRoles"`
	SpaceRoles       []StUserSpaceRole `json:"spaceRoles"`
	CreatedAt        string            `json:"createdAt,omitempty"`
	UpdatedAt        string            `json:"updatedAt,omitempty"`
}

type StUsersResponse struct {
	Resources    []StUser `json:"resources"`
	TotalResults int      `json:"totalResults"`
}

// StStack is the Stratos-shaped DTO for a CF stack. Stacks are the rootfs
// image flavor a Diego cell uses to run apps (e.g. cflinuxfs4). Drives the
// CF-level Stacks tab. Read-only at this tier; writes (create/update/delete)
// stay legacy until a use case warrants them.
//
// CnsiGUID is stamped server-side so multi-CNSI rows render keyed by
// (cnsi, stack) — same convention as StApp/StOrg/StRoute. Default flags
// the stack used when an app deploys without an explicit `--stack` choice.
type StStack struct {
	GUID             string `json:"guid"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	BuildRootfsImage string `json:"buildRootfsImage,omitempty"`
	RunRootfsImage   string `json:"runRootfsImage,omitempty"`
	Default          bool   `json:"default"`
	CnsiGUID         string `json:"cnsiGuid"`
	CreatedAt        string `json:"createdAt"`
	UpdatedAt        string `json:"updatedAt"`
}

type StStacksResponse struct {
	Resources    []StStack `json:"resources"`
	TotalResults int       `json:"totalResults"`
}

// StBuildpack is the Stratos-shaped DTO for a CF buildpack. Buildpacks
// govern how source bundles get staged before running on a Diego cell;
// each is pinned to one rootfs (Stack) and ordered by Position. Drives
// the CF-level Buildpacks tab. Read-only at this tier — uploads, reorder,
// enable/disable, and lock toggles stay legacy until a use case warrants
// them.
//
// CnsiGUID is stamped server-side so multi-CNSI rows render keyed by
// (cnsi, buildpack) — same convention as StApp/StOrg/StStack. v3-only
// fields (State, Lifecycle) flow through as plain strings; the legacy v2
// shape lacked them.
type StBuildpack struct {
	GUID      string `json:"guid"`
	Name      string `json:"name"`
	State     string `json:"state"`
	Filename  string `json:"filename"`
	Stack     string `json:"stack"`
	Position  int    `json:"position"`
	Lifecycle string `json:"lifecycle"`
	Enabled   bool   `json:"enabled"`
	Locked    bool   `json:"locked"`
	CnsiGUID  string `json:"cnsiGuid"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type StBuildpacksResponse struct {
	Resources    []StBuildpack `json:"resources"`
	TotalResults int           `json:"totalResults"`
}

// StSecurityGroup is the Stratos-shaped DTO for a CF security group.
// Security groups govern egress traffic from app containers; each is a
// named bundle of rules (protocol/destination/ports) that can be flagged
// globally enabled for the running and/or staging lifecycle, and can be
// bound to specific spaces. Drives the CF-level Security Groups tab.
// Read-only at this tier — create/update/delete and space bindings stay
// legacy until a use case warrants them.
//
// CnsiGUID is stamped server-side so multi-CNSI rows render keyed by
// (cnsi, security group). The list view doesn't render full rules; we
// surface aggregate RuleCount + space bind counts so the row stays flat
// and the detail screen (future) owns the rule table.
type StSecurityGroup struct {
	GUID                   string `json:"guid"`
	Name                   string `json:"name"`
	GloballyEnabledRunning bool   `json:"globallyEnabledRunning"`
	GloballyEnabledStaging bool   `json:"globallyEnabledStaging"`
	RuleCount              int    `json:"ruleCount"`
	RunningSpaceCount      int    `json:"runningSpaceCount"`
	StagingSpaceCount      int    `json:"stagingSpaceCount"`
	CnsiGUID               string `json:"cnsiGuid"`
	CreatedAt              string `json:"createdAt"`
	UpdatedAt              string `json:"updatedAt"`
}

type StSecurityGroupsResponse struct {
	Resources    []StSecurityGroup `json:"resources"`
	TotalResults int               `json:"totalResults"`
}

// StFeatureFlag is the Stratos-shaped DTO for a CF feature flag.
// Feature flags govern user-visible affordances (e.g. user_org_creation,
// app_bits_upload) — global on/off switches with optional custom error
// messages shown when a request hits a disabled flag. Drives the
// CF-level Feature Flags tab. Read-only at this tier; toggling a flag
// is a platform-admin operation not surfaced.
//
// Unlike most St* DTOs there is no GUID — name is the identity. There
// is also no created_at; CF tracks only the last update. CnsiGUID is
// stamped server-side so multi-CNSI rendering keys off (cnsi, name).
// CustomErrorMessage and UpdatedAt come through as nullable on the v3
// wire; both are coerced to "" so the wire shape stays flat strings.
type StFeatureFlag struct {
	Name               string `json:"name"`
	Enabled            bool   `json:"enabled"`
	CustomErrorMessage string `json:"customErrorMessage"`
	CnsiGUID           string `json:"cnsiGuid"`
	UpdatedAt          string `json:"updatedAt"`
}

type StFeatureFlagsResponse struct {
	Resources    []StFeatureFlag `json:"resources"`
	TotalResults int             `json:"totalResults"`
}

// StOrgQuota is the Stratos-shaped DTO for a CF organization quota.
// Org quotas cap the apps / services / routes / domains an organization
// can hold across all its spaces. Drives the CF-level Org Quotas tab.
// Read-only at this tier — create/update/delete and apply-to-org stay
// legacy until a use case warrants them.
//
// All limit fields use -1 to signal "unlimited" — the v3 wire shape
// nulls a missing limit, which we coerce to -1 server-side so the
// frontend can render "Unlimited" without null-guarding every cell.
// OrganizationCount is a server-side aggregate of how many orgs this
// quota is currently applied to; the full org list is a future detail-
// screen concern.
type StOrgQuota struct {
	GUID                    string `json:"guid"`
	Name                    string `json:"name"`
	TotalMemoryInMB         int    `json:"totalMemoryInMB"`
	TotalInstanceMemoryInMB int    `json:"totalInstanceMemoryInMB"`
	TotalInstances          int    `json:"totalInstances"`
	TotalAppTasks           int    `json:"totalAppTasks"`
	PaidServicesAllowed     bool   `json:"paidServicesAllowed"`
	TotalServiceInstances   int    `json:"totalServiceInstances"`
	TotalServiceKeys        int    `json:"totalServiceKeys"`
	TotalRoutes             int    `json:"totalRoutes"`
	TotalReservedPorts      int    `json:"totalReservedPorts"`
	TotalDomains            int    `json:"totalDomains"`
	OrganizationCount       int    `json:"organizationCount"`
	CnsiGUID                string `json:"cnsiGuid"`
	CreatedAt               string `json:"createdAt"`
	UpdatedAt               string `json:"updatedAt"`
}

type StOrgQuotasResponse struct {
	Resources    []StOrgQuota `json:"resources"`
	TotalResults int          `json:"totalResults"`
}

// StSpaceQuota is the Stratos-shaped DTO for a CF space quota. Space
// quotas cap apps / services / routes within a single org, optionally
// applied to specific spaces. Drives the CF-level Space Quotas tab.
// Read-only at this tier — create/update/delete and apply-to-spaces
// stay legacy until a use case warrants them.
//
// Mirrors StOrgQuota minus the Domains gate (space quotas don't gate
// domains) plus an OrganizationGUID identifying the parent org.
// Same -1 = "unlimited" convention as StOrgQuota.
type StSpaceQuota struct {
	GUID                    string `json:"guid"`
	Name                    string `json:"name"`
	TotalMemoryInMB         int    `json:"totalMemoryInMB"`
	TotalInstanceMemoryInMB int    `json:"totalInstanceMemoryInMB"`
	TotalInstances          int    `json:"totalInstances"`
	TotalAppTasks           int    `json:"totalAppTasks"`
	PaidServicesAllowed     bool   `json:"paidServicesAllowed"`
	TotalServiceInstances   int    `json:"totalServiceInstances"`
	TotalServiceKeys        int    `json:"totalServiceKeys"`
	TotalRoutes             int    `json:"totalRoutes"`
	TotalReservedPorts      int    `json:"totalReservedPorts"`
	OrganizationGUID        string `json:"organizationGuid"`
	SpaceCount              int    `json:"spaceCount"`
	CnsiGUID                string `json:"cnsiGuid"`
	CreatedAt               string `json:"createdAt"`
	UpdatedAt               string `json:"updatedAt"`
}

type StSpaceQuotasResponse struct {
	Resources    []StSpaceQuota `json:"resources"`
	TotalResults int            `json:"totalResults"`
}

// StAuditEvent is the Stratos-shaped DTO for a CF audit event. Audit
// events are CF's foundation-wide activity log: every successful API
// call leaves a record with actor, target, type, optional space/org
// context, and arbitrary `data`. Drives the CF-level Events tab as
// well as the org / space / app event tabs (which apply per-page
// filters via the signal-config service's basePredicate). Read-only
// — there are no writes to surface.
//
// Two flat columns per nested struct (actor / target / space / org)
// keeps the wire shape friendly to the SignalListComponent table.
// Data is serialized as a JSON string — its shape varies wildly per
// event type and the list view only needs it for "show details"
// expansion; the future detail screen can deserialize as needed.
type StAuditEvent struct {
	GUID             string `json:"guid"`
	Type             string `json:"type"`
	ActorGUID        string `json:"actorGuid"`
	ActorType        string `json:"actorType"`
	ActorName        string `json:"actorName"`
	TargetGUID       string `json:"targetGuid"`
	TargetType       string `json:"targetType"`
	TargetName       string `json:"targetName"`
	SpaceGUID        string `json:"spaceGuid"`
	SpaceName        string `json:"spaceName"`
	OrganizationGUID string `json:"organizationGuid"`
	OrganizationName string `json:"organizationName"`
	Data             string `json:"data"`
	CnsiGUID         string `json:"cnsiGuid"`
	CreatedAt        string `json:"createdAt"`
	UpdatedAt        string `json:"updatedAt"`
}

type StAuditEventsResponse struct {
	Resources    []StAuditEvent `json:"resources"`
	TotalResults int            `json:"totalResults"`
}
