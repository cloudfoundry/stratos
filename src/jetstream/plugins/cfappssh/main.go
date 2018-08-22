package cfappssh

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
)

// CFAppSSH - Plugin to allow SSH into an application instance
type CFAppSSH struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFAppSSH{portalProxy: portalProxy}, nil
}

func (CFAppSSH *CFAppSSH) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")

}

func (CFAppSSH *CFAppSSH) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

func (CFAppSSH *CFAppSSH) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return CFAppSSH, nil

}

func (CFAppSSH *CFAppSSH) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (CFAppSSH *CFAppSSH) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Application SSH
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/ssh/:appInstance", CFAppSSH.appSSH)
}

func (CFAppSSH *CFAppSSH) Init() error {

	return nil
}
