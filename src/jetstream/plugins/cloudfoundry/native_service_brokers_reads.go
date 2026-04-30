// src/jetstream/plugins/cloudfoundry/native_service_brokers_reads.go
package cloudfoundry

import (
	"net/http"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceBrokers handles GET /pp/v1/cf/service_brokers/{cnsiGuid}.
//
// Mirrors the service-plans reads vertical: bounded pagination with a
// single CAPI call per request, ?guids= as a first-class batch branch,
// and a ?return=counts fast path. No auto-drain.
//
//   - ?return=counts                — per_page=1, total only.
//   - ?guids=<comma-list>           — single CAPI call with v3 `guids`
//                                     filter; returns just those brokers.
//   - ?per_page=N&page=M (default)  — single CAPI page; per_page defaults
//                                     to 50 and page to 1 when absent.
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

	if ctx.QueryParam("return") == "counts" {
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

	raw, lerr := cfClient.ServiceBrokers().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resources := make([]StServiceBroker, 0, len(raw.Resources))
	for _, b := range raw.Resources {
		resources = append(resources, toStServiceBroker(b, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServiceBroker]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServiceBrokerDetail handles GET /pp/v1/cf/service_brokers/{cnsiGuid}/{brokerGuid}.
// Single-resource sibling for detail views and guid-keyed lazy fetches.
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

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceBroker(*broker, cnsiGUID))
}

// toStServiceBroker flattens a capi.ServiceBroker into the Stratos-shape DTO.
// Drops nested relationships and metadata in favour of flat fields per
// the wire-contract baseline.
func toStServiceBroker(b capi.ServiceBroker, cnsiGUID string) StServiceBroker {
	spaceGUID := ""
	if b.Relationships.Space != nil {
		spaceGUID = relationshipGUID(*b.Relationships.Space)
	}
	return StServiceBroker{
		GUID:        b.GUID,
		Name:        b.Name,
		URL:         b.URL,
		SpaceGUID:   spaceGUID,
		Labels:      metaLabels(b.Metadata),
		Annotations: metaAnnotations(b.Metadata),
		CnsiGUID:    cnsiGUID,
		CreatedAt:   b.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   b.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
