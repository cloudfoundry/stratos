// src/jetstream/plugins/cloudfoundry/native_apps_stats.go
package cloudfoundry

import (
	"net/http"
	"sync"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"golang.org/x/sync/errgroup"
)

// StAppStatsInstance is the per-instance Stratos-shape entry returned by
// the app-stats read. Mirrors the v3 /processes/{guid}/stats per-instance
// shape: index/state for the running-count indicator (cheap callers), plus
// uptime / quotas / usage for the auto-scaler / app-monitor / Instances
// tab consumers that need the full picture. Numeric fields default to 0
// when CF reports an instance in a non-RUNNING state where the metrics
// aren't meaningful.
type StAppStatsInstance struct {
	Index     int             `json:"index"`
	State     string          `json:"state"`
	Uptime    int             `json:"uptime"`
	MemQuota  int64           `json:"memQuota"`
	DiskQuota int64           `json:"diskQuota"`
	FdsQuota  int             `json:"fdsQuota"`
	Host      string          `json:"host,omitempty"`
	Usage     *StProcessUsage `json:"usage,omitempty"`
}

// StProcessUsage mirrors v3's process usage block. The auto-scaler /
// app-monitor reads cpu / mem / disk / time off this shape — keeping the
// field names normalised so the frontend wire shape is consistent across
// every "process metrics" response.
type StProcessUsage struct {
	Time string  `json:"time"`
	CPU  float64 `json:"cpu"`
	Mem  int64   `json:"mem"`
	Disk int64   `json:"disk"`
}

// StAppStatsResponse is the Stratos-shape JSON returned from the app-stats
// read. Callers derive "running / desired" by counting `instances[].state ==
// "RUNNING"` and comparing to the app's desired instance count (on StApp).
type StAppStatsResponse struct {
	Instances []StAppStatsInstance `json:"instances"`
}

// getAppStats handles GET /pp/v1/cf/app-stats/{cnsiGuid}/{appGuid} — a
// lightweight read of per-instance states for the web process of an app.
// Used by the app-wall running-instances indicator; callers poll this
// endpoint for the rows currently visible on the page and render "2/4"
// style text from the result.
//
// The handler resolves the web process GUID (which usually equals the
// app GUID but isn't guaranteed to be) and calls CF V3
// /v3/processes/{guid}/stats, trimming the (potentially large) stats
// payload down to just index + state per instance.
func (c *CloudFoundrySpecification) getAppStats(ctx echo.Context) error {
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

	procGUID, lookupErr := lookupWebProcessGUID(reqCtx, cfClient, appGUID)
	if lookupErr != nil {
		return handleCapiError(ctx, lookupErr)
	}

	stats, statsErr := cfClient.Processes().GetStats(reqCtx, procGUID)
	if statsErr != nil {
		return handleCapiError(ctx, statsErr)
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, buildStatsResponse(stats))
}

// StAppStatsBatchResponse is the Stratos-shape JSON returned from the
// batched app-stats read. Key = appGuid, value = stats response for that
// app. Apps with no web process / failed stats are omitted from the map
// (frontend treats absence as "no data yet" and falls back to the "—"
// placeholder, same as the single-app endpoint's error path).
type StAppStatsBatchResponse struct {
	Apps map[string]StAppStatsResponse `json:"apps"`
}

// maxParallelStatsCalls bounds the concurrent /v3/processes/{guid}/stats
// fan-out inside the batched app-stats handler. Each stats call is a
// separate CAPI roundtrip; on a 24-app page that's up to 24 concurrent
// calls, which we cap to keep CAPI happy. 8 chosen to match the existing
// listAllRoutes pattern.
const maxParallelStatsCalls = 8

// getAppStatsBatch handles GET /pp/v1/cf/app-stats/{cnsiGuid} (no appGuid
// path param) with ?app_guids=g1,g2,... query. Returns a map of per-app
// stats, structurally identical to the single-app endpoint but keyed by
// appGuid. Replaces the per-app polling pattern where each visible app
// row triggered its own HTTP request — measured at ~89% of all backend
// time on adepttech.
//
// Internally:
//  1. One /v3/processes?app_guids=...&type=web call resolves all web
//     process GUIDs in one shot (reusing fetchWebProcessesForApps).
//  2. Each app's /v3/processes/{guid}/stats fan-out runs concurrently
//     under an errgroup bounded by maxParallelStatsCalls.
//  3. Per-app failures are dropped from the response rather than
//     failing the whole batch — same lazy-non-fatal pattern as the
//     single-app endpoint's HTTP error branch.
func (c *CloudFoundrySpecification) getAppStatsBatch(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid is required")
	}
	rawGuids := ctx.QueryParam("app_guids")
	appGUIDs := splitNonEmpty(rawGuids, ",")
	if len(appGUIDs) == 0 {
		return ctx.JSON(http.StatusOK, StAppStatsBatchResponse{Apps: map[string]StAppStatsResponse{}})
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

	processes, lookupErr := fetchWebProcessesForApps(ctx, cfClient, appGUIDs)
	if lookupErr != nil {
		return handleCapiError(ctx, lookupErr)
	}

	out := StAppStatsBatchResponse{Apps: make(map[string]StAppStatsResponse, len(appGUIDs))}
	var mu sync.Mutex
	eg, egCtx := errgroup.WithContext(reqCtx)
	eg.SetLimit(maxParallelStatsCalls)
	for _, appGUID := range appGUIDs {
		proc, ok := processes[appGUID]
		if !ok || proc.GUID == "" {
			continue
		}
		ag, pg := appGUID, proc.GUID
		eg.Go(func() error {
			stats, statsErr := cfClient.Processes().GetStats(egCtx, pg)
			if statsErr != nil {
				// Per-app failure: skip rather than fail the batch.
				return nil
			}
			resp := buildStatsResponse(stats)
			mu.Lock()
			out.Apps[ag] = resp
			mu.Unlock()
			return nil
		})
	}
	_ = eg.Wait()

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}

// buildStatsResponse maps a CAPI process-stats payload to the Stratos
// wire shape. Shared between the single-app and batched handlers.
func buildStatsResponse(stats *capi.ProcessStats) StAppStatsResponse {
	out := StAppStatsResponse{Instances: make([]StAppStatsInstance, 0, len(stats.Resources))}
	for _, inst := range stats.Resources {
		entry := StAppStatsInstance{
			Index:     inst.Index,
			State:     inst.State,
			Uptime:    inst.Uptime,
			MemQuota:  inst.MemQuota,
			DiskQuota: inst.DiskQuota,
			FdsQuota:  inst.FdsQuota,
			Host:      inst.Host,
		}
		if inst.Usage != nil {
			entry.Usage = &StProcessUsage{
				Time: inst.Usage.Time,
				CPU:  inst.Usage.CPU,
				Mem:  inst.Usage.Mem,
				Disk: inst.Usage.Disk,
			}
		}
		out.Instances = append(out.Instances, entry)
	}
	return out
}
