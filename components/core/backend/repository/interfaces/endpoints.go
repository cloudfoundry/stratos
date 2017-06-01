package interfaces

import (
	"github.com/labstack/echo"
)

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, error)
	GetType() string
	GetClientId() string
	Register(echoContext echo.Context) error
	// Route hooks
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}