package userinfo

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
)

// UserInfo is a plugin to fetch user info from the UAA
type UserInfo struct {
	portalProxy interfaces.PortalProxy
}

// Init creates a new UserInfo
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &UserInfo{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (userInfo *UserInfo) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (userInfo *UserInfo) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (userInfo *UserInfo) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return userInfo, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (userInfo *UserInfo) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (userInfo *UserInfo) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// User Info
	echoGroup.Any("/uaa/*", userInfo.uaa)
}

// Init performs plugin initialization
func (userInfo *UserInfo) Init() error {
	return nil
}
