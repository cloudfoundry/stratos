package interfaces

import "github.com/labstack/echo/v4"

//StratosAuth provides common access to Stratos login/logout functionality
type StratosAuth interface {
	Login(c echo.Context) error
	Logout(c echo.Context) error
	GetUsername(userGUID string) (string, error)
	GetUser(userGUID string) (*ConnectedUser, error)
	VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error
}
