// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads.go
package cloudfoundry

import (
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceOfferings handles GET /pp/v1/cf/service_offerings/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_offerings with four wire-shape
// tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//     Existing legacy shape preserved verbatim — counts probes
//     already wired across the frontend rely on it.
//   - base     — entity fields only; no broker ref. One CAPI call.
//   - summary  — base + broker.{guid,name}. One CAPI call: the
//     `fields[service_broker]` sparse fieldset brings the broker
//     rows back in the v3 `included` block.
//   - details  — summary + offering extended fields (description, tags,
//     requires, documentationUrl, brokerCatalogMetadata,
//     shareable) and broker ref expanded with URL. Same
//     single-call shape as summary.
//
// Broker join soft-fail: a missing or malformed `included` block leaves
// Broker refs guid-only rather than 502'ing the whole marketplace.
func (c *CloudFoundrySpecification) getNativeServiceOfferings(ctx echo.Context) error {
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
		raw, lerr := cfClient.ServiceOfferings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		// Legacy flat-envelope shape kept identical to pre-rework — the
		// frontend counts probe still consumes `{resources, totalResults}`.
		return ctx.JSON(http.StatusOK, struct {
			Resources    []StServiceOffering `json:"resources"`
			TotalResults int                 `json:"totalResults"`
		}{
			Resources:    []StServiceOffering{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	listParams := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	// `fields[service_broker]=guid,name` brings the brokers back in the
	// top-level `included.service_brokers` block in a single CAPI call.
	// The earlier `?include=service_broker` attempt was rejected by
	// CAPI's /v3/service_offerings endpoint (verified on 3.180.0:
	// "Unknown query parameter(s): 'include'" — `include` isn't in the
	// documented param set for this endpoint). `fields` is, and pulls
	// the same join with a sparse fieldset.
	if mode == ReturnSummary || mode == ReturnDetails {
		listParams = listParams.WithFields("service_broker", "guid", "name")
	}
	// Optional space scoping: ?space_guids=g1,g2,... forwards as
	// /v3/service_offerings?space_guids=g1,g2 — used by the
	// add-service-instance wizard's Select Service step to show
	// only the offerings reachable from the wizard's selected space.
	if rawSpaces := ctx.QueryParam("space_guids"); rawSpaces != "" {
		spaces := splitNonEmpty(rawSpaces, ",")
		if len(spaces) > 0 {
			listParams = listParams.WithFilter("space_guids", spaces...)
		}
	}
	rawOfferings, listErr := cfClient.ServiceOfferings().List(ctx.Request().Context(), listParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	offerings := rawOfferings.Resources

	// Broker join only applies for summary+ — base ships without refs.
	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		brokerByGUID = brokersFromIncluded(rawOfferings)
	}

	out := make([]StServiceOffering, 0, len(offerings))
	for _, o := range offerings {
		out = append(out, toStServiceOffering(o, cnsiGUID, brokerByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceOffering]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, rawOfferings.Pagination.TotalResults),
	})
}

// getNativeServiceOfferingDetail handles
//
//	GET /pp/v1/cf/service_offerings/{cnsiGuid}/{offeringGuid}.
//
// Single-resource sibling for the catalog detail page. Same ?return=
// dispatch as the list handler; the detail screen typically requests
// `details` but `summary` and `base` are honored too. Counts mode is not
// meaningful on a single resource; falling back to base behaviour.
//
// Single-resource Get can't carry ?include= via the typed API today, so
// summary+ keeps a single-guid broker fetch via drainBrokersForOfferings.
// Cheap (one extra round trip) and worth keeping until the capi/v3
// client grows include= on Get too.
func (c *CloudFoundrySpecification) getNativeServiceOfferingDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	offeringGUID := ctx.Param("offeringGuid")
	if cnsiGUID == "" || offeringGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and offeringGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	offering, gerr := cfClient.ServiceOfferings().Get(ctx.Request().Context(), offeringGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	// Single-resource Get can't carry ?include= via the typed API, so
	// summary+ keeps the per-detail batched broker fetch. When the
	// fork lands include surfacing on Get too, this collapses.
	mode := parseReturnMode(ctx)
	if mode == ReturnCounts {
		// Counts on a single resource doesn't make sense; treat as base
		// so the response is at least well-formed.
		mode = ReturnBase
	}

	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		brokerByGUID = drainBrokersForOfferings(ctx, cfClient, []capi.ServiceOffering{*offering})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceOffering(*offering, cnsiGUID, brokerByGUID, mode))
}

// getNativeServiceOfferingsForBroker handles
//
//	GET /pp/v1/cf/brokers/{cnsiGuid}/{brokerGuid}/offerings.
//
// Same wire-shape and tier dispatch as the CF-scoped offerings handler — the
// only difference is the path-derived `?service_broker_guids=<guid>` filter.
// CF v3 supports the filter natively on `/v3/service_offerings`, so this is a
// single round trip (plus the `?include=service_broker` join at summary+).
func (c *CloudFoundrySpecification) getNativeServiceOfferingsForBroker(ctx echo.Context) error {
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
		raw, lerr := cfClient.ServiceOfferings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return lerr
		}
		return ctx.JSON(http.StatusOK, struct {
			Resources    []StServiceOffering `json:"resources"`
			TotalResults int                 `json:"totalResults"`
		}{
			Resources:    []StServiceOffering{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present).
		WithFilter("service_broker_guids", brokerGUID)

	// `fields[service_broker]=guid,name` brings the broker rows back in
	// `included.service_brokers` in one call; the include= form is rejected
	// by /v3/service_offerings (3.180.0).
	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithFields("service_broker", "guid", "name")
	}

	raw, listErr := cfClient.ServiceOfferings().List(ctx.Request().Context(), params)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}

	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		brokerByGUID = brokersFromIncluded(raw)
	}

	out := make([]StServiceOffering, 0, len(raw.Resources))
	for _, o := range raw.Resources {
		out = append(out, toStServiceOffering(o, cnsiGUID, brokerByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceOffering]{
		Resources:  out,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// brokersFromIncluded extracts v3's `included.service_brokers` block (set
// by the `fields[service_broker]` join on the offerings list) into a
// guid-keyed map. Soft-fail: a malformed included block logs a warning
// and returns an empty map rather than 502'ing the whole response — same
// defensive posture as the broker drain it replaced.
func brokersFromIncluded(list *capi.ListResponse[capi.ServiceOffering]) map[string]capi.ServiceBroker {
	inc, err := capi.ServiceOfferingIncludedFrom(list)
	if err != nil {
		log.Warnf("service_offerings: could not decode included block: %v", err)
		return map[string]capi.ServiceBroker{}
	}
	return keyByGUID(inc.ServiceBrokers, func(b capi.ServiceBroker) string { return b.GUID })
}

// drainBrokersForOfferings batch-fetches the unique brokers referenced by
// the given offerings. Soft-fail: returns whatever it can resolve; an
// error leaves the map empty and offerings ship with Broker=nil rather
// than 502'ing the whole response. Used only by the single-resource
// detail handler today — the list path reads brokers from v3's
// `included` block via brokersFromIncluded instead.
func drainBrokersForOfferings(ctx echo.Context, cfClient capi.Client, offerings []capi.ServiceOffering) map[string]capi.ServiceBroker {
	brokerGUIDSet := make(map[string]struct{}, len(offerings))
	for _, o := range offerings {
		if guid := relationshipGUID(o.Relationships.ServiceBroker); guid != "" {
			brokerGUIDSet[guid] = struct{}{}
		}
	}
	brokerByGUID := make(map[string]capi.ServiceBroker, len(brokerGUIDSet))
	if len(brokerGUIDSet) == 0 {
		return brokerByGUID
	}
	brokerGUIDs := make([]string, 0, len(brokerGUIDSet))
	for g := range brokerGUIDSet {
		brokerGUIDs = append(brokerGUIDs, g)
	}
	brokerParams := capi.NewQueryParams().
		WithPerPage(len(brokerGUIDs)).
		WithFilter("guids", brokerGUIDs...)
	if raw, berr := cfClient.ServiceBrokers().List(ctx.Request().Context(), brokerParams); berr == nil {
		for _, b := range raw.Resources {
			brokerByGUID[b.GUID] = b
		}
	}
	return brokerByGUID
}

// toStServiceOffering maps a capi.ServiceOffering onto the Stratos-shape
// DTO at the requested tier. cnsiGUID is stamped into each row so the
// frontend can compose multi-CNSI rows + favorites/links keyed by
// (cnsi, offering) without threading the endpoint through every closure
// — same convention as the other St* DTOs.
//
// Tier policy mirrors the frontend type:
//   - base:    guid + cnsiGuid + name + createdAt
//   - summary: + description + tags + available + broker.{guid,name}
//   - details: + requires + documentationUrl + brokerCatalogMetadata +
//     shareable + broker fully expanded (URL etc.)
func toStServiceOffering(o capi.ServiceOffering, cnsiGUID string, brokerByGUID map[string]capi.ServiceBroker, mode ReturnMode) StServiceOffering {
	out := StServiceOffering{
		GUID:      o.GUID,
		CnsiGUID:  cnsiGUID,
		Name:      o.Name,
		CreatedAt: o.CreatedAt.Format(time.RFC3339),
	}

	if mode == ReturnBase {
		return out
	}

	// summary tier
	out.UpdatedAt = o.UpdatedAt.Format(time.RFC3339)
	out.Description = o.Description
	if o.Tags != nil {
		out.Tags = o.Tags
	}
	available := o.Available
	out.Available = &available
	bindable := o.BrokerCatalog.Features.Bindable
	out.Bindable = &bindable

	brokerGUID := relationshipGUID(o.Relationships.ServiceBroker)
	if brokerGUID != "" {
		ref := &StServiceBrokerRef{GUID: brokerGUID}
		if b, ok := brokerByGUID[brokerGUID]; ok {
			ref.Name = b.Name
		}
		out.Broker = ref
	}

	if mode == ReturnSummary {
		return out
	}

	// details tier — expand offering and broker ref
	if o.Requires != nil {
		out.Requires = o.Requires
	}
	if o.DocumentationURL != nil {
		out.DocumentationURL = *o.DocumentationURL
	}
	out.BrokerCatalogMetadata = o.BrokerCatalog.Metadata
	shareable := o.Shareable
	out.Shareable = &shareable

	if out.Broker != nil {
		if b, ok := brokerByGUID[out.Broker.GUID]; ok {
			out.Broker.URL = b.URL
		}
	}

	if o.Metadata != nil {
		out.Labels = normaliseStringMap(o.Metadata.Labels)
		out.Annotations = normaliseStringMap(o.Metadata.Annotations)
	}

	return out
}
