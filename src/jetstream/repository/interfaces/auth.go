package interfaces

import "github.com/labstack/echo"

type Auth interface {
	Login(c echo.Context) error
	Logout(c echo.Context) error
	GetStratosUsername(userGUID string) (string, error)
	GetStratosUser(userGUID string) (*ConnectedUser, error)
	VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error
}