// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads.go
package cloudfoundry

import (
	"context"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceOfferings handles GET /pp/v1/cf/service_offerings/{cnsiGuid}.
//
// Returns every service offering visible to the user — the catalog of service
// types advertised by every connected service broker — joined with the broker
// name. Drives the Stratos marketplace list page.
//
// Two response shapes, dispatched on ?return=
//   - summary: Stratos-shape paged response (StratosPagedResponse[StServiceOffering]).
//     Used by CnsiServiceOfferingsSource via the CnsiEntitySource base class,
//     which expects a `pagination` envelope to determine when to stop paging.
//     Catalogs are small enough that we drain CAPI server-side and synthesise a
//     single-page response — no genuine summary-tier paging is implemented.
//   - (none): flat StServiceOfferingsResponse with totalResults only. Reserved
//     for future direct callers that don't need pagination meta.
//
// Two-step join, mirroring native_service_bindings_reads.go:
//   1. /v3/service_offerings — drain all pages.
//   2. /v3/service_brokers?guids={…collected unique broker GUIDs…} — one
//      batched fetch. CF v3 ListResponse doesn't model the `included`
//      response field, so include= won't help; the explicit follow-up
//      gives the same result with one extra round-trip.
//
// If the broker fetch fails the handler still returns 200 with offering-level
// fields intact — BrokerName falls back to empty string and the UI renders
// the cell blank rather than a hard error. CF's catalog includes a free
// service-broker reference per offering, so a transient broker-list 502
// shouldn't block the marketplace.
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

	offerings, err := listAllServiceOfferings(ctx.Request().Context(), cfClient)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	// Collect the unique broker GUIDs referenced by these offerings.
	brokerGUIDSet := make(map[string]struct{}, len(offerings))
	for _, o := range offerings {
		if guid := relationshipGUID(o.Relationships.ServiceBroker); guid != "" {
			brokerGUIDSet[guid] = struct{}{}
		}
	}
	brokerGUIDs := make([]string, 0, len(brokerGUIDSet))
	for g := range brokerGUIDSet {
		brokerGUIDs = append(brokerGUIDs, g)
	}

	// Batch-fetch brokers so the picker can display names. Failure here is
	// soft — the cell falls back to an empty broker name rather than 502'ing
	// the whole marketplace on a transient broker-list error.
	brokerByGUID := make(map[string]capi.ServiceBroker, len(brokerGUIDs))
	if len(brokerGUIDs) > 0 {
		brokerParams := capi.NewQueryParams().
			WithPerPage(fullPagePerRequest).
			WithFilter("guids", brokerGUIDs...)
		if raw, listErr := cfClient.ServiceBrokers().List(ctx.Request().Context(), brokerParams); listErr == nil {
			for _, b := range raw.Resources {
				brokerByGUID[b.GUID] = b
			}
		}
	}

	out := make([]StServiceOffering, 0, len(offerings))
	for _, o := range offerings {
		out = append(out, toStServiceOffering(o, cnsiGUID, brokerByGUID))
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "summary" {
		// Synthesise a single-page Stratos paged response. The CnsiEntitySource
		// base class drives pagination by walking until pagination.next is null
		// — we drain CAPI server-side and emit one fully-populated page so the
		// frontend's first iteration completes the load. No-second-page = nil
		// next link = source flips done=true.
		response := StratosPagedResponse[StServiceOffering]{
			Resources:  out,
			Pagination: BuildPaginationMeta(ctx, 1, len(out), len(out)),
		}
		return ctx.JSON(http.StatusOK, response)
	}

	return ctx.JSON(http.StatusOK, StServiceOfferingsResponse{
		Resources:    out,
		TotalResults: len(out),
	})
}

// listAllServiceOfferings drains /v3/service_offerings and returns the full
// set. Unlike apps/orgs/spaces/routes the marketplace catalog is small enough
// that we don't bother with parallel page fetches — sequential pagination
// keeps the code simple and CAPI happy. Mirrors the bindings drain shape.
func listAllServiceOfferings(ctx context.Context, cfClient capi.Client) ([]capi.ServiceOffering, error) {
	all := make([]capi.ServiceOffering, 0)
	page := 1
	for {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		raw, err := cfClient.ServiceOfferings().List(ctx, params)
		if err != nil {
			return nil, err
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || raw.Pagination.Next.Href == "" {
			break
		}
		page++
	}
	return all, nil
}

// toStServiceOffering maps a capi.ServiceOffering onto the Stratos-shape DTO.
// cnsiGUID is stamped into each row so the frontend can compose multi-CNSI
// rows + key favorites/links by (cnsi, offering) without threading the
// endpoint through every closure — same convention as the other St* DTOs.
//
// Tags is normalised to a non-nil slice so JSON marshals as `[]` rather than
// `null` for offerings the broker tagged with nothing.
func toStServiceOffering(o capi.ServiceOffering, cnsiGUID string, brokerByGUID map[string]capi.ServiceBroker) StServiceOffering {
	brokerGUID := relationshipGUID(o.Relationships.ServiceBroker)
	brokerName := ""
	if b, ok := brokerByGUID[brokerGUID]; ok {
		brokerName = b.Name
	}
	tags := o.Tags
	if tags == nil {
		tags = []string{}
	}
	return StServiceOffering{
		GUID:        o.GUID,
		Name:        o.Name,
		Description: o.Description,
		BrokerName:  brokerName,
		Tags:        tags,
		Public:      o.Available,
		CnsiGUID:    cnsiGUID,
		CreatedAt:   o.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   o.UpdatedAt.Format(time.RFC3339),
	}
}
