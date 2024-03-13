package cfappssh

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// Module init will register plugin
func init() {
	api.AddPlugin("cfappssh", []string{"cloudfoundry"}, Init)
}

// CFAppSSH - Plugin to allow SSH into an application instance
type CFAppSSH struct {
	portalProxy api.PortalProxy
}

// Init creates a new CFAppSSH
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &CFAppSSH{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (CFAppSSH *CFAppSSH) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (CFAppSSH *CFAppSSH) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (CFAppSSH *CFAppSSH) GetRoutePlugin() (api.RoutePlugin, error) {
	return CFAppSSH, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (CFAppSSH *CFAppSSH) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (CFAppSSH *CFAppSSH) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Application SSH
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/ssh/:appInstance", CFAppSSH.appSSH)
}

// Init performs plugin initialization
func (CFAppSSH *CFAppSSH) Init() error {
	return nil
}
