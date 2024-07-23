package cfapppush

import (
	"errors"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// Module init will register plugin
func init() {
	api.AddPlugin("cfapppush", []string{"cloudfoundry"}, Init)
}

// CFAppPush is a plugin to allow applications to be pushed to Cloud Foundry from Stratos
type CFAppPush struct {
	portalProxy api.PortalProxy
}

// Init creates a new CFAppPush
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &CFAppPush{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (cfAppPush *CFAppPush) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (cfAppPush *CFAppPush) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (cfAppPush *CFAppPush) GetRoutePlugin() (api.RoutePlugin, error) {
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
