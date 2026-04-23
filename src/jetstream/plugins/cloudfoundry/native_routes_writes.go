// src/jetstream/plugins/cloudfoundry/native_routes_writes.go
package cloudfoundry

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
)

// unmapRouteFromApp handles DELETE /pp/v1/cf/routes/{cnsiGuid}/{routeGuid}/apps/{appGuid}
// — the Stratos-shape wrapper around CF v3's two-step unmap semantics.
//
// CAPI v3 has no "unmap by (route, app)" endpoint. Unbinding is modeled as a
// DELETE of the destination record on a route. The destination GUID is only
// known after listing /v3/routes/{routeGuid}/destinations, so the handler is
// composed of:
//  1. GET /v3/routes/{routeGuid}/destinations  — resolve the dest.guid whose
//     app.guid matches the appGuid path parameter.
//  2. DELETE /v3/routes/{routeGuid}/destinations/{destGuid} — perform the unmap.
//
// If the list succeeds but no destination binds the requested app, the target
// resource (the mapping) does not exist, so the handler returns 404 without
// attempting a DELETE. Upstream errors on either step flow through
// handleCapiError to preserve CF's error envelope classification.
func (cf *CloudFoundrySpecification) unmapRouteFromApp(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	routeGUID := c.Param("routeGuid")
	appGUID := c.Param("appGuid")
	if cnsiGUID == "" || routeGUID == "" || appGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid, routeGuid, and appGuid are required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	cfClient, err := newCapiClient(c.Request().Context(), cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	ctx := c.Request().Context()
	destinations, listErr := cfClient.Routes().ListDestinations(ctx, routeGUID)
	if listErr != nil {
		return handleCapiError(c, listErr)
	}

	var destGUID string
	for _, d := range destinations.Destinations {
		if d.App.GUID == appGUID {
			destGUID = d.GUID
			break
		}
	}
	if destGUID == "" {
		return echo.NewHTTPError(http.StatusNotFound,
			fmt.Sprintf("no destination binding app %s on route %s", appGUID, routeGUID))
	}

	if removeErr := cfClient.Routes().RemoveDestination(ctx, routeGUID, destGUID); removeErr != nil {
		return handleCapiError(c, removeErr)
	}

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	c.Response().WriteHeader(http.StatusNoContent)
	return nil
}

// deleteNativeRoute handles DELETE /pp/v1/cf/routes/{cnsiGuid}/{routeGuid} —
// the Stratos-shape wrapper around CF v3 /v3/routes/{guid}. Returns the
// full route to the trash, not just the app mapping; use unmapRouteFromApp
// to remove an app destination while keeping the route itself.
//
// CF v3 returns 202 + a job reference; we hand it to the stratosjobs
// fast-path wrapper identically to deleteNativeApp: 200 on fast resolve,
// 202 with {id, state, startedAt} when the job outlives the window.
// Falls back to bare 202 if the async-job contract isn't wired (plugin
// ordering / tests).
func (cf *CloudFoundrySpecification) deleteNativeRoute(c echo.Context) error {
	cnsiGUID := c.Param("cnsiGuid")
	routeGUID := c.Param("routeGuid")
	if cnsiGUID == "" || routeGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cnsiGuid and routeGuid are required")
	}

	userGUID, err := cf.getUserGUID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := c.Request().Context()
	cfClient, err := newCapiClient(reqCtx, cf.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	job, deleteErr := cfClient.Routes().Delete(reqCtx, routeGUID)
	if deleteErr != nil {
		return handleCapiError(c, deleteErr)
	}
	if job == nil || job.GUID == "" {
		return echo.NewHTTPError(http.StatusBadGateway, "route delete: no job id returned from CF")
	}

	if cf.asyncTracker == nil || cf.asyncTranslator == nil {
		c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
		c.Response().WriteHeader(http.StatusAccepted)
		return nil
	}

	ref := CFJobRef{CnsiGUID: cnsiGUID, UserGUID: userGUID, JobGUID: job.GUID}
	res := stratosjobs.RunFastPath(reqCtx, cf.asyncTracker, cf.asyncTranslator, ref, stratosjobs.FastPathOptions{
		Kind: "cf.route.delete",
	})

	c.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	if res.Resolved {
		if res.State == stratosjobs.JobStateFailed {
			return c.JSON(http.StatusBadGateway, map[string]interface{}{
				"state":  res.State,
				"errors": res.Errors,
			})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"state":  res.State,
			"result": res.Result,
		})
	}
	return c.JSON(http.StatusAccepted, res.HandoffJob)
}
