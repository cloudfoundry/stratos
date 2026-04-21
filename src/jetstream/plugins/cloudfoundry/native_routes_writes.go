// src/jetstream/plugins/cloudfoundry/native_routes_writes.go
package cloudfoundry

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
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
