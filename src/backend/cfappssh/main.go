package cfappssh

import (
	"errors"

	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/labstack/echo"
)

type CFAppSsh struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFAppSsh{portalProxy: portalProxy}, nil
}

func (cfAppSsh *CFAppSsh) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (cfAppSsh *CFAppSsh) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (cfAppSsh *CFAppSsh) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return cfAppSsh, nil

}

func (cfAppSsh *CFAppSsh) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (cfAppSsh *CFAppSsh) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Application SSH
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/ssh/:appInstance", cfAppSsh.appSSH)
}

func (cfAppSsh *CFAppSsh) Init() error {
	return nil
}
