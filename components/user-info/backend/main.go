package main

import (
	"errors"

	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
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
	log.Info("User Info component loaded")
	return nil
}
