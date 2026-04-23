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
	TotalResults int `json:"totalResults"`
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
	GUID       string `json:"guid"`
	URL        string `json:"url"`
	Host       string `json:"host"`
	Path       string `json:"path"`
	Port       *int   `json:"port,omitempty"`
	DomainGUID string `json:"domainGuid"`
	SpaceGUID  string `json:"spaceGuid"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
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
