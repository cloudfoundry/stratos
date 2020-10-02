package interfaces

import (
	"github.com/labstack/echo/v4"
)

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, interface{}, error)
	GetType() string
	Register(echoContext echo.Context) error
	Connect(echoContext echo.Context, cnsiRecord CNSIRecord, userId string) (*TokenRecord, bool, error)
	Validate(userGUID string, cnsiRecord CNSIRecord, tokenRecord TokenRecord) error
	UpdateMetadata(info *Info, userGUID string, echoContext echo.Context)
}

type RoutePlugin interface {
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}

type EndpointAction int

const (
	EndpointRegisterAction EndpointAction = iota
	EndpointUnregisterAction
)
