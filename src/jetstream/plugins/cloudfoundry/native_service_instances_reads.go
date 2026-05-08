// src/jetstream/plugins/cloudfoundry/native_service_instances_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceInstances handles GET /pp/v1/cf/service_instances/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_instances with four wire-shape
// tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//   - base     — guid + cnsiGuid + name + type + tags + lastOperation +
//                space.{guid} + servicePlan.{guid} (managed) + createdAt.
//                One CAPI call, no include chain.
//   - summary  — base + dashboardUrl/syslogDrainUrl/routeServiceUrl as
//                applicable + space.{name, organization{guid,name}} +
//                servicePlan.{name, free, serviceOffering{guid, name,
//                broker{guid,name}}} + updatedAt. One CAPI call with
//                ?include=service_plan,service_plan.service_offering,
//                service_plan.service_offering.service_broker,space,
//                space.organization; everything resolves from the v3
//                included block in a single round-trip.
//   - details  — summary + maintenanceInfo + upgradeAvailable + labels +
//                annotations + servicePlan / offering / broker fully
//                expanded.
//
// CF v3 returns both managed and user-provided instances in the same list.
// The handler stamps the type discriminator onto the row so the UI can
// label/colour them differently. UPS rows omit `servicePlan` (genuinely
// doesn't apply for `type=user-provided`).
//
// Cross-entity counts (e.g. bound-app count) are NOT wire fields — the
// frontend derives them from the loaded credential-bindings signal
// filtered per instance. The pre-slice handler ran a paginated drain over
// /v3/service_credential_bindings to populate boundAppCount; that drain
// is retired here in favour of the contracted derivation.
func (c *CloudFoundrySpecification) getNativeServiceInstances(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	mode := parseReturnMode(ctx)

	if mode == ReturnCounts {
		params := capi.NewQueryParams().WithPerPage(1)
		raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServiceInstancesResponse{
			Resources:    []StServiceInstance{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)

	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude(
			"service_plan",
			"service_plan.service_offering",
			"service_plan.service_offering.service_broker",
			"space",
			"space.organization",
		)
	}

	raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resolved := resolveInstanceIncludes(raw.Included, mode)

	out := make([]StServiceInstance, 0, len(raw.Resources))
	for _, si := range raw.Resources {
		out = append(out, toStServiceInstance(si, cnsiGUID, resolved, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceInstance]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// instanceIncludes bundles the four guid-keyed maps decoded from the
// v3 `included` block on a service-instances list response. Empty
// maps when the include chain is absent (base mode) or when the
// upstream returns nothing — toStServiceInstance falls back to
// guid-only refs.
type instanceIncludes struct {
	plans     map[string]capi.ServicePlan
	offerings map[string]capi.ServiceOffering
	brokers   map[string]capi.ServiceBroker
	spaces    map[string]capi.Space
	orgs      map[string]capi.Organization
}

func resolveInstanceIncludes(included map[string][]json.RawMessage, mode ReturnMode) instanceIncludes {
	out := instanceIncludes{
		plans:     map[string]capi.ServicePlan{},
		offerings: map[string]capi.ServiceOffering{},
		brokers:   map[string]capi.ServiceBroker{},
		spaces:    map[string]capi.Space{},
		orgs:      map[string]capi.Organization{},
	}
	if mode == ReturnBase || included == nil {
		return out
	}
	out.plans = plansFromIncluded(included)
	out.offerings = offeringsFromIncluded(included)
	out.brokers = brokersFromIncluded(included)
	out.spaces = spacesFromIncluded(included)
	out.orgs = orgsFromIncluded(included)
	return out
}

// getNativeServiceInstanceDetail handles GET /pp/v1/cf/service_instances/{cnsiGuid}/{instanceGuid}.
// Single-resource sibling for detail views.
//
// Single-resource Get can't carry ?include= via the typed CAPI API today,
// so summary+ resolves the chain via per-detail follow-up Gets. Each
// follow-up is soft-fail: errors leave the corresponding ref in
// guid-only form rather than 502'ing the whole response.
func (c *CloudFoundrySpecification) getNativeServiceInstanceDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	instanceGUID := ctx.Param("instanceGuid")
	if cnsiGUID == "" || instanceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and instanceGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	si, gerr := cfClient.ServiceInstances().Get(ctx.Request().Context(), instanceGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	mode := parseReturnMode(ctx)
	if mode == ReturnCounts {
		mode = ReturnBase
	}

	resolved := instanceIncludes{
		plans:     map[string]capi.ServicePlan{},
		offerings: map[string]capi.ServiceOffering{},
		brokers:   map[string]capi.ServiceBroker{},
		spaces:    map[string]capi.Space{},
		orgs:      map[string]capi.Organization{},
	}
	if mode == ReturnSummary || mode == ReturnDetails {
		// space → org chain
		if guid := relationshipGUID(si.Relationships.Space); guid != "" {
			if s, sErr := cfClient.Spaces().Get(ctx.Request().Context(), guid); sErr == nil {
				resolved.spaces[guid] = *s
				if og := relationshipGUID(s.Relationships.Organization); og != "" {
					if o, oErr := cfClient.Organizations().Get(ctx.Request().Context(), og); oErr == nil {
						resolved.orgs[og] = *o
					}
				}
			}
		}
		// plan → offering → broker chain (managed only)
		if si.Relationships.ServicePlan != nil {
			if pg := relationshipGUID(*si.Relationships.ServicePlan); pg != "" {
				if p, pErr := cfClient.ServicePlans().Get(ctx.Request().Context(), pg); pErr == nil {
					resolved.plans[pg] = *p
					if og := relationshipGUID(p.Relationships.ServiceOffering); og != "" {
						if o, oErr := cfClient.ServiceOfferings().Get(ctx.Request().Context(), og); oErr == nil {
							resolved.offerings[og] = *o
							if bg := relationshipGUID(o.Relationships.ServiceBroker); bg != "" {
								if b, bErr := cfClient.ServiceBrokers().Get(ctx.Request().Context(), bg); bErr == nil {
									resolved.brokers[bg] = *b
								}
							}
						}
					}
				}
			}
		}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceInstance(*si, cnsiGUID, resolved, mode))
}

// plansFromIncluded decodes v3's `included.service_plans` block.
func plansFromIncluded(included map[string][]json.RawMessage) map[string]capi.ServicePlan {
	out := map[string]capi.ServicePlan{}
	if included == nil {
		return out
	}
	rawPlans, ok := included["service_plans"]
	if !ok {
		return out
	}
	for _, raw := range rawPlans {
		var p capi.ServicePlan
		if err := json.Unmarshal(raw, &p); err == nil && p.GUID != "" {
			out[p.GUID] = p
		}
	}
	return out
}

// orgsFromIncluded decodes v3's `included.organizations` block.
func orgsFromIncluded(included map[string][]json.RawMessage) map[string]capi.Organization {
	out := map[string]capi.Organization{}
	if included == nil {
		return out
	}
	rawOrgs, ok := included["organizations"]
	if !ok {
		return out
	}
	for _, raw := range rawOrgs {
		var o capi.Organization
		if err := json.Unmarshal(raw, &o); err == nil && o.GUID != "" {
			out[o.GUID] = o
		}
	}
	return out
}

// toStServiceInstance maps a capi.ServiceInstance onto the Stratos-shape
// DTO at the requested tier.
//
// Tier policy mirrors the doc on StServiceInstance.
func toStServiceInstance(si capi.ServiceInstance, cnsiGUID string, inc instanceIncludes, mode ReturnMode) StServiceInstance {
	tags := si.Tags
	if tags == nil {
		tags = []string{}
	}

	out := StServiceInstance{
		GUID:          si.GUID,
		CnsiGUID:      cnsiGUID,
		Name:          si.Name,
		Type:          si.Type,
		Tags:          tags,
		LastOperation: mapLastOperation(si.LastOperation),
		CreatedAt:     si.CreatedAt.Format(time.RFC3339),
	}

	if guid := relationshipGUID(si.Relationships.Space); guid != "" {
		out.Space = &StSpaceRef{GUID: guid}
	}
	if si.Relationships.ServicePlan != nil {
		if guid := relationshipGUID(*si.Relationships.ServicePlan); guid != "" {
			out.ServicePlan = &StServicePlanRef{GUID: guid}
		}
	}

	if mode == ReturnBase {
		return out
	}

	// summary tier
	if !si.UpdatedAt.IsZero() {
		out.UpdatedAt = si.UpdatedAt.Format(time.RFC3339)
	}
	if si.DashboardURL != nil {
		out.DashboardURL = *si.DashboardURL
	}
	if si.SyslogDrainURL != nil {
		out.SyslogDrainURL = *si.SyslogDrainURL
	}
	if si.RouteServiceURL != nil {
		out.RouteServiceURL = *si.RouteServiceURL
	}

	if out.Space != nil {
		if s, ok := inc.spaces[out.Space.GUID]; ok {
			out.Space.Name = s.Name
			if og := relationshipGUID(s.Relationships.Organization); og != "" {
				ref := &StOrgRef{GUID: og}
				if o, ok := inc.orgs[og]; ok {
					ref.Name = o.Name
				}
				out.Space.Organization = ref
			}
		}
	}

	if out.ServicePlan != nil {
		if p, ok := inc.plans[out.ServicePlan.GUID]; ok {
			out.ServicePlan.Name = p.Name
			free := p.Free
			out.ServicePlan.Free = &free
			if og := relationshipGUID(p.Relationships.ServiceOffering); og != "" {
				offRef := &StServiceOfferingRef{GUID: og}
				if o, ok := inc.offerings[og]; ok {
					offRef.Name = o.Name
					if bg := relationshipGUID(o.Relationships.ServiceBroker); bg != "" {
						brokerRef := &StServiceBrokerRef{GUID: bg}
						if b, ok := inc.brokers[bg]; ok {
							brokerRef.Name = b.Name
						}
						offRef.Broker = brokerRef
					}
				}
				out.ServicePlan.ServiceOffering = offRef
			}
		}
	}

	if mode == ReturnSummary {
		return out
	}

	// details tier
	if si.MaintenanceInfo != nil {
		out.MaintenanceInfo = &StMaintenanceInfo{
			Version: si.MaintenanceInfo.Version, Description: si.MaintenanceInfo.Description,
		}
	}
	upgrade := si.UpgradeAvailable
	out.UpgradeAvailable = &upgrade
	if si.Metadata != nil {
		out.Labels = normaliseStringMap(si.Metadata.Labels)
		out.Annotations = normaliseStringMap(si.Metadata.Annotations)
	}

	// Expand offering / broker / space refs the include chain didn't fill.
	if out.ServicePlan != nil && out.ServicePlan.ServiceOffering != nil {
		if o, ok := inc.offerings[out.ServicePlan.ServiceOffering.GUID]; ok {
			if o.Description != "" {
				out.ServicePlan.ServiceOffering.Description = o.Description
			}
			if len(o.Tags) > 0 {
				out.ServicePlan.ServiceOffering.Tags = o.Tags
			}
		}
		if out.ServicePlan.ServiceOffering.Broker != nil {
			if b, ok := inc.brokers[out.ServicePlan.ServiceOffering.Broker.GUID]; ok {
				out.ServicePlan.ServiceOffering.Broker.URL = b.URL
			}
		}
	}

	return out
}

// getNativeServiceInstancesForSpace handles
//
//	GET /pp/v1/cf/spaces/{cnsiGuid}/{spaceGuid}/service_instances.
//
// Same wire-shape and tier dispatch as the CF-scoped list handler — the only
// differences are the path-derived `?space_guids=<guid>` filter and the
// validation of `spaceGuid`. CF v3 supports the filter natively on
// `/v3/service_instances` so this is a single round trip (plus the `?include=`
// chain at summary+).
//
// `?guids=<csv>` and `type=` query filters layer on top of the path filter
// when callers narrow further (e.g. managed-only on a space-services tab).
func (c *CloudFoundrySpecification) getNativeServiceInstancesForSpace(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	spaceGUID := ctx.Param("spaceGuid")
	if cnsiGUID == "" || spaceGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and spaceGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	mode := parseReturnMode(ctx)

	if mode == ReturnCounts {
		params := capi.NewQueryParams().WithPerPage(1).WithFilter("space_guids", spaceGUID)
		raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServiceInstancesResponse{
			Resources:    []StServiceInstance{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present).
		WithFilter("space_guids", spaceGUID)

	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude(
			"service_plan",
			"service_plan.service_offering",
			"service_plan.service_offering.service_broker",
			"space",
			"space.organization",
		)
	}

	raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resolved := resolveInstanceIncludes(raw.Included, mode)

	out := make([]StServiceInstance, 0, len(raw.Resources))
	for _, si := range raw.Resources {
		out = append(out, toStServiceInstance(si, cnsiGUID, resolved, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceInstance]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServiceInstancesForBroker handles
//
//	GET /pp/v1/cf/brokers/{cnsiGuid}/{brokerGuid}/service_instances.
//
// Managed-only by construction (UPS instances aren't bound to a broker). CF
// v3's `/v3/service_instances` doesn't model a `service_broker_guids` filter
// directly — the path traversal is broker → plans → instances. So this
// handler runs a two-step composition:
//
//  1. List `/v3/service_plans?service_broker_guids=<broker>&per_page=5000`
//     to collect the broker's plan GUIDs (ID-only, no include chain).
//  2. List `/v3/service_instances?service_plan_guids=<csv>&include=…` at the
//     requested tier.
//
// Soft-fail on the plan probe: if the broker has no plans, the response is
// an empty page (no instances possible). The plan probe never paginates —
// brokers with > 5000 plans are pathological; we accept that bound.
//
// TODO(capi-fork): a `service_broker_guids` filter on `/v3/service_instances`
// would collapse this to one CAPI call. Worth probing CF v3 server-side as a
// generic improvement (see KS reference_capi_openapi_spec_include.md).
func (c *CloudFoundrySpecification) getNativeServiceInstancesForBroker(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	brokerGUID := ctx.Param("brokerGuid")
	if cnsiGUID == "" || brokerGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and brokerGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	mode := parseReturnMode(ctx)

	planGUIDs, plansErr := listPlanGUIDsForBroker(ctx, cfClient, brokerGUID)
	if plansErr != nil {
		return handleCapiError(ctx, plansErr)
	}

	if mode == ReturnCounts {
		if len(planGUIDs) == 0 {
			return ctx.JSON(http.StatusOK, StServiceInstancesResponse{
				Resources:    []StServiceInstance{},
				TotalResults: 0,
			})
		}
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("service_plan_guids", planGUIDs...)
		raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServiceInstancesResponse{
			Resources:    []StServiceInstance{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)

	if len(planGUIDs) == 0 {
		return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceInstance]{
			Resources:  []StServiceInstance{},
			Pagination: BuildPaginationMeta(ctx, page, perPage, 0),
		})
	}

	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present).
		WithFilter("service_plan_guids", planGUIDs...)

	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude(
			"service_plan",
			"service_plan.service_offering",
			"service_plan.service_offering.service_broker",
			"space",
			"space.organization",
		)
	}

	raw, lerr := cfClient.ServiceInstances().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resolved := resolveInstanceIncludes(raw.Included, mode)

	out := make([]StServiceInstance, 0, len(raw.Resources))
	for _, si := range raw.Resources {
		out = append(out, toStServiceInstance(si, cnsiGUID, resolved, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceInstance]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// listPlanGUIDsForBroker fetches the plan GUIDs owned by a broker via
// `/v3/service_plans?service_broker_guids=<broker>`. Used by
// getNativeServiceInstancesForBroker to translate the broker scope into a
// `service_plan_guids` filter on instances.
//
// per_page=5000 caps the probe at one page — pathologically large brokers
// would need pagination, but in practice broker plan counts are well under
// 100. Returns an empty slice (not error) when the broker has no plans.
func listPlanGUIDsForBroker(ctx echo.Context, cfClient capi.Client, brokerGUID string) ([]string, error) {
	params := capi.NewQueryParams().
		WithPerPage(5000).
		WithFilter("service_broker_guids", brokerGUID)
	raw, err := cfClient.ServicePlans().List(ctx.Request().Context(), params)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(raw.Resources))
	for _, p := range raw.Resources {
		if p.GUID != "" {
			out = append(out, p.GUID)
		}
	}
	return out, nil
}

func mapLastOperation(lo *capi.ServiceInstanceLastOperation) *StLastOperation {
	if lo == nil {
		return nil
	}
	out := &StLastOperation{
		Type:        lo.Type,
		State:       lo.State,
		Description: lo.Description,
	}
	if lo.UpdatedAt != nil {
		out.UpdatedAt = lo.UpdatedAt.Format(time.RFC3339)
	}
	if lo.CreatedAt != nil {
		out.CreatedAt = lo.CreatedAt.Format(time.RFC3339)
	}
	return out
}
