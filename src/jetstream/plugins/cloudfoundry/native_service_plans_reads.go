// src/jetstream/plugins/cloudfoundry/native_service_plans_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServicePlans handles GET /pp/v1/cf/service_plans/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_plans with four wire-shape
// tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//   - base     — guid + cnsiGuid + name + serviceOffering.{guid} + createdAt.
//                One CAPI call, no include chain.
//   - summary  — base + description + free + available + visibilityType +
//                updatedAt + serviceOffering.{name, broker{guid,name}}.
//                One CAPI call with
//                ?include=service_offering,service_offering.service_broker;
//                offerings + brokers come back in the v3 included block and
//                resolve in a single round trip.
//   - details  — summary + costs + schemas + maintenanceInfo + labels +
//                annotations + serviceOffering ref expanded (broker.url etc.).
//
// `?service_offering=<csv>` is a first-class filter on top of the tier
// dispatch — the catalog detail entry that loads plans for one (or a few)
// offerings. Maps to v3's `service_offering_guids` filter.
//
// `?guids=<csv>` is the batch branch used by lazy-fetch consumers that
// already know the plan GUIDs they want.
func (c *CloudFoundrySpecification) getNativeServicePlans(ctx echo.Context) error {
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
		raw, lerr := cfClient.ServicePlans().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServicePlansResponse{
			Resources:    []StServicePlan{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)

	if rawGuids := ctx.QueryParam("guids"); rawGuids != "" {
		guids := splitNonEmpty(rawGuids, ",")
		if len(guids) > 0 {
			params = params.WithFilter("guids", guids...)
		}
	}

	if rawOfferings := ctx.QueryParam("service_offering"); rawOfferings != "" {
		offerings := splitNonEmpty(rawOfferings, ",")
		if len(offerings) > 0 {
			params = params.WithFilter("service_offering_guids", offerings...)
		}
	}

	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude("service_offering", "service_offering.service_broker")
	}

	raw, lerr := cfClient.ServicePlans().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	offeringByGUID := map[string]capi.ServiceOffering{}
	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		offeringByGUID = offeringsFromIncluded(raw.Included)
		brokerByGUID = brokersFromIncluded(raw.Included)
	}

	resources := make([]StServicePlan, 0, len(raw.Resources))
	for _, p := range raw.Resources {
		resources = append(resources, toStServicePlan(p, cnsiGUID, offeringByGUID, brokerByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServicePlan]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServicePlanDetail handles GET /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}.
// Single-resource sibling for detail views and guid-keyed lazy fetches.
//
// Single-resource Get can't carry ?include= via the typed CAPI API, so
// summary+ resolves the offering and broker refs via follow-up batched
// list calls (one for the offering, one for the broker). Soft-fails to
// guid-only refs on error.
func (c *CloudFoundrySpecification) getNativeServicePlanDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	planGUID := ctx.Param("planGuid")
	if cnsiGUID == "" || planGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and planGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	plan, gerr := cfClient.ServicePlans().Get(ctx.Request().Context(), planGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	mode := parseReturnMode(ctx)
	if mode == ReturnCounts {
		mode = ReturnBase
	}

	offeringByGUID := map[string]capi.ServiceOffering{}
	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		if guid := relationshipGUID(plan.Relationships.ServiceOffering); guid != "" {
			if o, oErr := cfClient.ServiceOfferings().Get(ctx.Request().Context(), guid); oErr == nil {
				offeringByGUID[guid] = *o
				if bg := relationshipGUID(o.Relationships.ServiceBroker); bg != "" {
					if b, bErr := cfClient.ServiceBrokers().Get(ctx.Request().Context(), bg); bErr == nil {
						brokerByGUID[bg] = *b
					}
				}
			}
		}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServicePlan(*plan, cnsiGUID, offeringByGUID, brokerByGUID, mode))
}

// offeringsFromIncluded decodes v3's `included.service_offerings` block
// (set by `?include=service_offering[, service_offering.service_broker]`)
// into a guid-keyed map. Soft-fail: malformed entries are skipped silently.
func offeringsFromIncluded(included map[string][]json.RawMessage) map[string]capi.ServiceOffering {
	out := map[string]capi.ServiceOffering{}
	if included == nil {
		return out
	}
	rawOfferings, ok := included["service_offerings"]
	if !ok {
		return out
	}
	for _, raw := range rawOfferings {
		var o capi.ServiceOffering
		if err := json.Unmarshal(raw, &o); err == nil && o.GUID != "" {
			out[o.GUID] = o
		}
	}
	return out
}

// toStServicePlan maps a capi.ServicePlan onto the Stratos-shape DTO at
// the requested tier.
//
// Tier policy:
//   - base:    guid + cnsiGuid + name + serviceOffering.{guid} + createdAt
//   - summary: + description + free + available + visibilityType + updatedAt
//              + serviceOffering.{name, broker{guid,name}}
//              + space.{guid} (visibilityType=space only)
//   - details: + costs + schemas + maintenanceInfo + labels + annotations
//              + serviceOffering ref fully expanded (broker.url etc.)
func toStServicePlan(p capi.ServicePlan, cnsiGUID string, offeringByGUID map[string]capi.ServiceOffering, brokerByGUID map[string]capi.ServiceBroker, mode ReturnMode) StServicePlan {
	out := StServicePlan{
		GUID:      p.GUID,
		CnsiGUID:  cnsiGUID,
		Name:      p.Name,
		CreatedAt: p.CreatedAt.Format(time.RFC3339),
	}

	if guid := relationshipGUID(p.Relationships.ServiceOffering); guid != "" {
		out.ServiceOffering = &StServiceOfferingRef{GUID: guid}
	}

	if mode == ReturnBase {
		return out
	}

	// summary tier
	out.UpdatedAt = p.UpdatedAt.Format(time.RFC3339)
	out.Description = p.Description
	free := p.Free
	out.Free = &free
	available := p.Available
	out.Available = &available
	out.VisibilityType = p.VisibilityType

	if out.ServiceOffering != nil {
		if o, ok := offeringByGUID[out.ServiceOffering.GUID]; ok {
			out.ServiceOffering.Name = o.Name
			if bg := relationshipGUID(o.Relationships.ServiceBroker); bg != "" {
				ref := &StServiceBrokerRef{GUID: bg}
				if b, ok := brokerByGUID[bg]; ok {
					ref.Name = b.Name
				}
				out.ServiceOffering.Broker = ref
			}
		}
	}

	if p.Relationships.Space != nil {
		if guid := relationshipGUID(*p.Relationships.Space); guid != "" {
			out.Space = &StSpaceRef{GUID: guid}
		}
	}

	if mode == ReturnSummary {
		return out
	}

	// details tier
	if len(p.Costs) > 0 {
		costs := make([]StServicePlanCost, 0, len(p.Costs))
		for _, c := range p.Costs {
			costs = append(costs, StServicePlanCost{
				Amount: c.Amount, Currency: c.Currency, Unit: c.Unit,
			})
		}
		out.Costs = costs
	}
	out.Schemas = mapPlanSchemas(p.Schemas)
	if p.MaintenanceInfo != nil {
		out.MaintenanceInfo = &StMaintenanceInfo{
			Version: p.MaintenanceInfo.Version, Description: p.MaintenanceInfo.Description,
		}
	}
	if p.Metadata != nil {
		out.Labels = normaliseStringMap(p.Metadata.Labels)
		out.Annotations = normaliseStringMap(p.Metadata.Annotations)
	}

	// Expand the offering ref's broker leg with URL etc. when the broker
	// row was joined via the include chain (or the per-detail fallback).
	if out.ServiceOffering != nil && out.ServiceOffering.Broker != nil {
		if b, ok := brokerByGUID[out.ServiceOffering.Broker.GUID]; ok {
			out.ServiceOffering.Broker.URL = b.URL
		}
	}

	return out
}

// mapPlanSchemas folds CAPI's plan schemas struct into the Stratos-shape
// DTO. Returns nil when the input is fully empty so consumers can use a
// nil check instead of guarding nested zero-values.
func mapPlanSchemas(s capi.ServicePlanSchemas) *StPlanSchemas {
	hasInstance := len(s.ServiceInstance.Create.Parameters) > 0 || len(s.ServiceInstance.Update.Parameters) > 0
	hasBinding := len(s.ServiceBinding.Create.Parameters) > 0
	if !hasInstance && !hasBinding {
		return nil
	}
	out := &StPlanSchemas{}
	if hasInstance {
		out.ServiceInstance = &StPlanSchemaInstance{}
		if len(s.ServiceInstance.Create.Parameters) > 0 {
			out.ServiceInstance.Create = &StPlanSchemaParams{Parameters: s.ServiceInstance.Create.Parameters}
		}
		if len(s.ServiceInstance.Update.Parameters) > 0 {
			out.ServiceInstance.Update = &StPlanSchemaParams{Parameters: s.ServiceInstance.Update.Parameters}
		}
	}
	if hasBinding {
		out.ServiceBinding = &StPlanSchemaBinding{
			Create: &StPlanSchemaParams{Parameters: s.ServiceBinding.Create.Parameters},
		}
	}
	return out
}

// getNativeServicePlansForBroker handles
//
//	GET /pp/v1/cf/brokers/{cnsiGuid}/{brokerGuid}/plans.
//
// Same wire-shape and tier dispatch as the CF-scoped plans handler — the only
// difference is the path-derived `?service_broker_guids=<guid>` filter. CF v3
// supports the filter natively on `/v3/service_plans`, so this is a single
// round trip (plus the `?include=service_offering[,service_offering.service_broker]`
// chain at summary+).
//
// `?service_offering=<csv>` from the existing query layer also composes when
// callers want plans for a specific (offering ∩ broker) tuple.
func (c *CloudFoundrySpecification) getNativeServicePlansForBroker(ctx echo.Context) error {
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

	if mode == ReturnCounts {
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("service_broker_guids", brokerGUID)
		raw, lerr := cfClient.ServicePlans().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServicePlansResponse{
			Resources:    []StServicePlan{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present).
		WithFilter("service_broker_guids", brokerGUID)

	if rawOfferings := ctx.QueryParam("service_offering"); rawOfferings != "" {
		offerings := splitNonEmpty(rawOfferings, ",")
		if len(offerings) > 0 {
			params = params.WithFilter("service_offering_guids", offerings...)
		}
	}

	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude("service_offering", "service_offering.service_broker")
	}

	raw, lerr := cfClient.ServicePlans().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	offeringByGUID := map[string]capi.ServiceOffering{}
	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		offeringByGUID = offeringsFromIncluded(raw.Included)
		brokerByGUID = brokersFromIncluded(raw.Included)
	}

	resources := make([]StServicePlan, 0, len(raw.Resources))
	for _, p := range raw.Resources {
		resources = append(resources, toStServicePlan(p, cnsiGUID, offeringByGUID, brokerByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServicePlan]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// splitNonEmpty splits s on sep and drops empty tokens — used by the
// `?guids=` / `?service_offering=` parsers so trailing/double commas
// don't translate into empty filter values that CAPI would reject.
func splitNonEmpty(s, sep string) []string {
	parts := strings.Split(s, sep)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
