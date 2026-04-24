// src/jetstream/plugins/cloudfoundry/native_apps_stats.go
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// StAppStatsInstance is the per-instance Stratos-shape entry returned by
// the app-stats read. CF V3 returns many fields under /v3/processes/{guid}/stats
// (usage, host, ports, uptime, quotas); the app-wall running-instances
// indicator only needs `state` to count RUNNING vs desired, so we trim the
// surface to keep the polling payload small.
type StAppStatsInstance struct {
	Index int    `json:"index"`
	State string `json:"state"`
}

// StAppStatsResponse is the Stratos-shape JSON returned from the app-stats
// read. Callers derive "running / desired" by counting `instances[].state ==
// "RUNNING"` and comparing to the app's desired instance count (already on
// StApp.instances, not duplicated here).
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
		out.Instances = append(out.Instances, StAppStatsInstance{
			Index: inst.Index,
			State: inst.State,
		})
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}
