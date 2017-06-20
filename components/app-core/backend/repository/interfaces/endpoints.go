package interfaces

import (
	"github.com/labstack/echo"
)

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, error)
	GetType() string
	GetClientId() string
	Register(echoContext echo.Context) error
}

type RoutePlugin interface {
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}
