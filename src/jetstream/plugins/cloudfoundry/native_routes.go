// src/jetstream/plugins/cloudfoundry/native_routes.go
package cloudfoundry

import "github.com/labstack/echo/v4"

// addNativeRoutes registers Stratos-native CF v3 routes on the CF plugin.
// Called from AddSessionGroupRoutes.
func (c *CloudFoundrySpecification) addNativeRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/cf/orgs/:cnsiGuid", c.getNativeOrgs)
	echoGroup.GET("/cf/apps/:cnsiGuid", c.getNativeApps)
	echoGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid", c.deleteNativeApp)
	echoGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid/instances/:index", c.deleteAppInstance)
	echoGroup.PATCH("/cf/apps/:cnsiGuid/:appGuid", c.patchApp)
	echoGroup.POST("/cf/apps/:cnsiGuid/:appGuid/actions/:action", c.appAction)
	echoGroup.GET("/cf/spaces/:cnsiGuid", c.getNativeSpaces)
	echoGroup.GET("/cf/routes/:cnsiGuid", c.getNativeRouteCount)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid", c.getNativeOrgDetail)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid/spaces", c.getNativeOrgSpaces)
}
