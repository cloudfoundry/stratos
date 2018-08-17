package userinfo

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/repository/interfaces"
	"github.com/labstack/echo"
)

type UserInfo struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &UserInfo{portalProxy: portalProxy}, nil
}

func (userInfo *UserInfo) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (userInfo *UserInfo) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (userInfo *UserInfo) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return userInfo, nil
}

func (userInfo *UserInfo) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (userInfo *UserInfo) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// User Info
	echoGroup.Any("/uaa/*", userInfo.uaa)
}

func (userInfo *UserInfo) Init() error {
	return nil
}
