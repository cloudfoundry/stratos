// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceOfferings handles GET /pp/v1/cf/service_offerings/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_offerings with four wire-shape
// tiers selected by ?return=:
//
//   - counts   — per_page=1 + flat {totalResults} envelope (no resources).
//                Existing legacy shape preserved verbatim — counts probes
//                already wired across the frontend rely on it.
//   - base     — entity fields only; no broker ref. One CAPI call.
//   - summary  — base + broker.{guid,name}. Today: one /v3/service_offerings
//                call plus one batched /v3/service_brokers?guids=… draw
//                because the capi/v3 client doesn't surface the v3
//                response's `included` block (TODO below). When that's
//                fixed the broker join collapses into the same single call
//                via ?include=service_broker.
//   - details  — summary + offering extended fields (description, tags,
//                requires, documentationUrl, brokerCatalogMetadata,
//                shareable) and broker ref expanded with URL. Same
//                two-call shape as summary today.
//
// Per-page broker join: the unique broker GUIDs referenced by THIS page's
// offerings are resolved with one batched /v3/service_brokers?guids=… call
// (bounded by the page's broker-set size). Soft-fail: a broker-list error
// leaves Broker nil rather than 502'ing the whole marketplace.
//
// TODO(capi-fork): the upstream capi/v3 ListResponse[T] type drops the
// `included` block from v3 responses, so ?include=service_broker can't
// substitute for the per-page batch broker fetch yet. See KS memory
// project_capi_fork_reference.md and reference_capi_openapi_spec_include.md
// for the fork plan; once the spec/types model `included`, the broker
// drain here collapses into a single CAPI call and the broker batch goes
// away.
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
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
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
	// `?include=service_broker` brings the joined brokers back in v3's
	// top-level `included` block; capi/v3 surfaces it via
	// ListResponse[T].Included so the entire list+broker join is one
	// CAPI call.
	if mode == ReturnSummary || mode == ReturnDetails {
		listParams = listParams.WithInclude("service_broker")
	}
	rawOfferings, listErr := cfClient.ServiceOfferings().List(ctx.Request().Context(), listParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	offerings := rawOfferings.Resources

	// Broker join only applies for summary+ — base ships without refs.
	brokerByGUID := map[string]capi.ServiceBroker{}
	if mode == ReturnSummary || mode == ReturnDetails {
		brokerByGUID = brokersFromIncluded(rawOfferings.Included)
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

// brokersFromIncluded decodes v3's `included.service_brokers` block (set
// by `?include=service_broker` on the offerings list) into a guid-keyed
// map. Soft-fail: malformed entries are skipped silently rather than
// 502'ing the whole response — same defensive posture as the broker
// drain it replaced.
func brokersFromIncluded(included map[string][]json.RawMessage) map[string]capi.ServiceBroker {
	out := map[string]capi.ServiceBroker{}
	if included == nil {
		return out
	}
	rawBrokers, ok := included["service_brokers"]
	if !ok {
		return out
	}
	for _, raw := range rawBrokers {
		var b capi.ServiceBroker
		if err := json.Unmarshal(raw, &b); err == nil && b.GUID != "" {
			out[b.GUID] = b
		}
	}
	return out
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
//              shareable + broker fully expanded (URL etc.)
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
