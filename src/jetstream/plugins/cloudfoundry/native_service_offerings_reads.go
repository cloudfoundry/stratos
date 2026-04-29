// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads.go
package cloudfoundry

import (
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServiceOfferings handles GET /pp/v1/cf/service_offerings/{cnsiGuid}.
//
// Single-page passthrough over /v3/service_offerings. Caller's per_page/page
// forward verbatim to one CAPI call; absent, V3 server defaults apply.
// Returns flat offering rows wrapped in a Stratos paged envelope.
//
// Per-page broker join: the unique broker GUIDs referenced by THIS page's
// offerings are resolved with one batched /v3/service_brokers?guids=… call
// (bounded by the page's broker-set size). Soft-fail: a broker-list error
// leaves BrokerName empty rather than 502'ing the whole marketplace.
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

	if ctx.QueryParam("return") == "counts" {
		params := capi.NewQueryParams().WithPerPage(1)
		raw, lerr := cfClient.ServiceOfferings().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, StServiceOfferingsResponse{
			Resources:    []StServiceOffering{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	listParams := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	rawOfferings, listErr := cfClient.ServiceOfferings().List(ctx.Request().Context(), listParams)
	if listErr != nil {
		return handleCapiError(ctx, listErr)
	}
	offerings := rawOfferings.Resources

	// Collect the unique broker GUIDs referenced by this page's offerings.
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

	// Batch-fetch brokers so the picker can display names. Soft-fail.
	brokerByGUID := make(map[string]capi.ServiceBroker, len(brokerGUIDs))
	if len(brokerGUIDs) > 0 {
		brokerParams := capi.NewQueryParams().
			WithPerPage(len(brokerGUIDs)).
			WithFilter("guids", brokerGUIDs...)
		if raw, berr := cfClient.ServiceBrokers().List(ctx.Request().Context(), brokerParams); berr == nil {
			for _, b := range raw.Resources {
				brokerByGUID[b.GUID] = b
			}
		}
	}

	out := make([]StServiceOffering, 0, len(offerings))
	for _, o := range offerings {
		out = append(out, toStServiceOffering(o, cnsiGUID, brokerByGUID))
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
// Single-resource sibling for the catalog detail page. Joins the broker
// name like the list does so the detail view doesn't need a second
// frontend fetch. Broker join is soft — failure leaves BrokerName empty
// rather than failing the whole detail load.
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

	brokerByGUID := make(map[string]capi.ServiceBroker, 1)
	if brokerGUID := relationshipGUID(offering.Relationships.ServiceBroker); brokerGUID != "" {
		brokerParams := capi.NewQueryParams().WithPerPage(1).WithFilter("guids", brokerGUID)
		if raw, listErr := cfClient.ServiceBrokers().List(ctx.Request().Context(), brokerParams); listErr == nil {
			for _, b := range raw.Resources {
				brokerByGUID[b.GUID] = b
			}
		}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServiceOffering(*offering, cnsiGUID, brokerByGUID))
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
	documentationURL := ""
	if o.DocumentationURL != nil {
		documentationURL = *o.DocumentationURL
	}
	return StServiceOffering{
		GUID:                  o.GUID,
		Name:                  o.Name,
		Description:           o.Description,
		BrokerName:            brokerName,
		ServiceBrokerGUID:     brokerGUID,
		Tags:                  tags,
		Public:                o.Available,
		DocumentationURL:      documentationURL,
		BrokerCatalogMetadata: o.BrokerCatalog.Metadata,
		CnsiGUID:              cnsiGUID,
		CreatedAt:             o.CreatedAt.Format(time.RFC3339),
		UpdatedAt:             o.UpdatedAt.Format(time.RFC3339),
	}
}
