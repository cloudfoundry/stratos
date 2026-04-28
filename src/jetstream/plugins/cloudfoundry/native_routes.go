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
	echoGroup.POST("/cf/apps/:cnsiGuid/:appGuid/scale", c.scaleApp)
	echoGroup.GET("/cf/app-stats/:cnsiGuid/:appGuid", c.getAppStats)
	echoGroup.DELETE("/cf/orgs/:cnsiGuid/:orgGuid", c.deleteNativeOrg)
	echoGroup.DELETE("/cf/spaces/:cnsiGuid/:spaceGuid", c.deleteNativeSpace)
	echoGroup.PUT("/cf/apps/:cnsiGuid/:appGuid/routes/:routeGuid", c.assignRouteToApp)
	echoGroup.GET("/cf/spaces/:cnsiGuid", c.getNativeSpaces)
	echoGroup.GET("/cf/routes/:cnsiGuid", c.getNativeRouteCount)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/routes", c.getAppRoutes)
	echoGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid", c.unmapRouteFromApp)
	echoGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid", c.deleteNativeRoute)
	echoGroup.POST("/cf/service_bindings/:cnsiGuid", c.createServiceBinding)
	echoGroup.DELETE("/cf/service_bindings/:cnsiGuid/:bindingGuid", c.deleteServiceBinding)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/service_bindings", c.getAppServiceBindings)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid", c.getNativeOrgDetail)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid/spaces", c.getNativeOrgSpaces)
	echoGroup.GET("/cf/service_offerings/:cnsiGuid", c.getNativeServiceOfferings)
	echoGroup.GET("/cf/service_instances/:cnsiGuid", c.getNativeServiceInstances)
	echoGroup.DELETE("/cf/service_instances/:cnsiGuid/:siGuid", c.deleteServiceInstance)
	echoGroup.GET("/cf/users/:cnsiGuid", c.getNativeUsers)
	echoGroup.GET("/cf/stacks/:cnsiGuid", c.getNativeStacks)
	echoGroup.GET("/cf/buildpacks/:cnsiGuid", c.getNativeBuildpacks)
}
