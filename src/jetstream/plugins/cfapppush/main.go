package cfapppush

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
)

// CFAppPush is a plugin to allow applications to be pushed to Cloud Foundry from Stratos
type CFAppPush struct {
	portalProxy interfaces.PortalProxy
}

// Init creates a new CFAppPush
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFAppPush{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (cfAppPush *CFAppPush) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (cfAppPush *CFAppPush) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (cfAppPush *CFAppPush) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return cfAppPush, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (cfAppPush *CFAppPush) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (cfAppPush *CFAppPush) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Deploy Endpoint
	echoGroup.GET("/:cnsiGuid/:orgGuid/:spaceGuid/deploy", cfAppPush.deploy)
}

// Init performs plugin initialization
func (cfAppPush *CFAppPush) Init() error {
	return nil
}
