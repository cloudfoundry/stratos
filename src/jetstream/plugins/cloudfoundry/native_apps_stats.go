// src/jetstream/plugins/cloudfoundry/native_apps_stats.go
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// StAppStatsInstance is the per-instance Stratos-shape entry returned by
// the app-stats read. Mirrors the v3 /processes/{guid}/stats per-instance
// shape: index/state for the running-count indicator (cheap callers), plus
// uptime / quotas / usage for the auto-scaler / app-monitor / Instances
// tab consumers that need the full picture. Numeric fields default to 0
// when CF reports an instance in a non-RUNNING state where the metrics
// aren't meaningful.
type StAppStatsInstance struct {
	Index     int                  `json:"index"`
	State     string               `json:"state"`
	Uptime    int                  `json:"uptime"`
	MemQuota  int64                `json:"memQuota"`
	DiskQuota int64                `json:"diskQuota"`
	FdsQuota  int                  `json:"fdsQuota"`
	Host      string               `json:"host,omitempty"`
	Usage     *StProcessUsage      `json:"usage,omitempty"`
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

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}
