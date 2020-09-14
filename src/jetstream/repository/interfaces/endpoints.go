package interfaces

import (
	"github.com/labstack/echo"
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

// EndpointAction identifies the type of action for an endpoint notification
type EndpointAction int

const (
	// EndpointRegisterAction is for when an endpoint is registered
	EndpointRegisterAction EndpointAction = iota
	// EndpointUnregisterAction is for when an endpoint is unregistered
	EndpointUnregisterAction
	// EndpointUpdateAction is for when an endpoint is updated (e.g. renamed)
	EndpointUpdateAction
)
