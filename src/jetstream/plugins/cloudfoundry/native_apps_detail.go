// src/jetstream/plugins/cloudfoundry/native_apps_detail.go
package cloudfoundry

import (
	"context"
	"net/http"
	"time"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"
)

// StProcess mirrors the v3 web-process shape — the runtime configuration
// legacy v2 callers historically read off the app entity itself (memory,
// disk, instances, command, health check). Sourced from
// /v3/apps/:guid/processes/web (one row).
type StProcess struct {
	GUID                                string `json:"guid"`
	Type                                string `json:"type"`
	Instances                           int    `json:"instances"`
	MemoryMB                            int    `json:"memoryMb"`
	DiskMB                              int    `json:"diskMb"`
	LogRateLimitInBytesPerSecond        int    `json:"logRateLimitInBytesPerSecond"`
	Command                             string `json:"command,omitempty"`
	HealthCheckType                     string `json:"healthCheckType,omitempty"`
	HealthCheckEndpoint                 string `json:"healthCheckEndpoint,omitempty"`
	HealthCheckInvocationTimeoutSeconds int    `json:"healthCheckInvocationTimeoutSeconds,omitempty"`
	HealthCheckTimeoutSeconds           int    `json:"healthCheckTimeoutSeconds,omitempty"`
	ReadinessHealthCheckType            string `json:"readinessHealthCheckType,omitempty"`
	Ports                               []int  `json:"ports"`
}

// StDropletBuildpack mirrors a single buildpack entry inside a v3 droplet.
// Buildpack lifecycle apps carry one entry per buildpack the staging
// process detected; docker lifecycle apps carry zero.
type StDropletBuildpack struct {
	Name          string `json:"name"`
	DetectOutput  string `json:"detectOutput,omitempty"`
	Version       string `json:"version,omitempty"`
	BuildpackName string `json:"buildpackName,omitempty"`
}

// StDroplet mirrors the v3 current-droplet shape. The droplet is the
// staged artifact CF runs — buildpack outputs + stack image, OR a
// docker image ref. Sourced from /v3/apps/:guid/droplets/current.
// Returned as null in StAppDetail when the app has never been staged.
type StDroplet struct {
	GUID          string               `json:"guid"`
	State         string               `json:"state"`
	Error         string               `json:"error,omitempty"`
	LifecycleType string               `json:"lifecycleType"`
	Stack         string               `json:"stack,omitempty"`
	Buildpacks    []StDropletBuildpack `json:"buildpacks"`
	Image         string               `json:"image,omitempty"`
	CreatedAt     string               `json:"createdAt"`
	UpdatedAt     string               `json:"updatedAt"`
}

// StPackage mirrors the most-recent v3 package — the uploaded source bits
// (or docker image reference) that get staged into a droplet. `state`
// drives the legacy package_state Summary tab field. Sourced from
// /v3/apps/:guid/packages?order_by=-created_at&per_page=1.
type StPackage struct {
	GUID      string `json:"guid"`
	State     string `json:"state"`
	Type      string `json:"type"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// StBuild mirrors the most-recent v3 build — the staging job that turns a
// package into a droplet. `error` populates the legacy
// staging_failed_description Summary tab field. Sourced from
// /v3/apps/:guid/builds?order_by=-created_at&per_page=1.
type StBuild struct {
	GUID      string `json:"guid"`
	State     string `json:"state"`
	Error     string `json:"error,omitempty"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// StAppDetail is the composed v3 app-detail envelope returned by
// GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}. The Stratos data model is the
// canonical contract: this shape is what the frontend reads, regardless
// of whether the backend sources from CF v3 (today) or v2 (future
// fallback). Missing sub-resources are listed in `_meta.unavailable` per
// the V2/V3 tristate pattern; frontend renders those cells as
// "Not Available" rather than blanking them.
type StAppDetail struct {
	App        StApp        `json:"app"`
	Process    *StProcess   `json:"process"`
	Droplet    *StDroplet   `json:"droplet"`
	Pkg        *StPackage   `json:"pkg"`
	Build      *StBuild     `json:"build"`
	SSHEnabled bool         `json:"sshEnabled"`
	Meta       *StratosMeta `json:"_meta,omitempty"`
}

// StEnvVars is the composed v3 env-vars envelope returned by
// GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/env. Mirrors what
// /v3/apps/:guid/env returns (system_env_json, environment_variables,
// running_env_json, staging_env_json, application_env_json), normalised
// to the field names the frontend expects. SystemProvided is `any`
// because VCAP_SERVICES / VCAP_APPLICATION inner shapes are
// broker-defined and vary wildly.
type StEnvVars struct {
	// All four envelopes are typed map[string]interface{} to match the
	// capi wire shape. Most user-set env vars resolve to strings, but CF
	// v3 also lets brokers inject typed values (numbers, bools, nested
	// objects) into VCAP_SERVICES — flattening to map[string]string would
	// lose those.
	Environment         map[string]interface{} `json:"environment"`
	SystemProvided      map[string]interface{} `json:"systemProvided"`
	ApplicationProvided map[string]interface{} `json:"applicationProvided,omitempty"`
	RunningProvided     map[string]interface{} `json:"runningProvided,omitempty"`
	StagingProvided     map[string]interface{} `json:"stagingProvided,omitempty"`
}

// detail-derived field tags — surface in _meta.unavailable when the
// corresponding sub-fetch failed. Mirrors the per-source tagging used
// by the apps-list summary handler (processDerivedFields, etc.) so the
// frontend's tristate code can rely on consistent field names.
var (
	detailProcessFields = []string{"process", "memoryMb", "diskMb", "instances", "command", "healthCheckType", "ports"}
	detailDropletFields = []string{"droplet", "stack", "buildpacks"}
	detailPackageFields = []string{"pkg", "packageState"}
	detailBuildFields   = []string{"build", "stagingFailedDescription"}
	detailSSHFields     = []string{"sshEnabled"}
)

// ---------------------------------------------------------------------------
// Converters: capi → Stratos shape
// ---------------------------------------------------------------------------

// derefStr / derefInt safely deref optional capi fields. Many v3 wire
// fields come through as *string / *int because their absence and zero
// value are semantically distinct on the CF side; flatten to the
// zero-value Stratos wire shape (omitempty drops them from JSON).
func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefInt(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

func toStProcess(p capi.Process) StProcess {
	out := StProcess{
		GUID:                         p.GUID,
		Type:                         p.Type,
		Instances:                    p.Instances,
		MemoryMB:                     p.MemoryInMB,
		DiskMB:                       p.DiskInMB,
		LogRateLimitInBytesPerSecond: derefInt(p.LogRateLimitInBytesPerSecond),
		Command:                      derefStr(p.Command),
		Ports:                        []int{},
	}
	if p.HealthCheck != nil {
		out.HealthCheckType = p.HealthCheck.Type
		if p.HealthCheck.Data != nil {
			out.HealthCheckEndpoint = derefStr(p.HealthCheck.Data.Endpoint)
			out.HealthCheckTimeoutSeconds = derefInt(p.HealthCheck.Data.Timeout)
			out.HealthCheckInvocationTimeoutSeconds = derefInt(p.HealthCheck.Data.InvocationTimeout)
		}
	}
	if p.ReadinessHealthCheck != nil {
		out.ReadinessHealthCheckType = p.ReadinessHealthCheck.Type
	}
	return out
}

func toStDroplet(d capi.Droplet) StDroplet {
	out := StDroplet{
		GUID:          d.GUID,
		State:         d.State,
		Error:         derefStr(d.Error),
		LifecycleType: d.Lifecycle.Type,
		Buildpacks:    []StDropletBuildpack{},
		CreatedAt:     d.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     d.UpdatedAt.Format(time.RFC3339),
	}
	if stack, ok := d.Lifecycle.Data["stack"].(string); ok {
		out.Stack = stack
	}
	for _, bp := range d.Buildpacks {
		out.Buildpacks = append(out.Buildpacks, StDropletBuildpack{
			Name:          bp.Name,
			DetectOutput:  bp.DetectOutput,
			Version:       derefStr(bp.Version),
			BuildpackName: derefStr(bp.BuildpackName),
		})
	}
	out.Image = derefStr(d.Image)
	return out
}

func toStPackage(p capi.Package) StPackage {
	return StPackage{
		GUID:      p.GUID,
		State:     p.State,
		Type:      p.Type,
		CreatedAt: p.CreatedAt.Format(time.RFC3339),
		UpdatedAt: p.UpdatedAt.Format(time.RFC3339),
	}
}

func toStBuild(b capi.Build) StBuild {
	out := StBuild{
		GUID:      b.GUID,
		State:     b.State,
		CreatedAt: b.CreatedAt.Format(time.RFC3339),
		UpdatedAt: b.UpdatedAt.Format(time.RFC3339),
	}
	if b.Error != nil {
		out.Error = *b.Error
	}
	return out
}

// ---------------------------------------------------------------------------
// Sub-fetch helpers — each returns its own error so the caller can record
// per-source failures in _meta.unavailable without failing the envelope.
// ---------------------------------------------------------------------------

func fetchWebProcessForApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Process, error) {
	params := capi.NewQueryParams()
	params.PerPage = 1
	params.Filters["app_guids"] = []string{appGUID}
	params.Filters["types"] = []string{"web"}
	resp, err := client.Processes().List(ctx, params)
	if err != nil {
		return nil, err
	}
	if len(resp.Resources) == 0 {
		return nil, nil
	}
	return &resp.Resources[0], nil
}

func fetchCurrentDropletForApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Droplet, error) {
	d, err := client.Apps().GetCurrentDroplet(ctx, appGUID)
	if err != nil {
		return nil, err
	}
	if d == nil {
		return nil, nil
	}
	return d, nil
}

func fetchLatestPackageForApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Package, error) {
	params := capi.NewQueryParams()
	params.PerPage = 1
	params.OrderBy = "-created_at"
	params.Filters["app_guids"] = []string{appGUID}
	resp, err := client.Packages().List(ctx, params)
	if err != nil {
		return nil, err
	}
	if len(resp.Resources) == 0 {
		return nil, nil
	}
	return &resp.Resources[0], nil
}

func fetchLatestBuildForApp(ctx context.Context, client capi.Client, appGUID string) (*capi.Build, error) {
	params := capi.NewQueryParams()
	params.PerPage = 1
	params.OrderBy = "-created_at"
	params.Filters["app_guids"] = []string{appGUID}
	resp, err := client.Builds().List(ctx, params)
	if err != nil {
		return nil, err
	}
	if len(resp.Resources) == 0 {
		return nil, nil
	}
	return &resp.Resources[0], nil
}

func fetchSSHEnabledForApp(ctx context.Context, client capi.Client, appGUID string) (bool, error) {
	feature, err := client.Apps().GetFeature(ctx, appGUID, "ssh")
	if err != nil {
		return false, err
	}
	if feature == nil {
		return false, nil
	}
	return feature.Enabled, nil
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// getNativeAppDetail handles GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}.
//
// Dispatches on `?return=` mode, matching the list-endpoint convention
// (counts/summary/recent on /cf/apps/:cnsiGuid). Three detail modes are
// defined for single-resource reads — slices migrating other detail
// pages (service-instance, org, space) follow the same convention:
//
//   - (default)         — basic Stratos shape, no sub-resource composition.
//     One CAPI call: cfClient.Apps().Get.
//   - ?return=summary   — list-page-summary shape: base app + web process
//     (memory / disk / instances). Cheap. Mirrors what
//     /cf/apps/:cnsi?return=summary returns per row.
//   - ?return=details   — full composed envelope (StAppDetail): app + web
//     process + current droplet + latest package +
//     latest build + ssh feature flag. Expensive
//     (5 CAPI calls fanned out concurrently). Backs
//     the Summary tab.
//
// Per-source failures in `?return=details` are non-fatal: missing
// sub-resources surface in `_meta.unavailable`, the envelope still
// returns 200 with partial data, and the frontend tristate pattern
// renders "Not Available" cells. A missing app itself remains a 4xx
// for the whole request — that's a route-level error, not tristate.
func (c *CloudFoundrySpecification) getNativeAppDetail(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	app, err := cfClient.Apps().Get(reqCtx, appGUID)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)

	switch ctx.QueryParam("return") {
	case "details":
		return ctx.JSON(http.StatusOK, c.composeAppDetails(reqCtx, cfClient, *app, appGUID))
	case "summary":
		return ctx.JSON(http.StatusOK, c.composeAppSummaryEntry(reqCtx, cfClient, *app, appGUID))
	default:
		return ctx.JSON(http.StatusOK, toStApp(*app))
	}
}

// composeAppSummaryEntry returns the apps-list-summary-style row for a
// single app — base StApp + web-process scale fields. Cheap (one extra
// CAPI call beyond the app itself); used when the caller wants the
// memory/disk/instances cells but doesn't need droplet/pkg/build.
func (c *CloudFoundrySpecification) composeAppSummaryEntry(reqCtx context.Context, cfClient capi.Client, app capi.App, appGUID string) StApp {
	process, _ := fetchWebProcessForApp(reqCtx, cfClient, appGUID)
	return composeStAppSummary(app, process, nil, []StAppRoute{})
}

// composeAppDetails returns the full StAppDetail envelope for the
// Summary tab. Sub-resource fetches run concurrently via errgroup.
// Per-source failures are captured per-fetcher and surface in
// _meta.unavailable rather than short-circuiting the envelope.
func (c *CloudFoundrySpecification) composeAppDetails(reqCtx context.Context, cfClient capi.Client, app capi.App, appGUID string) StAppDetail {
	var (
		process    *capi.Process
		droplet    *capi.Droplet
		pkg        *capi.Package
		build      *capi.Build
		sshEnabled bool
		routes     []StAppRoute
		procErr    error
		dropletErr error
		pkgErr     error
		buildErr   error
		sshErr     error
		routesErr  error
	)

	g, gctx := errgroup.WithContext(reqCtx)
	g.Go(func() error {
		process, procErr = fetchWebProcessForApp(gctx, cfClient, appGUID)
		return nil
	})
	g.Go(func() error {
		droplet, dropletErr = fetchCurrentDropletForApp(gctx, cfClient, appGUID)
		return nil
	})
	g.Go(func() error {
		pkg, pkgErr = fetchLatestPackageForApp(gctx, cfClient, appGUID)
		return nil
	})
	g.Go(func() error {
		build, buildErr = fetchLatestBuildForApp(gctx, cfClient, appGUID)
		return nil
	})
	g.Go(func() error {
		sshEnabled, sshErr = fetchSSHEnabledForApp(gctx, cfClient, appGUID)
		return nil
	})
	g.Go(func() error {
		routes, routesErr = fetchAppRoutesForDetail(gctx, cfClient, appGUID)
		return nil
	})
	_ = g.Wait()

	out := StAppDetail{
		App:        toStApp(app),
		SSHEnabled: sshEnabled,
	}

	var unavailable []string
	if procErr != nil || process == nil {
		unavailable = append(unavailable, detailProcessFields...)
	} else {
		stProc := toStProcess(*process)
		out.Process = &stProc
		// The web-process scale config also populates StApp.Memory /
		// DiskQuota / Instances on the embedded app sub-object so consumers
		// can render those cells without walking into .process.
		mem := process.MemoryInMB
		disk := process.DiskInMB
		out.App.Memory = &mem
		out.App.DiskQuota = &disk
		out.App.Instances = process.Instances
	}
	if dropletErr != nil {
		unavailable = append(unavailable, detailDropletFields...)
	} else if droplet != nil {
		stDrop := toStDroplet(*droplet)
		out.Droplet = &stDrop
	}
	if pkgErr != nil {
		unavailable = append(unavailable, detailPackageFields...)
	} else if pkg != nil {
		stPkg := toStPackage(*pkg)
		out.Pkg = &stPkg
	}
	if buildErr != nil {
		unavailable = append(unavailable, detailBuildFields...)
	} else if build != nil {
		stBuild := toStBuild(*build)
		out.Build = &stBuild
	}
	if sshErr != nil {
		unavailable = append(unavailable, detailSSHFields...)
	}
	if routesErr == nil && len(routes) > 0 {
		out.App.Routes = routes
	}

	if len(unavailable) > 0 {
		out.Meta = &StratosMeta{Unavailable: unavailable}
	}
	return out
}

// fetchAppRoutesForDetail returns the routes mapped to a single app as
// flat StAppRoute records (GUID + URL). Mirrors the apps-list helper
// fetchRoutesForApps but takes a context.Context (not echo.Context) and
// scopes to one app — the detail handler's hot path. Server-rendered
// URL is what the Visit button needs; no port/host parsing required.
func fetchAppRoutesForDetail(ctx context.Context, cfClient capi.Client, appGUID string) ([]StAppRoute, error) {
	out := []StAppRoute{}
	for page := 1; ; page++ {
		params := capi.NewQueryParams().WithPerPage(fullPagePerRequest)
		params.Page = page
		params.Filters["app_guids"] = []string{appGUID}
		raw, err := cfClient.Routes().List(ctx, params)
		if err != nil {
			return nil, err
		}
		for _, r := range raw.Resources {
			out = append(out, StAppRoute{GUID: r.GUID, URL: r.URL})
		}
		if raw.Pagination.Next == nil || page >= raw.Pagination.TotalPages {
			break
		}
	}
	return out, nil
}

// getNativeAppEnv handles GET /pp/v1/cf/apps/{cnsiGuid}/{appGuid}/env.
//
// Returns the v3 environment envelope normalised to the StEnvVars shape
// the Stratos data model expects. Sourced from /v3/apps/:guid/env which
// returns environment_variables (user-set), system_env_json (VCAP_*),
// application_env_json, running_env_json, staging_env_json all in one
// response — no fan-out needed.
func (c *CloudFoundrySpecification) getNativeAppEnv(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	appGUID := ctx.Param("appGuid")
	if cnsiGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and appGuid are required")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	envelope, err := cfClient.Apps().GetEnv(reqCtx, appGUID)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	out := StEnvVars{
		Environment:         envelope.EnvironmentVariables,
		SystemProvided:      envelope.SystemEnvJSON,
		ApplicationProvided: envelope.ApplicationEnvJSON,
		RunningProvided:     envelope.RunningEnvJSON,
		StagingProvided:     envelope.StagingEnvJSON,
	}
	if out.Environment == nil {
		out.Environment = map[string]interface{}{}
	}
	if out.SystemProvided == nil {
		out.SystemProvided = map[string]interface{}{}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}
