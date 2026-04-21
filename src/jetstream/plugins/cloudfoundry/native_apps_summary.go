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

// spaceDerivedFields are the StApp fields sourced from a space→org resolution
// — surfaced as unavailable together when the spaces fetch fails.
var spaceDerivedFields = []string{"orgGuid"}

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

// fetchSpacesByGUIDs issues one /v3/spaces?guids=... call paginated across
// all pages, returning a map space_guid → Space. The caller uses this to
// resolve each app's space GUID to an org GUID via the space's relationship
// envelope. Returns an error on any CAPI failure; caller converts into an
// envelope-level _meta.errors entry rather than failing the whole response.
func fetchSpacesByGUIDs(ctx echo.Context, cfClient capi.Client, spaceGUIDs []string) (map[string]capi.Space, error) {
	if len(spaceGUIDs) == 0 {
		return map[string]capi.Space{}, nil
	}
	spaces := make(map[string]capi.Space, len(spaceGUIDs))
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["guids"] = spaceGUIDs

		raw, err := cfClient.Spaces().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, s := range raw.Resources {
			spaces[s.GUID] = s
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return spaces, nil
}

// composeStAppSummary builds a summary-tier StApp from its source app, its
// web Process (may be nil), and its Space (may be nil for unresolved).
// Missing sub-resources surface as row-level _meta.unavailable entries
// listing the specific fields those sources would have populated.
func composeStAppSummary(app capi.App, process *capi.Process, space *capi.Space) StApp {
	s := toStApp(app)

	var unavailable []string

	if process != nil {
		mem := process.MemoryInMB
		disk := process.DiskInMB
		s.Memory = &mem
		s.DiskQuota = &disk
		s.Instances = process.Instances
	} else {
		unavailable = append(unavailable, processDerivedFields...)
	}

	if space != nil {
		orgGuid := relationshipGUID(space.Relationships.Organization)
		if orgGuid != "" {
			s.OrgGUID = &orgGuid
		} else {
			unavailable = append(unavailable, "orgGuid")
		}
	} else {
		unavailable = append(unavailable, spaceDerivedFields...)
	}

	if len(unavailable) > 0 {
		s.Meta = &StratosMeta{Unavailable: unavailable}
	}
	return s
}

// toStAppSummary is retained as a two-argument convenience for the tests +
// the subset of callers that don't need org resolution. Delegates to
// composeStAppSummary with space=nil so orgGuid is always unavailable in
// this path.
func toStAppSummary(app capi.App, process *capi.Process) StApp {
	return composeStAppSummary(app, process, nil)
}

// envelopeMetaForCompositionErrors builds the envelope-level _meta.errors
// entries for any composition sub-fetch that failed. Returns nil (so the
// envelope's _meta stays absent) when no errors occurred. Supports
// additively stacking errors — each failed sub-fetch gets its own envelope
// error with its own Affected + AffectedGuids lists.
func envelopeMetaForCompositionErrors(procErr, spaceErr error, affectedGUIDs []string) *StratosMeta {
	var errors []StratosError
	if procErr != nil {
		errors = append(errors, StratosError{
			Scope:         "envelope",
			Code:          "PROCESSES_FETCH_FAILED",
			Title:         "Processes fetch failed",
			Detail:        procErr.Error(),
			Affected:      append([]string(nil), processDerivedFields...),
			AffectedGuids: append([]string(nil), affectedGUIDs...),
		})
	}
	if spaceErr != nil {
		errors = append(errors, StratosError{
			Scope:         "envelope",
			Code:          "SPACES_FETCH_FAILED",
			Title:         "Spaces fetch failed",
			Detail:        spaceErr.Error(),
			Affected:      append([]string(nil), spaceDerivedFields...),
			AffectedGuids: append([]string(nil), affectedGUIDs...),
		})
	}
	if len(errors) == 0 {
		return nil
	}
	return &StratosMeta{Errors: errors}
}

// getNativeAppsSummary handles ?return=summary for the /pp/v1/cf/apps/{cnsi}
// endpoint — the Stratos-shape paged app-wall response.
//
// WU 3a + 3b + 3c scope: paging, sort, filter passthrough; composition with
// /v3/processes (memory / diskQuota / instances) and /v3/spaces (orgGuid
// via space→organization relationship). When a sub-fetch fails the handler
// still returns HTTP 200 with the app-level fields intact — per-row
// _meta.unavailable lists the affected fields, and envelope _meta.errors
// explains the root cause. Derived-field sort fallback lands in WU 3d.
func (c *CloudFoundrySpecification) getNativeAppsSummary(ctx echo.Context, cfClient capi.Client) error {
	params := parseSummaryQueryParams(ctx)

	raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	appGUIDs := make([]string, 0, len(raw.Resources))
	uniqueSpaceGUIDs := make(map[string]struct{}, len(raw.Resources))
	for _, r := range raw.Resources {
		appGUIDs = append(appGUIDs, r.GUID)
		if sg := relationshipGUID(r.Relationships.Space); sg != "" {
			uniqueSpaceGUIDs[sg] = struct{}{}
		}
	}
	spaceGUIDs := make([]string, 0, len(uniqueSpaceGUIDs))
	for sg := range uniqueSpaceGUIDs {
		spaceGUIDs = append(spaceGUIDs, sg)
	}

	processes, procErr := fetchWebProcessesForApps(ctx, cfClient, appGUIDs)
	spaces, spaceErr := fetchSpacesByGUIDs(ctx, cfClient, spaceGUIDs)

	resources := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		var p *capi.Process
		if procErr == nil {
			if proc, ok := processes[r.GUID]; ok {
				p = &proc
			}
		}
		var s *capi.Space
		if spaceErr == nil {
			if sp, ok := spaces[relationshipGUID(r.Relationships.Space)]; ok {
				s = &sp
			}
		}
		resources = append(resources, composeStAppSummary(r, p, s))
	}

	response := StratosPagedResponse[StApp]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, params.Page, params.PerPage, raw.Pagination.TotalResults),
		Meta:       envelopeMetaForCompositionErrors(procErr, spaceErr, appGUIDs),
	}

	return ctx.JSON(http.StatusOK, response)
}
