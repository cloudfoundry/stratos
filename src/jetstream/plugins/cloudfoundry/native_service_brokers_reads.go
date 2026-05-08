// src/jetstream/plugins/cloudfoundry/native_service_brokers_reads.go
package cloudfoundry

import (
	"encoding/json"
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
//                Existing legacy shape preserved verbatim.
//   - base     — guid + cnsiGuid + name + url + createdAt. No include chain.
//   - summary  — base + space.{guid,name} + updatedAt. One CAPI call with
//                ?include=space; the included spaces are decoded from the
//                v3 `included` block (no second round-trip).
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

	// `?include=space` brings space refs back in v3's `included` block at
	// summary+. Empty result sets stay empty — the include is harmless on
	// global-only deployments.
	if mode == ReturnSummary || mode == ReturnDetails {
		params = params.WithInclude("space")
	}

	raw, lerr := cfClient.ServiceBrokers().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	spaceByGUID := map[string]capi.Space{}
	if mode == ReturnSummary || mode == ReturnDetails {
		spaceByGUID = spacesFromIncluded(raw.Included)
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
// summary+ resolves the space ref via a follow-up Spaces.Get rather than
// the included-block decode the list path uses. One extra round trip,
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

// spacesFromIncluded decodes v3's `included.spaces` block into a guid-keyed
// map. Soft-fail: malformed entries are skipped silently rather than 502'ing
// the whole response — mirrors brokersFromIncluded.
func spacesFromIncluded(included map[string][]json.RawMessage) map[string]capi.Space {
	out := map[string]capi.Space{}
	if included == nil {
		return out
	}
	rawSpaces, ok := included["spaces"]
	if !ok {
		return out
	}
	for _, raw := range rawSpaces {
		var s capi.Space
		if err := json.Unmarshal(raw, &s); err == nil && s.GUID != "" {
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
