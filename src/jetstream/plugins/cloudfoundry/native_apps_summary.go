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

// processDerivedFields are the StApp fields sourced from /v3/processes/web —
// surfaced as unavailable together when the processes fetch fails.
var processDerivedFields = []string{"memory", "diskQuota", "instances"}

// fetchWebProcessesForApps issues one /v3/processes call filtered to the
// given app GUIDs and type=web, collecting results across all pages. Returns
// a map keyed by app GUID so per-app composition is a cheap lookup. Returns
// an error on any CAPI failure; the caller converts this into an envelope-
// level _meta.errors entry rather than failing the whole response.
func fetchWebProcessesForApps(ctx echo.Context, cfClient capi.Client, appGUIDs []string) (map[string]capi.Process, error) {
	if len(appGUIDs) == 0 {
		return map[string]capi.Process{}, nil
	}

	processes := make(map[string]capi.Process, len(appGUIDs))
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["app_guids"] = appGUIDs
		params.Filters["types"] = []string{"web"}

		raw, err := cfClient.Processes().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, p := range raw.Resources {
			if p.Relationships != nil && p.Relationships.App != nil {
				processes[relationshipGUID(*p.Relationships.App)] = p
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return processes, nil
}

// toStAppSummary builds a summary-tier StApp. When a web Process is provided,
// memory / disk / instances are populated from it. When nil (processes fetch
// failed or this app has no web process), those fields are absent and the
// row's _meta.unavailable records the gap.
func toStAppSummary(app capi.App, process *capi.Process) StApp {
	s := toStApp(app)
	if process != nil {
		mem := process.MemoryInMB
		disk := process.DiskInMB
		s.Memory = &mem
		s.DiskQuota = &disk
		s.Instances = process.Instances
		return s
	}
	s.Meta = &StratosMeta{Unavailable: append([]string(nil), processDerivedFields...)}
	return s
}

// envelopeMetaWithProcessError builds a StratosMeta that records a processes-
// fetch failure at the envelope level. Consumers pair this with per-row
// _meta.unavailable entries to see which rows are affected.
func envelopeMetaWithProcessError(err error, affectedGUIDs []string) *StratosMeta {
	return &StratosMeta{
		Errors: []StratosError{{
			Scope:         "envelope",
			Code:          "PROCESSES_FETCH_FAILED",
			Title:         "Processes fetch failed",
			Detail:        err.Error(),
			Affected:      append([]string(nil), processDerivedFields...),
			AffectedGuids: append([]string(nil), affectedGUIDs...),
		}},
	}
}

// getNativeAppsSummary handles ?return=summary for the /pp/v1/cf/apps/{cnsi}
// endpoint — the Stratos-shape paged app-wall response.
//
// WU 3a + 3b scope: paging, sort, filter passthrough; composition with
// /v3/processes to populate memory / diskQuota / instances per row. When
// the processes fetch fails, rows are still returned with Name / State /
// etc., per-row _meta.unavailable listing the affected fields, and an
// envelope-level _meta.errors entry explaining the root cause. orgGuid
// composition lands in WU 3c; derived-field sort fallback in WU 3d.
func (c *CloudFoundrySpecification) getNativeAppsSummary(ctx echo.Context, cfClient capi.Client) error {
	params := parseSummaryQueryParams(ctx)

	raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	appGUIDs := make([]string, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		appGUIDs = append(appGUIDs, r.GUID)
	}

	processes, procErr := fetchWebProcessesForApps(ctx, cfClient, appGUIDs)

	resources := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		var p *capi.Process
		if procErr == nil {
			if proc, ok := processes[r.GUID]; ok {
				p = &proc
			}
		}
		resources = append(resources, toStAppSummary(r, p))
	}

	response := StratosPagedResponse[StApp]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, params.Page, params.PerPage, raw.Pagination.TotalResults),
	}

	if procErr != nil {
		response.Meta = envelopeMetaWithProcessError(procErr, appGUIDs)
	}

	return ctx.JSON(http.StatusOK, response)
}
