// src/jetstream/plugins/cloudfoundry/native_apps_summary.go
package cloudfoundry

import (
	"context"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// derivedSortFields are StApp fields sourced from /v3/processes that CAPI
// doesn't sort natively — requests on these trigger the fetch-all-sort-in-
// memory-paginate fallback path in getNativeAppsSummary.
var derivedSortFields = map[string]bool{
	"memory":    true,
	"diskQuota": true,
	"instances": true,
}

// isDerivedSortField returns true when the Stratos-shape order_by value
// refers to a process-derived field (memory / diskQuota / instances).
// Accepts both "field" and "-field" forms; returns the bare field name and
// the descending flag.
func isDerivedSortField(orderBy string) (bool, string, bool) {
	if orderBy == "" {
		return false, "", false
	}
	desc := strings.HasPrefix(orderBy, "-")
	field := strings.TrimPrefix(orderBy, "-")
	return derivedSortFields[field], field, desc
}

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

// spaceDerivedFields are the StApp fields sourced from a space resolution —
// surfaced as unavailable together when the spaces fetch fails. spaceName
// resolves directly from the Space DTO; orgGuid is one additional hop via
// space.Relationships.Organization.
var spaceDerivedFields = []string{"spaceName", "orgGuid"}

// routesDerivedFields are the StApp fields sourced from /v3/routes —
// surfaced as unavailable together when the routes fetch fails.
var routesDerivedFields = []string{"routes"}

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

// fetchOrgsByGUIDs mirrors fetchSpacesByGUIDs for orgs — used by the
// apps-list paths to stitch OrgName onto each StApp row from the same
// fanout that resolves SpaceName. Eliminates a frontend orgs-catalog
// fetch + per-row resolver previously needed just to render the
// "CF / Org / Space" cell on the app wall.
func fetchOrgsByGUIDs(ctx echo.Context, cfClient capi.Client, orgGUIDs []string) (map[string]capi.Organization, error) {
	if len(orgGUIDs) == 0 {
		return map[string]capi.Organization{}, nil
	}
	orgs := make(map[string]capi.Organization, len(orgGUIDs))
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["guids"] = orgGUIDs

		raw, err := cfClient.Organizations().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, o := range raw.Resources {
			orgs[o.GUID] = o
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return orgs, nil
}

// fetchRoutesForApps issues /v3/routes calls filtered to the given app
// GUIDs and walks each route's destinations to bucket routes back to the
// app(s) they map to. Returns a map keyed by app GUID → []StAppRoute.
//
// Returns an error on any CAPI failure; the caller converts this into an
// envelope-level _meta.errors entry rather than failing the whole
// response. Each app's bucket is allocated lazily — apps with no routes
// stay absent from the map (callers default to []).
func fetchRoutesForApps(ctx echo.Context, cfClient capi.Client, appGUIDs []string) (map[string][]StAppRoute, error) {
	if len(appGUIDs) == 0 {
		return map[string][]StAppRoute{}, nil
	}
	// Build a set so we only bucket destinations whose app belongs to
	// the requested page — a shared route mapped to N apps could carry
	// destinations for unrelated apps too (filter is per-route, not
	// per-destination).
	wanted := make(map[string]struct{}, len(appGUIDs))
	for _, g := range appGUIDs {
		wanted[g] = struct{}{}
	}

	out := make(map[string][]StAppRoute, len(appGUIDs))
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["app_guids"] = appGUIDs

		raw, err := cfClient.Routes().List(ctx.Request().Context(), params)
		if err != nil {
			return nil, err
		}
		for _, r := range raw.Resources {
			ar := StAppRoute{GUID: r.GUID, URL: r.URL}
			for _, d := range r.Destinations {
				appGUID := d.App.GUID
				if appGUID == "" {
					continue
				}
				if _, ok := wanted[appGUID]; !ok {
					continue
				}
				out[appGUID] = append(out[appGUID], ar)
			}
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return out, nil
}

// composeStAppSummary builds a summary-tier StApp from its source app, its
// web Process (may be nil), its Space (may be nil for unresolved), and its
// route bucket (nil signals routes-fetch failure; an empty slice signals a
// successful fetch with no routes mapped). Missing sub-resources surface
// as row-level _meta.unavailable entries listing the specific fields those
// sources would have populated.
// orgName is the resolved organization name for app's space, "" when
// the orgs-by-guid fetch failed or the org wasn't returned. Stitched at
// the caller from a batched fetchOrgsByGUIDs so the per-app composition
// remains pure (no per-row CAPI fanout).
func composeStAppSummary(app capi.App, cnsiGUID string, process *capi.Process, space *capi.Space, orgName string, routes []StAppRoute) StApp {
	s := toStApp(app, cnsiGUID)

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
		s.SpaceName = space.Name
		orgGuid := relationshipGUID(space.Relationships.Organization)
		if orgGuid != "" {
			s.OrgGUID = &orgGuid
		} else {
			unavailable = append(unavailable, "orgGuid")
		}
		// OrgName stitched best-effort when the caller's orgs-by-guid
		// fetch succeeded — empty here is silent (mirrors SpaceName's
		// silent default when space fetch fails) since the frontend
		// resolver still has the catalog as a fallback.
		if orgName != "" {
			s.OrgName = orgName
		}
	} else {
		unavailable = append(unavailable, spaceDerivedFields...)
	}

	if routes != nil {
		s.Routes = routes
	} else {
		// keep s.Routes as the [] toStApp seeded so the wire shape stays
		// stable even on failure; tristate flag lives on _meta.unavailable.
		unavailable = append(unavailable, routesDerivedFields...)
	}

	if len(unavailable) > 0 {
		s.Meta = &StratosMeta{Unavailable: unavailable}
	}
	return s
}

// toStAppSummary is retained as a two-argument convenience for the tests +
// the subset of callers that don't need org / route resolution. Delegates
// to composeStAppSummary with space=nil and routes=[] so orgGuid is
// always unavailable in this path; routes default to empty so the absence
// is treated as "no routes" rather than "routes fetch failed".
func toStAppSummary(app capi.App, cnsiGUID string, process *capi.Process) StApp {
	return composeStAppSummary(app, cnsiGUID, process, nil, "", []StAppRoute{})
}

// envelopeMetaForCompositionErrors builds the envelope-level _meta.errors
// entries for any composition sub-fetch that failed. Returns nil (so the
// envelope's _meta stays absent) when no errors occurred. Supports
// additively stacking errors — each failed sub-fetch gets its own envelope
// error with its own Affected + AffectedGuids lists.
func envelopeMetaForCompositionErrors(procErr, spaceErr, routesErr error, affectedGUIDs []string) *StratosMeta {
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
	if routesErr != nil {
		errors = append(errors, StratosError{
			Scope:         "envelope",
			Code:          "ROUTES_FETCH_FAILED",
			Title:         "Routes fetch failed",
			Detail:        routesErr.Error(),
			Affected:      append([]string(nil), routesDerivedFields...),
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
// Scope (WU 3a + 3b + 3c + 3d): paging, sort, filter passthrough;
// composition with /v3/processes (memory / diskQuota / instances) and
// /v3/spaces (orgGuid via space→organization relationship); fallback to
// fetch-all + sort-in-memory + paginate when the sort field is process-
// derived (not CAPI-sortable). When a sub-fetch fails the handler still
// returns HTTP 200 with app-level fields intact — per-row
// _meta.unavailable lists affected fields, envelope _meta.errors explains
// root causes.
func (c *CloudFoundrySpecification) getNativeAppsSummary(ctx echo.Context, cfClient capi.Client) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	params := parseSummaryQueryParams(ctx)

	if derived, field, desc := isDerivedSortField(params.OrderBy); derived {
		return c.getNativeAppsSummaryDerivedSort(ctx, cfClient, params, field, desc)
	}

	raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
	if err != nil {
		return err
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
	routesByApp, routesErr := fetchRoutesForApps(ctx, cfClient, appGUIDs)

	// Orgs-by-guid for the OrgName stitch. Derive the unique org guids
	// from the spaces we just fetched — every app's org is reachable
	// through space.Relationships.Organization. Lazy-non-fatal: org
	// fetch failure leaves OrgName empty and "orgName" surfaces in
	// _meta.unavailable per row (composeStAppSummary handles the gap).
	orgs := map[string]capi.Organization{}
	if spaceErr == nil {
		uniqueOrgGUIDs := make(map[string]struct{})
		for _, sp := range spaces {
			if og := relationshipGUID(sp.Relationships.Organization); og != "" {
				uniqueOrgGUIDs[og] = struct{}{}
			}
		}
		orgGUIDs := make([]string, 0, len(uniqueOrgGUIDs))
		for og := range uniqueOrgGUIDs {
			orgGUIDs = append(orgGUIDs, og)
		}
		orgs, _ = fetchOrgsByGUIDs(ctx, cfClient, orgGUIDs)
	}

	resources := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		var p *capi.Process
		if procErr == nil {
			if proc, ok := processes[r.GUID]; ok {
				p = &proc
			}
		}
		var s *capi.Space
		var orgName string
		if spaceErr == nil {
			if sp, ok := spaces[relationshipGUID(r.Relationships.Space)]; ok {
				s = &sp
				if og := relationshipGUID(sp.Relationships.Organization); og != "" {
					if o, ok := orgs[og]; ok {
						orgName = o.Name
					}
				}
			}
		}
		var rts []StAppRoute
		if routesErr == nil {
			// Use [] for "no routes" so wire stays predictable; nil-only
			// signals fetch failure to composeStAppSummary.
			if found, ok := routesByApp[r.GUID]; ok {
				rts = found
			} else {
				rts = []StAppRoute{}
			}
		}
		resources = append(resources, composeStAppSummary(r, cnsiGUID, p, s, orgName, rts))
	}

	response := StratosPagedResponse[StApp]{
		Resources:  resources,
		Pagination: BuildPaginationMeta(ctx, params.Page, params.PerPage, raw.Pagination.TotalResults),
		Meta:       envelopeMetaForCompositionErrors(procErr, spaceErr, routesErr, appGUIDs),
	}

	return ctx.JSON(http.StatusOK, response)
}

// getNativeAppsSummaryDerivedSort is the fallback path for sort requests on
// process-derived fields (memory / diskQuota / instances) that CAPI V3's
// /v3/apps doesn't sort natively. Fetches every matching app across all
// CAPI pages (filter still passthrough), composes with processes + spaces,
// sorts the composed slice in memory on the requested field, then slices
// out the requested page. Per-request buffer is bounded to one CF's full
// app set — no cross-CF buffer (cross-CF merge is the frontend primitive's
// concern in WU 4).
func (c *CloudFoundrySpecification) getNativeAppsSummaryDerivedSort(
	ctx echo.Context,
	cfClient capi.Client,
	params *capi.QueryParams,
	sortField string,
	desc bool,
) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	requestedPage := params.Page
	requestedPerPage := params.PerPage

	// Fetch all matching apps (filters retained; page/per_page/order_by ignored)
	allApps, err := fetchAllAppsWithFilters(ctx.Request().Context(), cfClient, params.Filters)
	if err != nil {
		return err
	}

	appGUIDs := make([]string, 0, len(allApps))
	uniqueSpaceGUIDs := make(map[string]struct{}, len(allApps))
	for _, r := range allApps {
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
	routesByApp, routesErr := fetchRoutesForApps(ctx, cfClient, appGUIDs)

	// Orgs-by-guid stitch (mirrors getNativeAppsSummary above).
	orgs := map[string]capi.Organization{}
	if spaceErr == nil {
		uniqueOrgGUIDs := make(map[string]struct{})
		for _, sp := range spaces {
			if og := relationshipGUID(sp.Relationships.Organization); og != "" {
				uniqueOrgGUIDs[og] = struct{}{}
			}
		}
		orgGUIDs := make([]string, 0, len(uniqueOrgGUIDs))
		for og := range uniqueOrgGUIDs {
			orgGUIDs = append(orgGUIDs, og)
		}
		orgs, _ = fetchOrgsByGUIDs(ctx, cfClient, orgGUIDs)
	}

	composed := make([]StApp, 0, len(allApps))
	for _, r := range allApps {
		var p *capi.Process
		if procErr == nil {
			if proc, ok := processes[r.GUID]; ok {
				p = &proc
			}
		}
		var s *capi.Space
		var orgName string
		if spaceErr == nil {
			if sp, ok := spaces[relationshipGUID(r.Relationships.Space)]; ok {
				s = &sp
				if og := relationshipGUID(sp.Relationships.Organization); og != "" {
					if o, ok := orgs[og]; ok {
						orgName = o.Name
					}
				}
			}
		}
		var rts []StAppRoute
		if routesErr == nil {
			if found, ok := routesByApp[r.GUID]; ok {
				rts = found
			} else {
				rts = []StAppRoute{}
			}
		}
		composed = append(composed, composeStAppSummary(r, cnsiGUID, p, s, orgName, rts))
	}

	sortStAppsByDerivedField(composed, sortField, desc)

	totalResults := len(composed)
	startIdx := (requestedPage - 1) * requestedPerPage
	endIdx := startIdx + requestedPerPage
	if startIdx > totalResults {
		startIdx = totalResults
	}
	if endIdx > totalResults {
		endIdx = totalResults
	}
	pageSlice := composed[startIdx:endIdx]

	response := StratosPagedResponse[StApp]{
		Resources:  pageSlice,
		Pagination: BuildPaginationMeta(ctx, requestedPage, requestedPerPage, totalResults),
		Meta:       envelopeMetaForCompositionErrors(procErr, spaceErr, routesErr, appGUIDs),
	}

	return ctx.JSON(http.StatusOK, response)
}

// fetchAllAppsWithFilters paginates through every /v3/apps page matching
// the supplied filters, returning the aggregated app set. Per_page is set
// to fullPagePerRequest for efficiency; the filter map is preserved as-is.
func fetchAllAppsWithFilters(ctx context.Context, cfClient capi.Client, filters map[string][]string) ([]capi.App, error) {
	var all []capi.App
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		for k, v := range filters {
			params.Filters[k] = v
		}
		raw, err := cfClient.Apps().List(ctx, params)
		if err != nil {
			return nil, err
		}
		if page == 1 {
			all = make([]capi.App, 0, raw.Pagination.TotalResults)
		}
		all = append(all, raw.Resources...)
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return all, nil
}

// sortStAppsByDerivedField sorts composed StApps in place on a process-
// derived field. Rows with a nil value for the field (composition failure
// on that row) sort to the end regardless of direction — unavailable data
// isn't ranked ahead of known data, either as largest or smallest.
func sortStAppsByDerivedField(apps []StApp, field string, desc bool) {
	sort.SliceStable(apps, func(i, j int) bool {
		vi, iPresent := derivedSortValue(apps[i], field)
		vj, jPresent := derivedSortValue(apps[j], field)

		// Nils always sort last
		if !iPresent && jPresent {
			return false
		}
		if iPresent && !jPresent {
			return true
		}
		if !iPresent && !jPresent {
			return false
		}
		if desc {
			return vi > vj
		}
		return vi < vj
	})
}

// derivedSortValue returns the int value of a derived sort field on a
// StApp, plus a present flag indicating whether the field had a non-nil
// value (relevant for pointer-typed Memory / DiskQuota). Instances is an
// int value type, always present.
func derivedSortValue(app StApp, field string) (int, bool) {
	switch field {
	case "memory":
		if app.Memory == nil {
			return 0, false
		}
		return *app.Memory, true
	case "diskQuota":
		if app.DiskQuota == nil {
			return 0, false
		}
		return *app.DiskQuota, true
	case "instances":
		return app.Instances, true
	}
	return 0, false
}
