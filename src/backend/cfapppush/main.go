package cfapppush

import (
	"errors"

	"github.com/SUSE/stratos-ui/plugins/cfapppush/pushapp"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/labstack/echo"
)

type CFAppPush struct {
	portalProxy interfaces.PortalProxy
	cfPush      pushapp.CFPush
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CFAppPush{portalProxy: portalProxy}, nil
}

func (cfAppPush *CFAppPush) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (cfAppPush *CFAppPush) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (cfAppPush *CFAppPush) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return cfAppPush, nil

}

func (cfAppPush *CFAppPush) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (cfAppPush *CFAppPush) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Deploy Endpoint
	echoGroup.GET("/:cnsiGuid/:orgGuid/:spaceGuid/deploy", cfAppPush.deploy)
}

func (cfAppPush *CFAppPush) Init() error {
	return nil
}
