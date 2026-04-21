// src/jetstream/plugins/cloudfoundry/native_apps_summary.go
package cloudfoundry

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// Summary-tier defaults for the Stratos-shape paged response. CAPI V3's own
// default per-page is 50; we match it so uninstrumented clients get a
// reasonable page without surprise.
const (
	summaryDefaultPage    = 1
	summaryDefaultPerPage = 50
)

// stratosReservedSummaryParams are the query-param keys the Stratos-shape
// contract reserves for paging / sort / tier. Everything else in the query
// string is passed through to CAPI as a filter per the "mirror CAPI filter
// grammar" decision in the page 1 plan.
var stratosReservedSummaryParams = map[string]bool{
	"page":      true,
	"per_page":  true,
	"order_by":  true,
	"direction": true,
	"return":    true,
}

// parseSummaryQueryParams translates Stratos-shape query params into a
// CAPI QueryParams struct. Stratos-shape separates sort field from sort
// direction (order_by=<field>&direction=<asc|desc>); CAPI V3 combines them
// in a single minus-prefix string. Filter fields are forwarded unchanged;
// comma-separated values in a Stratos filter become the CAPI filter slice.
func parseSummaryQueryParams(ctx echo.Context) *capi.QueryParams {
	params := capi.NewQueryParams()

	params.Page = summaryDefaultPage
	if raw := ctx.QueryParam("page"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			params.Page = v
		}
	}

	params.PerPage = summaryDefaultPerPage
	if raw := ctx.QueryParam("per_page"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			params.PerPage = v
		}
	}

	if orderBy := ctx.QueryParam("order_by"); orderBy != "" {
		if ctx.QueryParam("direction") == "desc" {
			orderBy = "-" + orderBy
		}
		params.OrderBy = orderBy
	}

	for key, values := range ctx.QueryParams() {
		if stratosReservedSummaryParams[key] {
			continue
		}
		parts := make([]string, 0, len(values))
		for _, v := range values {
			for _, token := range strings.Split(v, ",") {
				if token != "" {
					parts = append(parts, token)
				}
			}
		}
		if len(parts) > 0 {
			params.Filters[key] = parts
		}
	}

	return params
}

// getNativeAppsSummary handles ?return=summary for the /pp/v1/cf/apps/{cnsi}
// endpoint — the Stratos-shape paged app-wall response.
//
// WU 3a scope: paging, sort, and filter passthrough to CAPI V3, returning a
// StratosPagedResponse[StApp] envelope with proper pagination links. Uses
// the existing toStApp mapper so memory / diskQuota / orgGuid are not yet
// populated — those come in WU 3b (processes composition) and WU 3c (space
// → org resolution). Derived-field sort fallback lands in WU 3d.
func (c *CloudFoundrySpecification) getNativeAppsSummary(ctx echo.Context, cfClient capi.Client) error {
	params := parseSummaryQueryParams(ctx)

	raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	resources := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		resources = append(resources, toStApp(r))
	}

	response := StratosPagedResponse[StApp]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, params.Page, params.PerPage, raw.Pagination.TotalResults),
	}

	return ctx.JSON(http.StatusOK, response)
}
