// src/jetstream/plugins/cloudfoundry/native_handlers.go
package cloudfoundry

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/fivetwenty-io/capi/v3/pkg/cfclient"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

const stratosSchemaVersion = "1"

// nativeCFProxy is the narrow set of portal-proxy operations the native handlers need.
// Defined as an interface so tests can provide a stub without implementing all of api.PortalProxy.
type nativeCFProxy interface {
	GetCNSIRecord(guid string) (api.CNSIRecord, error)
	GetCNSITokenRecord(cnsiGUID string, userGUID string) (api.TokenRecord, bool)
	GetSessionStringValue(ctx echo.Context, key string) (string, error)
	RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (api.TokenRecord, error)
	DoProxySingleRequestWithToken(cnsiGUID string, token *api.TokenRecord, method, requestURL string, headers http.Header, body []byte) (*api.CNSIRequest, error)
}

// getUserGUID extracts the logged-in user GUID from the session.
func (c *CloudFoundrySpecification) getUserGUID(ctx echo.Context) (string, error) {
	return c.nativeProxy().GetSessionStringValue(ctx, "user_id")
}

// nativeProxy returns the portal proxy cast to nativeCFProxy.
// Allows tests to replace it by setting c.testProxy.
func (c *CloudFoundrySpecification) nativeProxy() nativeCFProxy {
	if c.testProxy != nil {
		return c.testProxy
	}
	return c.portalProxy
}

// newCapiClient creates a capi client authenticated with Jetstream's stored token.
// Uses cfclient.NewWithToken so no UAA discovery occurs — the token is passed directly.
//
// Proactively refreshes the stored token if it has expired before handing it
// to capi. Without this check, cfclient sends a dead token and CF returns
// CF-InvalidAuthToken (502 to the caller) — the legacy proxy path
// (oauth_requests.go OAuthHandlerFunc) handles this via both proactive expiry
// and reactive 401, but native handlers bypass that wrapper entirely.
func newCapiClient(ctx context.Context, proxy nativeCFProxy, cnsiGUID, userGUID string) (capi.Client, error) {
	cnsiRecord, err := proxy.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}
	tokenRecord, ok := proxy.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusForbidden, "no token for endpoint")
	}
	if tokenRecord.TokenExpiry > 0 && time.Unix(tokenRecord.TokenExpiry, 0).Before(time.Now()) {
		log.Infof("[diag refresh] newCapiClient proactive refresh cnsi=%s user=%s expiry=%d (age=%s)",
			cnsiGUID, userGUID, tokenRecord.TokenExpiry, time.Since(time.Unix(tokenRecord.TokenExpiry, 0)))
		refreshed, refreshErr := proxy.RefreshOAuthToken(
			cnsiRecord.SkipSSLValidation,
			cnsiGUID, userGUID,
			cnsiRecord.ClientId, cnsiRecord.ClientSecret, cnsiRecord.TokenEndpoint,
		)
		if refreshErr != nil {
			log.Warnf("[diag refresh] CF token refresh FAILED for cnsi=%s user=%s: %v", cnsiGUID, userGUID, refreshErr)
			return nil, echo.NewHTTPError(http.StatusBadGateway, "token refresh failed: "+refreshErr.Error())
		}
		log.Infof("[diag refresh] OK cnsi=%s user=%s new_expiry=%d", cnsiGUID, userGUID, refreshed.TokenExpiry)
		tokenRecord = refreshed
	}
	client, err := cfclient.NewWithToken(ctx, cnsiRecord.APIEndpoint.String(), tokenRecord.AuthToken)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	return client, nil
}

// normaliseStringMap ensures nil maps are returned as empty maps (not null in JSON).
func normaliseStringMap(m map[string]string) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return m
}

// metaLabels/metaAnnotations safely extract labels/annotations from a *capi.Metadata (may be nil).
func metaLabels(m *capi.Metadata) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return normaliseStringMap(m.Labels)
}

func metaAnnotations(m *capi.Metadata) map[string]string {
	if m == nil {
		return map[string]string{}
	}
	return normaliseStringMap(m.Annotations)
}

// relationshipGUID safely extracts a GUID from a capi.Relationship whose Data pointer may be nil.
func relationshipGUID(rel capi.Relationship) string {
	if rel.Data == nil {
		return ""
	}
	return rel.Data.GUID
}

// ---- handlers ----

// fullPagePerRequest is the page size used when draining every page of a CF
// list endpoint. Default 500 so each request completes well under the 30s
// CAPI client timeout (adepttech /v3/spaces at per_page=5000 clocked
// ~27s/request). Override via env var STRATOS_CF_PER_PAGE for environments
// with different CAPI performance characteristics.
var fullPagePerRequest = envIntWithDefault("STRATOS_CF_PER_PAGE", 500)

// maxParallelPages bounds the concurrency of the page-2..N fetch after the
// first page returns TotalPages. Default 5. Override via env var
// STRATOS_CF_MAX_PARALLEL_PAGES if the CAPI tolerates more/fewer concurrent
// requests.
var maxParallelPages = envIntWithDefault("STRATOS_CF_MAX_PARALLEL_PAGES", 5)

// logCapiTiming emits a structured log line for one CAPI list call. Used at
// every cfClient.X.List() call site in the drain helpers so a future 504
// can be attributed to a specific page or filter shape (vs guessed at).
//
// Format is greppable key=value: `[trace capi] op=<name> page=<n>
// per_page=<n> filter_orgs=<n> duration=<ms>ms err=<...> rows=<n> total=<n>`.
//
// Pass filterOrgs=-1 when the filter doesn't apply to the call. Pass
// rows/total=-1 when the call errored and no response is available.
func logCapiTiming(op string, page, perPage, filterOrgs int, start time.Time, err error, rows, total int) {
	dur := time.Since(start)
	fields := log.Fields{
		"op":       op,
		"page":     page,
		"per_page": perPage,
		"duration": dur.String(),
	}
	if filterOrgs >= 0 {
		fields["filter_orgs"] = filterOrgs
	}
	if rows >= 0 {
		fields["rows"] = rows
	}
	if total >= 0 {
		fields["total"] = total
	}
	if err != nil {
		fields["err"] = err.Error()
		log.WithFields(fields).Warn("[trace capi]")
		return
	}
	log.WithFields(fields).Info("[trace capi]")
}

// logHandlerTiming emits a structured log line for one handler invocation.
// Use it via `defer logHandlerTiming("getNativeX", time.Now(), &err, &rows)`
// at the top of a handler — the deferred call captures total wall-time and
// completion status. If the handler is cut off mid-flight (e.g., gorouter
// timeout) this line will not appear, which itself is the diagnostic signal.
func logHandlerTiming(op, cnsiGUID string, start time.Time, errPtr *error, rowsPtr *int) {
	dur := time.Since(start)
	fields := log.Fields{
		"op":             op,
		"cnsi":           cnsiGUID,
		"total_duration": dur.String(),
	}
	if rowsPtr != nil {
		fields["rows"] = *rowsPtr
	}
	if errPtr != nil && *errPtr != nil {
		fields["err"] = (*errPtr).Error()
		log.WithFields(fields).Warn("[trace handler]")
		return
	}
	log.WithFields(fields).Info("[trace handler]")
}

// envIntWithDefault reads a positive integer from the named env var, falling
// back to the supplied default on unset, non-numeric, or non-positive values.
// Logs the resolved value at info level so operators can confirm what's in
// effect after cf set-env + restage.
func envIntWithDefault(name string, def int) int {
	raw := os.Getenv(name)
	if raw == "" {
		log.Infof("%s unset, using default %d", name, def)
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		log.Warnf("%s=%q is not a positive integer, using default %d", name, raw, def)
		return def
	}
	log.Infof("%s=%d (overrides default %d)", name, n, def)
	return n
}

// (drain helpers listAllOrgs / listAllApps / listAllSpaces removed in the
// paging-only sweep — every list handler now forwards the caller's per_page
// directly to a single CAPI page. listAllRoutes is retained because the
// non-counts branch of getNativeRouteCount still needs the full route set
// to populate destinations.)

func toStOrg(r capi.Organization) StOrg {
	quotaGUID := ""
	if r.Relationships != nil {
		quotaGUID = relationshipGUID(r.Relationships.Quota)
	}
	return StOrg{
		GUID:        r.GUID,
		Name:        r.Name,
		Status:      "active",
		QuotaGUID:   quotaGUID,
		Labels:      metaLabels(r.Metadata),
		Annotations: metaAnnotations(r.Metadata),
		CreatedAt:   r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   r.UpdatedAt.Format(time.RFC3339),
	}
}

func toStApp(r capi.App) StApp {
	// V3's lifecycle.data is a free-form map; for buildpack lifecycle
	// (the common case) it carries `stack` as a string. Other lifecycles
	// (docker) leave it absent — StackName stays empty and is omitted
	// from the wire payload via the omitempty tag.
	stackName, _ := r.Lifecycle.Data["stack"].(string)
	return StApp{
		GUID:      r.GUID,
		Name:      r.Name,
		State:     r.State,
		SpaceGUID: relationshipGUID(r.Relationships.Space),
		StackName: stackName,
		Routes:    []StAppRoute{},
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}

func toStSpace(r capi.Space) StSpace {
	return StSpace{
		GUID:      r.GUID,
		Name:      r.Name,
		OrgGUID:   relationshipGUID(r.Relationships.Organization),
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}

// getNativeOrgs dispatches on ?return=
//   - counts: per_page=1, totalResults only
//   - (default): single CAPI page passthrough, Stratos paged envelope.
//     Caller's per_page/page forward verbatim to /v3/organizations; absent,
//     V3 server defaults apply.
func (c *CloudFoundrySpecification) getNativeOrgs(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
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
		raw, err := cfClient.Organizations().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		orgs := make([]StOrg, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			orgs = append(orgs, toStOrg(r))
		}
		return ctx.JSON(http.StatusOK, StOrgsResponse{Resources: orgs, TotalResults: raw.Pagination.TotalResults})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, lerr := cfClient.Organizations().List(ctx.Request().Context(), params)
	if lerr != nil {
		return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
	}
	orgs := make([]StOrg, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		orgs = append(orgs, toStOrg(r))
	}
	return ctx.JSON(http.StatusOK, StratosPagedResponse[StOrg]{
		Resources:  orgs,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeApps dispatches on ?return=
//   - counts: per_page=1, totalResults only
//   - recent: per_page=10, order_by=-updated_at (top 10 most recently pushed)
//   - summary: Stratos-shape paged response with paging/sort/filter params
//     (WU 3 — see native_apps_summary.go for handler)
//   - (default): single CAPI page passthrough, Stratos paged envelope.
func (c *CloudFoundrySpecification) getNativeApps(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	switch ctx.QueryParam("return") {
	case "counts":
		params := capi.NewQueryParams().WithPerPage(1)
		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		apps := make([]StApp, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			apps = append(apps, toStApp(r))
		}
		return ctx.JSON(http.StatusOK, StAppsResponse{Resources: apps, TotalResults: raw.Pagination.TotalResults})

	case "recent":
		params := capi.NewQueryParams().WithPerPage(10).WithOrderBy("-updated_at")
		raw, err := cfClient.Apps().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		apps := make([]StApp, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			apps = append(apps, toStApp(r))
		}
		return ctx.JSON(http.StatusOK, StAppsResponse{Resources: apps, TotalResults: raw.Pagination.TotalResults})

	case "summary":
		return c.getNativeAppsSummary(ctx, cfClient)
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)
	raw, lerr := cfClient.Apps().List(ctx.Request().Context(), params)
	if lerr != nil {
		return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
	}

	// Enrich each app with its web-process memory / diskQuota / instances
	// and its parent space's name. V3 moves the process fields off the app
	// onto the web process, and the space name was always carried via a
	// separate /v3/spaces fetch on the client. Stitching both server-side
	// gives downstream consumers (Memory Usage tile, app-wall Space cell)
	// rich rows from a single payload.
	appGUIDs := make([]string, 0, len(raw.Resources))
	spaceGUIDsSeen := make(map[string]struct{}, len(raw.Resources))
	spaceGUIDs := make([]string, 0)
	for _, r := range raw.Resources {
		appGUIDs = append(appGUIDs, r.GUID)
		spaceGUID := relationshipGUID(r.Relationships.Space)
		if spaceGUID != "" {
			if _, seen := spaceGUIDsSeen[spaceGUID]; !seen {
				spaceGUIDsSeen[spaceGUID] = struct{}{}
				spaceGUIDs = append(spaceGUIDs, spaceGUID)
			}
		}
	}
	processes, _ := fetchWebProcessesForApps(ctx, cfClient, appGUIDs)
	spaces, _ := fetchSpacesByGUIDs(ctx, cfClient, spaceGUIDs)
	// Routes are fetched lazily-non-fatal on the default path — same
	// pattern as processes/spaces. On error, each row's Routes stays as
	// the empty slice toStApp seeded; tristate signalling on this path
	// is intentionally minimal (the summary path carries the full
	// _meta.unavailable / _meta.errors envelope).
	routesByApp, _ := fetchRoutesForApps(ctx, cfClient, appGUIDs)

	apps := make([]StApp, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		s := toStApp(r)
		if proc, ok := processes[r.GUID]; ok {
			mem := proc.MemoryInMB
			disk := proc.DiskInMB
			s.Memory = &mem
			s.DiskQuota = &disk
			s.Instances = proc.Instances
		}
		if space, ok := spaces[s.SpaceGUID]; ok {
			s.SpaceName = space.Name
		}
		if rts, ok := routesByApp[r.GUID]; ok {
			s.Routes = rts
		}
		apps = append(apps, s)
	}
	return ctx.JSON(http.StatusOK, StratosPagedResponse[StApp]{
		Resources:  apps,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// getNativeSpaces dispatches on ?return=
//   - counts: per_page=1, totalResults only (fast path — no list drain)
//   - (default): single CAPI page passthrough, Stratos paged envelope.
//     Caller's per_page/page forward verbatim to /v3/spaces; absent, V3
//     server defaults apply.
func (c *CloudFoundrySpecification) getNativeSpaces(ctx echo.Context) (err error) {
	cnsiGUID := ctx.Param("cnsiGuid")
	rows := 0
	start := time.Now()
	defer logHandlerTiming("getNativeSpaces", cnsiGUID, start, &err, &rows)

	userGUID, uerr := c.getUserGUID(ctx)
	if uerr != nil {
		err = echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
		return err
	}

	cfClient, cerr := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if cerr != nil {
		err = cerr
		return err
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	if ctx.QueryParam("return") == "counts" {
		params := capi.NewQueryParams().WithPerPage(1)
		cStart := time.Now()
		raw, lerr := cfClient.Spaces().List(ctx.Request().Context(), params)
		cRows, cTotal := -1, -1
		if raw != nil {
			cRows = len(raw.Resources)
			cTotal = raw.Pagination.TotalResults
		}
		logCapiTiming("getNativeSpaces.counts", 1, 1, -1, cStart, lerr, cRows, cTotal)
		if lerr != nil {
			err = echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
			return err
		}
		spaces := make([]StSpace, 0, len(raw.Resources))
		for _, r := range raw.Resources {
			spaces = append(spaces, toStSpace(r))
		}
		rows = len(spaces)
		return ctx.JSON(http.StatusOK, StSpacesResponse{Resources: spaces, TotalResults: raw.Pagination.TotalResults})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(capi.NewQueryParams(), perPage, page, present)

	pStart := time.Now()
	raw, lerr := cfClient.Spaces().List(ctx.Request().Context(), params)
	pRows, pTotal := -1, -1
	if raw != nil {
		pRows = len(raw.Resources)
		pTotal = raw.Pagination.TotalResults
	}
	logCapiTiming("getNativeSpaces.page", page, perPage, 0, pStart, lerr, pRows, pTotal)
	if lerr != nil {
		err = echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		return err
	}

	// Enrich each space with per-space app + route counts via two filtered
	// /v3/apps and /v3/routes calls (one each, batched on space_guids).
	// Lazy-non-fatal: enrichment failures degrade silently to count=0 —
	// same default-path policy as getNativeApps' process / space joins.
	spaceGUIDs := make([]string, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		if r.GUID != "" {
			spaceGUIDs = append(spaceGUIDs, r.GUID)
		}
	}
	appCounts, _ := fetchAppCountsForSpaces(ctx, cfClient, spaceGUIDs)
	routeCounts, _ := fetchRouteCountsForSpaces(ctx, cfClient, spaceGUIDs)

	spaces := make([]StSpace, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		s := toStSpace(r)
		s.AppCount = appCounts[r.GUID]
		s.RouteCount = routeCounts[r.GUID]
		spaces = append(spaces, s)
	}
	rows = len(spaces)

	return ctx.JSON(http.StatusOK, StratosPagedResponse[StSpace]{
		Resources:  spaces,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}

// listAllRoutes drains /v3/routes and returns the full set plus the total
// count. Page 1 synchronous; pages 2..N parallel with bounded concurrency.
// Mirrors listAllOrgs/listAllSpaces/listAllApps.
func listAllRoutes(ctx context.Context, cfClient capi.Client) ([]capi.Route, int, error) {
	firstParams := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
	firstParams.Page = 1
	first, err := cfClient.Routes().List(ctx, firstParams)
	if err != nil {
		return nil, 0, err
	}
	totalResults := first.Pagination.TotalResults
	totalPages := first.Pagination.TotalPages
	all := make([]capi.Route, 0, totalResults)
	all = append(all, first.Resources...)
	if totalPages <= 1 {
		return all, totalResults, nil
	}

	pageResources := make([][]capi.Route, totalPages+1)
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(maxParallelPages)
	for page := 2; page <= totalPages; page++ {
		p := page
		g.Go(func() error {
			params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
			params.Page = p
			raw, err := cfClient.Routes().List(gctx, params)
			if err != nil {
				return err
			}
			pageResources[p] = raw.Resources
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, 0, err
	}
	for p := 2; p <= totalPages; p++ {
		all = append(all, pageResources[p]...)
	}
	return all, totalResults, nil
}

// populateRouteDestinations fills routes[i].AppGUIDs from CF v3's
// /v3/routes/{guid}/destinations endpoint, one request per route, with
// bounded parallelism (maxParallelPages).
//
// CF v3 doesn't return destinations inline on the list endpoint, so the
// Route cell can't show mapped apps without this extra fan-out. For a space
// with N routes this costs N CAPI calls; bounded concurrency keeps the worst
// case predictable on large spaces without overwhelming CAPI.
//
// Errors on any one destinations call are logged and the route's AppGUIDs
// stays nil — the UI will render the route without app segments rather than
// failing the whole list. Treat partial data as acceptable; the page still
// renders.
func populateRouteDestinations(ctx context.Context, cfClient capi.Client, routes []StRoute) {
	if len(routes) == 0 {
		return
	}
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(maxParallelPages)
	for i := range routes {
		idx := i
		guid := routes[idx].GUID
		g.Go(func() error {
			dests, derr := cfClient.Routes().ListDestinations(gctx, guid)
			if derr != nil {
				log.Warnf("routes: ListDestinations(%s) failed: %v", guid, derr)
				return nil
			}
			if dests == nil || len(dests.Destinations) == 0 {
				return nil
			}
			appGUIDs := make([]string, 0, len(dests.Destinations))
			for _, d := range dests.Destinations {
				if d.App.GUID != "" {
					appGUIDs = append(appGUIDs, d.App.GUID)
				}
			}
			routes[idx].AppGUIDs = appGUIDs
			return nil
		})
	}
	_ = g.Wait()
}

// getNativeRouteCount dispatches on ?return=
//   - counts (default legacy path): per_page=1, totalResults only. Kept as
//     the default because home-page card count + endpoint-data route count
//     only need the total; paying to drain every route + every destination
//     would balloon the home-page load.
//   - (none or any other value): full list, paginated, with each route's
//     mapped apps resolved via ListDestinations. Used by the
//     CloudFoundrySpaceRoutesSignalComponent.
//
// The query-param dispatch mirrors getNativeOrgs/getNativeApps/getNativeSpaces.
// "counts" retains the original wire format on the same URL so endpoint-data
// consumers don't need to change URLs.
func (c *CloudFoundrySpecification) getNativeRouteCount(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
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
		// Request per_page=1 — we only need the total count, not all resources.
		params := capi.NewQueryParams().WithPerPage(1)
		raw, err := cfClient.Routes().List(ctx.Request().Context(), params)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		return ctx.JSON(http.StatusOK, StRoutesResponse{
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	resources, totalResults, err := listAllRoutes(ctx.Request().Context(), cfClient)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	routes := make([]StRoute, 0, len(resources))
	for _, r := range resources {
		routes = append(routes, toStRoute(r, cnsiGUID))
	}
	populateRouteDestinations(ctx.Request().Context(), cfClient, routes)
	return ctx.JSON(http.StatusOK, StRoutesResponse{
		Resources:    routes,
		TotalResults: totalResults,
	})
}

func (c *CloudFoundrySpecification) getNativeOrgDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(ctx.Request().Context(), c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	r, err := cfClient.Organizations().Get(ctx.Request().Context(), orgGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}

	detail := StOrgDetail{
		StOrg:  toStOrg(*r),
		Spaces: []StSpace{},
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, detail)
}

// getNativeOrgSpaces handles GET /pp/v1/cf/org/{cnsiGuid}/{orgGuid}/spaces.
//
// Returns spaces for one org as a single CAPI page passthrough. Caller's
// per_page/page forward verbatim to /v3/spaces?organization_guids={orgGuid};
// absent, V3 server defaults apply.
func (c *CloudFoundrySpecification) getNativeOrgSpaces(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	orgGUID := ctx.Param("orgGuid")
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
		params := capi.NewQueryParams().
			WithPerPage(1).
			WithFilter("organization_guids", orgGUID)
		raw, lerr := cfClient.Spaces().List(ctx.Request().Context(), params)
		if lerr != nil {
			return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
		}
		return ctx.JSON(http.StatusOK, StSpacesResponse{
			Resources:    []StSpace{},
			TotalResults: raw.Pagination.TotalResults,
		})
	}

	perPage, page, present := parsePerPageAndPage(ctx)
	params := applyPagingParams(
		capi.NewQueryParams().WithFilter("organization_guids", orgGUID),
		perPage, page, present,
	)
	raw, lerr := cfClient.Spaces().List(ctx.Request().Context(), params)
	if lerr != nil {
		return echo.NewHTTPError(http.StatusBadGateway, lerr.Error())
	}

	// Enrich with per-space app + route counts (mirror getNativeSpaces).
	spaceGUIDs := make([]string, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		if r.GUID != "" {
			spaceGUIDs = append(spaceGUIDs, r.GUID)
		}
	}
	appCounts, _ := fetchAppCountsForSpaces(ctx, cfClient, spaceGUIDs)
	routeCounts, _ := fetchRouteCountsForSpaces(ctx, cfClient, spaceGUIDs)

	spaces := make([]StSpace, 0, len(raw.Resources))
	for _, r := range raw.Resources {
		s := toStSpace(r)
		s.AppCount = appCounts[r.GUID]
		s.RouteCount = routeCounts[r.GUID]
		spaces = append(spaces, s)
	}
	return ctx.JSON(http.StatusOK, StratosPagedResponse[StSpace]{
		Resources:  spaces,
		Pagination: BuildPaginationMeta(ctx, page, perPage, raw.Pagination.TotalResults),
	})
}
