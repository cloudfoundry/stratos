package cloudfoundry

// Stratos-shape relationship refs for the services-domain signal+V3
// slice. Each ref is a typed struct that carries `guid` always (base
// tier), `name` populated at summary+, and extended fields populated
// only at details. Refs nest to mirror the V3 include-relation tree
// (`servicePlan.serviceOffering.broker`, `space.organization`, etc.)
// so a handler returning `?return=details` deepens existing nodes
// rather than reshaping the envelope.
//
// Canonical design at
// obsidian-knowledge-store/stratos/plans/2026-05-07-services-domain-signal-v3.md
// (Stratos types section). Old flat-with-suffix StServiceInstance /
// StServiceOffering / StServicePlan / StServiceBroker / StServiceBinding
// in native_types.go remain in place until each handler's rework
// flips its consumers to the new shape, at which point the old type
// is deleted.

// StAppRef is the ref shape for an app referenced by a binding's
// `app` relationship (type=app credential bindings). Empty/absent on
// type=key bindings.
type StAppRef struct {
	GUID string `json:"guid"`
	Name string `json:"name,omitempty"`
}

// StOrgRef is the ref shape for an organization. Carried under
// StSpaceRef.Organization at summary+ so consumers don't need a
// second lookup.
type StOrgRef struct {
	GUID string `json:"guid"`
	Name string `json:"name,omitempty"`
}

// StSpaceRef is the ref shape for a space. At summary+ Organization
// is populated so a list row can render org+space without an extra
// fetch. The full StSpace shape is reserved for the dedicated spaces
// detail endpoint.
type StSpaceRef struct {
	GUID         string    `json:"guid"`
	Name         string    `json:"name,omitempty"`
	Organization *StOrgRef `json:"organization,omitempty"`
}

// StServiceBrokerRef is the ref shape for a service broker. URL is
// details-only. Meta carries design-time tristate (notably
// `_meta.unavailable: ['authUsername']` since v3 never returns broker
// auth credentials on read).
type StServiceBrokerRef struct {
	GUID  string       `json:"guid"`
	Name  string       `json:"name,omitempty"`
	URL   string       `json:"url,omitempty"`
	Space *StSpaceRef  `json:"space,omitempty"`
	Meta  *StratosMeta `json:"_meta,omitempty"`
}

// StServiceOfferingRef is the ref shape for a service offering.
// Description / Tags / Requires / DocumentationURL / BrokerCatalogMetadata
// are details-only. Broker is populated at summary+ via the v3 include
// chain.
type StServiceOfferingRef struct {
	GUID                  string                 `json:"guid"`
	Name                  string                 `json:"name,omitempty"`
	Broker                *StServiceBrokerRef    `json:"broker,omitempty"`
	Description           string                 `json:"description,omitempty"`
	Tags                  []string               `json:"tags,omitempty"`
	Requires              []string               `json:"requires,omitempty"`
	DocumentationURL      string                 `json:"documentationUrl,omitempty"`
	BrokerCatalogMetadata map[string]interface{} `json:"brokerCatalogMetadata,omitempty"`
	Available             *bool                  `json:"available,omitempty"`
	Shareable             *bool                  `json:"shareable,omitempty"`
}

// StServicePlanRef is the ref shape for a service plan. Description /
// VisibilityType / Costs / Schemas / Free are details-only;
// ServiceOffering populates at summary+ via the include chain so a
// list row can render offering name without a separate fetch.
type StServicePlanRef struct {
	GUID            string                `json:"guid"`
	Name            string                `json:"name,omitempty"`
	Free            *bool                 `json:"free,omitempty"`
	ServiceOffering *StServiceOfferingRef `json:"serviceOffering,omitempty"`

	// Details-only:
	Description    string              `json:"description,omitempty"`
	VisibilityType string              `json:"visibilityType,omitempty"`
	Available      *bool               `json:"available,omitempty"`
	Costs          []StServicePlanCost `json:"costs,omitempty"`
	Schemas        *StPlanSchemas      `json:"schemas,omitempty"`
}

// StServiceInstanceRef is the ref shape for a service instance,
// referenced from credential bindings, route bindings, etc. Type is
// populated at summary+ so consumers can branch managed vs
// user-provided in the row UI.
type StServiceInstanceRef struct {
	GUID string `json:"guid"`
	Name string `json:"name,omitempty"`
	Type string `json:"type,omitempty"` // 'managed' | 'user-provided'
}

// StLastOperation mirrors v3's `last_operation` block. Always
// populated when a v3 resource carries one (instances, bindings).
// Empty struct when the upstream resource has no last_operation
// block.
type StLastOperation struct {
	Type        string `json:"type,omitempty"`
	State       string `json:"state,omitempty"`
	Description string `json:"description,omitempty"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
	CreatedAt   string `json:"createdAt,omitempty"`
}

// StMaintenanceInfo mirrors v3's `maintenance_info` field present on
// service instances and service plans. Drives upgrade-available
// prompts on the detail page. Pointer so absence is distinguishable
// from `{"":""}`.
type StMaintenanceInfo struct {
	Version     string `json:"version,omitempty"`
	Description string `json:"description,omitempty"`
}

// StPlanSchemas mirrors v3's plan `schemas` field — the JSON-Schema
// blobs the broker advertises for create / update / bind parameter
// validation. Surfaced at details only; the bind stepper consumes
// these to drive parameter form generation.
type StPlanSchemas struct {
	ServiceInstance *StPlanSchemaInstance `json:"serviceInstance,omitempty"`
	ServiceBinding  *StPlanSchemaBinding  `json:"serviceBinding,omitempty"`
}

type StPlanSchemaInstance struct {
	Create *StPlanSchemaParams `json:"create,omitempty"`
	Update *StPlanSchemaParams `json:"update,omitempty"`
}

type StPlanSchemaBinding struct {
	Create *StPlanSchemaParams `json:"create,omitempty"`
}

type StPlanSchemaParams struct {
	Parameters map[string]interface{} `json:"parameters,omitempty"`
}
