// src/jetstream/plugins/cloudfoundry/native_types.go
package cloudfoundry

// Stratos-shaped response DTOs for native CF routes.
// These are our clean contract — not bound by CF v2 or v3 shape.
// Version communicated via X-Stratos-Schema-Version response header.

type StOrg struct {
	GUID        string            `json:"guid"`
	Name        string            `json:"name"`
	Status      string            `json:"status"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   string            `json:"createdAt"`
	UpdatedAt   string            `json:"updatedAt"`
}

type StApp struct {
	GUID      string       `json:"guid"`
	Name      string       `json:"name"`
	State     string       `json:"state"`
	SpaceGUID string       `json:"spaceGuid"`
	OrgGUID   *string      `json:"orgGuid,omitempty"`
	Instances int          `json:"instances"`
	Memory    *int         `json:"memory,omitempty"`
	DiskQuota *int         `json:"diskQuota,omitempty"`
	CreatedAt string       `json:"createdAt"`
	UpdatedAt string       `json:"updatedAt"`
	Meta      *StratosMeta `json:"_meta,omitempty"`
}

type StSpace struct {
	GUID      string `json:"guid"`
	Name      string `json:"name"`
	OrgGUID   string `json:"orgGuid"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type StOrgDetail struct {
	StOrg
	Spaces []StSpace `json:"spaces"`
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

// StServiceBinding is the Stratos-shaped DTO for a CF service credential
// binding attached to an app. Used by the delete-app picker and future
// service-binding management UIs.
//
// `serviceInstanceName` is populated by a second fetch of /v3/service_instances
// filtered on the collected SI GUIDs — the frontend displays the instance
// name, not the GUID, so the picker can render "database-primary" instead of
// "3f9a2b1c-...". `serviceInstanceType` ("managed" or "user-provided") lets
// the UI display a badge or warn about broker-dependent unbind timing.
type StServiceBinding struct {
	GUID                string `json:"guid"`
	Name                string `json:"name"`
	BindingType         string `json:"bindingType"` // "app" or "key" — picker only lists "app"
	AppGUID             string `json:"appGuid,omitempty"`
	ServiceInstanceGUID string `json:"serviceInstanceGuid"`
	ServiceInstanceName string `json:"serviceInstanceName"`
	ServiceInstanceType string `json:"serviceInstanceType"` // "managed" or "user-provided"
	CreatedAt           string `json:"createdAt"`
	UpdatedAt           string `json:"updatedAt"`
}

type StAppServiceBindingsResponse struct {
	Resources    []StServiceBinding `json:"resources"`
	TotalResults int                `json:"totalResults"`
}

type StSpacesResponse struct {
	Resources    []StSpace `json:"resources"`
	TotalResults int       `json:"totalResults"`
}

// StServiceOffering is the Stratos-shaped DTO for a CF service offering — i.e.
// a catalog entry advertised by a service broker, NOT an instantiated service.
// Drives the marketplace list page.
//
// Public is sourced from CF's `available` field — the legacy term used in the
// 481 Stratos UI was "Public" (the offering is visible/usable across the
// foundation). BrokerName is populated by a second-pass batch fetch of
// /v3/service_brokers filtered on the collected broker GUIDs (mirrors the
// service-bindings join). Tags retain the broker-provided list verbatim;
// the UI joins them as comma-separated text.
type StServiceOffering struct {
	GUID        string   `json:"guid"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	BrokerName  string   `json:"brokerName"`
	Tags        []string `json:"tags"`
	Public      bool     `json:"public"`
	CnsiGUID    string   `json:"cnsiGuid"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
}

type StServiceOfferingsResponse struct {
	Resources    []StServiceOffering `json:"resources"`
	TotalResults int                 `json:"totalResults"`
}

// StServiceInstance is the Stratos-shaped DTO for an instantiated CF service —
// either a managed instance broker-provisioned from a /v3/service_plans
// catalog entry or a user-provided instance representing an external service
// the platform doesn't manage. Drives the /services list page.
//
// Type carries the CF v3 discriminator ("managed" or "user-provided"). For
// managed instances the handler runs a two-step join (service_plan ->
// service_offering) to populate ServiceOfferingName so the UI can render
// the offering name (e.g. "redis") instead of a plan GUID. User-provided
// instances have neither plan nor offering — those fields stay empty and
// the UI labels the row "User Provided" instead.
//
// LastOp* mirrors CF's last_operation block; the UI surfaces State as a
// pill (succeeded / in progress / failed). Tags is normalised to a non-nil
// slice so the JSON payload always emits `[]` rather than `null` and the
// frontend can `.join(',')` without a guard.
type StServiceInstance struct {
	GUID                string   `json:"guid"`
	Name                string   `json:"name"`
	Type                string   `json:"type"`
	CnsiGUID            string   `json:"cnsiGuid"`
	SpaceGUID           string   `json:"spaceGuid,omitempty"`
	ServicePlanGUID     string   `json:"servicePlanGuid,omitempty"`
	ServiceOfferingGUID string   `json:"serviceOfferingGuid,omitempty"`
	ServiceOfferingName string   `json:"serviceOfferingName,omitempty"`
	Tags                []string `json:"tags"`
	DashboardURL        string   `json:"dashboardUrl,omitempty"`
	LastOpType          string   `json:"lastOpType,omitempty"`
	LastOpState         string   `json:"lastOpState,omitempty"`
	LastOpDescription   string   `json:"lastOpDescription,omitempty"`
	LastOpUpdatedAt     string   `json:"lastOpUpdatedAt,omitempty"`
	CreatedAt           string   `json:"createdAt"`
	UpdatedAt           string   `json:"updatedAt,omitempty"`
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
