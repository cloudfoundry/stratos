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
