// src/jetstream/plugins/cloudfoundry/native_service_plans_reads.go
package cloudfoundry

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// getNativeServicePlans handles GET /pp/v1/cf/service_plans/{cnsiGuid}.
//
// Branch behaviour, all single CAPI calls (no internal drain) per the
// wire contract baseline (see KS docs/v2-v3-field-mapping.md "Wire
// contract principles"):
//
//   - ?return=counts                — per_page=1, total only.
//   - ?guids=<comma-list>           — single CAPI call with v3 `guids`
//                                     filter; returns just those plans.
//   - ?per_page=N&page=M (default)  — single CAPI page; per_page defaults
//                                     to 50 and page to 1 when absent.
//
// The response envelope is StratosPagedResponse[StServicePlan] for the
// paginated branches (so the frontend's CnsiEntitySource can follow
// `pagination.next`) and StServicePlansResponse for the counts fast-path
// (the legacy flat shape).
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

	if ctx.QueryParam("return") == "counts" {
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

	page := 1
	if rp := ctx.QueryParam("page"); rp != "" {
		if v, perr := strconv.Atoi(rp); perr == nil && v > 0 {
			page = v
		}
	}
	perPage := 50
	if rpp := ctx.QueryParam("per_page"); rpp != "" {
		v, perr := strconv.Atoi(rpp)
		if perr != nil || v <= 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "per_page must be a positive integer")
		}
		perPage = v
	}

	params := capi.NewQueryParams().WithPerPage(perPage)
	params.Page = page

	if rawGuids := ctx.QueryParam("guids"); rawGuids != "" {
		guids := splitNonEmpty(rawGuids, ",")
		if len(guids) > 0 {
			params = params.WithFilter("guids", guids...)
		}
	}

	raw, lerr := cfClient.ServicePlans().List(ctx.Request().Context(), params)
	if lerr != nil {
		return handleCapiError(ctx, lerr)
	}

	resources := make([]StServicePlan, 0, len(raw.Resources))
	for _, p := range raw.Resources {
		resources = append(resources, toStServicePlan(p, cnsiGUID))
	}

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StServicePlan]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeServicePlanDetail handles GET /pp/v1/cf/service_plans/{cnsiGuid}/{planGuid}.
// Single-resource sibling to the list endpoint — used by detail views and
// guid-keyed lazy fetches that don't want to pay the list cost.
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

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, toStServicePlan(*plan, cnsiGUID))
}

// toStServicePlan flattens a capi.ServicePlan into the Stratos-shape DTO.
// The v3 envelope's nested relationships, metadata, and broker_catalog
// sub-blocks are dropped or surfaced as flat fields per the
// "single resource in / flat resource out" contract.
func toStServicePlan(p capi.ServicePlan, cnsiGUID string) StServicePlan {
	costs := make([]StServicePlanCost, 0, len(p.Costs))
	for _, c := range p.Costs {
		costs = append(costs, StServicePlanCost{
			Amount:   c.Amount,
			Currency: c.Currency,
			Unit:     c.Unit,
		})
	}
	spaceGUID := ""
	if p.Relationships.Space != nil {
		spaceGUID = relationshipGUID(*p.Relationships.Space)
	}
	return StServicePlan{
		GUID:                p.GUID,
		Name:                p.Name,
		Description:         p.Description,
		Available:           p.Available,
		Free:                p.Free,
		VisibilityType:      p.VisibilityType,
		ServiceOfferingGUID: relationshipGUID(p.Relationships.ServiceOffering),
		SpaceGUID:           spaceGUID,
		Costs:               costs,
		Labels:              metaLabels(p.Metadata),
		Annotations:         metaAnnotations(p.Metadata),
		CnsiGUID:            cnsiGUID,
		CreatedAt:           p.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:           p.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// splitNonEmpty splits s on sep and drops empty tokens — used by the
// `?guids=` parser so trailing/double commas don't translate into empty
// filter values that CAPI would reject.
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
