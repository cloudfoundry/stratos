// src/jetstream/plugins/cloudfoundry/native_service_brokers_reads.go
package cloudfoundry

import (
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceBrokers handles GET /pp/v1/cf/service_brokers/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_brokers with four wire-shape
// tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//     Existing legacy shape preserved verbatim.
//   - base     — guid + cnsiGuid + name + url + createdAt. No include chain.
//   - summary  — base + space.{guid,name} + updatedAt. Space refs resolve
//     via one follow-up Spaces().List(?guids=…) batch
//     (/v3/service_brokers rejects ?include=).
//   - details  — summary + labels + annotations.
//
// All non-counts modes emit `_meta.unavailable: ['authUsername']` per row
// because CF v3 never returns broker auth credentials on read — design-time
// tristate that drives the frontend's "Not Available" rendering.
//
// `?guids=<csv>` is a first-class batch branch on top of the tier dispatch
// — used by lazy-fetch consumers that already know the broker GUIDs they
// want. Tier still applies inside the batch branch.
func (c *CloudFoundrySpecification) getNativeServiceBrokers(ctx echo.Context) error {
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
		raw, lerr := cfClient.ServiceBrokers().List(ctx.Request().Context(), params)
		if lerr != nil {
			return handleCapiError(ctx, lerr)
		}
		return ctx.JSON(http.StatusOK, StServiceBrokersResponse{
			Resources:    []StServiceBroker{},
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

	// /v3/service_brokers rejects ?include= and ?fields[] (3.180.0): the
	// list endpoint exposes no joinable relations. For summary+ we drop
	// the include and resolve any space refs via a single follow-up
	// Spaces().List(?guids=…) batch — no-op on the common case where all
	// brokers are global (relationships.space empty).

	raw, lerr := cfClient.ServiceBrokers().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	spaceByGUID := map[string]capi.Space{}
	if mode == ReturnSummary || mode == ReturnDetails {
		spaceByGUID = batchFetchBrokerSpaces(ctx, cfClient, raw.Resources)
	}

	resources := make([]StServiceBroker, 0, len(raw.Resources))
	for _, b := range raw.Resources {
		resources = append(resources, toStServiceBroker(b, cnsiGUID, spaceByGUID, mode))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceBroker]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServiceBrokerDetail handles GET /pp/v1/cf/service_brokers/{cnsiGuid}/{brokerGuid}.
// Single-resource sibling for detail views and guid-keyed lazy fetches.
//
// Single-resource Get can't carry ?include= via the typed CAPI API, so
// summary+ resolves the space ref via a follow-up Spaces.Get — same
// posture as the list path's space batch. One extra round trip,
// soft-fails to a guid-only space ref if the spaces fetch errors.
func (c *CloudFoundrySpecification) getNativeServiceBrokerDetail(ctx echo.Context) error {
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

	broker, gerr := cfClient.ServiceBrokers().Get(ctx.Request().Context(), brokerGUID)
	if gerr != nil {
		return handleCapiError(ctx, gerr)
	}

	mode := parseReturnMode(ctx)
	if mode == ReturnCounts {
		// Counts on a single resource doesn't make sense; treat as base.
		mode = ReturnBase
	}

	spaceByGUID := map[string]capi.Space{}
	if mode == ReturnSummary || mode == ReturnDetails {
		if broker.Relationships.Space != nil {
			if guid := relationshipGUID(*broker.Relationships.Space); guid != "" {
				if s, sErr := cfClient.Spaces().Get(ctx.Request().Context(), guid); sErr == nil {
					spaceByGUID[guid] = *s
				}
			}
		}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceBroker(*broker, cnsiGUID, spaceByGUID, mode))
}

// batchFetchBrokerSpaces collects distinct space GUIDs referenced by the
// given brokers and returns a guid-keyed map of resolved spaces. Used when
// the list endpoint can't carry an include chain (CAPI rejects ?include=
// on /v3/service_brokers). Soft-fail: errors return an empty map and let
// toStServiceBroker emit guid-only space refs.
func batchFetchBrokerSpaces(ctx echo.Context, cfClient capi.Client, brokers []capi.ServiceBroker) map[string]capi.Space {
	out := map[string]capi.Space{}
	guids := []string{}
	seen := map[string]bool{}
	for _, b := range brokers {
		if b.Relationships.Space == nil {
			continue
		}
		g := relationshipGUID(*b.Relationships.Space)
		if g == "" || seen[g] {
			continue
		}
		seen[g] = true
		guids = append(guids, g)
	}
	if len(guids) == 0 {
		return out
	}
	params := capi.NewQueryParams().WithPerPage(len(guids)).WithFilter("guids", guids...)
	raw, err := cfClient.Spaces().List(ctx.Request().Context(), params)
	if err != nil {
		return out
	}
	for _, s := range raw.Resources {
		if s.GUID != "" {
			out[s.GUID] = s
		}
	}
	return out
}

// toStServiceBroker maps a capi.ServiceBroker onto the Stratos-shape DTO at
// the requested tier.
//
// Tier policy:
//   - base:    guid + cnsiGuid + name + url + createdAt
//   - summary: + space.{guid,name} + updatedAt
//   - details: + labels + annotations
//
// All non-base tiers also stamp `_meta.unavailable: ['authUsername']` —
// design-time tristate (CF v3 never returns broker auth on read).
func toStServiceBroker(b capi.ServiceBroker, cnsiGUID string, spaceByGUID map[string]capi.Space, mode ReturnMode) StServiceBroker {
	out := StServiceBroker{
		GUID:      b.GUID,
		CnsiGUID:  cnsiGUID,
		Name:      b.Name,
		URL:       b.URL,
		CreatedAt: b.CreatedAt.Format(time.RFC3339),
	}

	if mode == ReturnBase {
		out.Meta = &StratosMeta{Unavailable: []string{"authUsername"}}
		return out
	}

	// summary tier
	out.UpdatedAt = b.UpdatedAt.Format(time.RFC3339)
	if b.Relationships.Space != nil {
		if guid := relationshipGUID(*b.Relationships.Space); guid != "" {
			ref := &StSpaceRef{GUID: guid}
			if s, ok := spaceByGUID[guid]; ok {
				ref.Name = s.Name
			}
			out.Space = ref
		}
	}

	if mode == ReturnSummary {
		out.Meta = &StratosMeta{Unavailable: []string{"authUsername"}}
		return out
	}

	// details tier
	if b.Metadata != nil {
		out.Labels = normaliseStringMap(b.Metadata.Labels)
		out.Annotations = normaliseStringMap(b.Metadata.Annotations)
	}
	out.Meta = &StratosMeta{Unavailable: []string{"authUsername"}}
	return out
}
