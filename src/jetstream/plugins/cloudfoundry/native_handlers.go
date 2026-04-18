// src/jetstream/plugins/cloudfoundry/native_handlers.go
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

const stratosSchemaVersion = "1"

func (c *CloudFoundrySpecification) getUserGUID(ctx echo.Context) (string, error) {
	return c.portalProxy.GetSessionStringValue(ctx, "user_id")
}

func (c *CloudFoundrySpecification) getNativeOrgs(ctx echo.Context) error {
	return echo.NewHTTPError(http.StatusNotImplemented, "not yet implemented")
}

func (c *CloudFoundrySpecification) getNativeApps(ctx echo.Context) error {
	return echo.NewHTTPError(http.StatusNotImplemented, "not yet implemented")
}

func (c *CloudFoundrySpecification) getNativeRouteCount(ctx echo.Context) error {
	return echo.NewHTTPError(http.StatusNotImplemented, "not yet implemented")
}

func (c *CloudFoundrySpecification) getNativeOrgDetail(ctx echo.Context) error {
	return echo.NewHTTPError(http.StatusNotImplemented, "not yet implemented")
}

func (c *CloudFoundrySpecification) getNativeOrgSpaces(ctx echo.Context) error {
	return echo.NewHTTPError(http.StatusNotImplemented, "not yet implemented")
}
