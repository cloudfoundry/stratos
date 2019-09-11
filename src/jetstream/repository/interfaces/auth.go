package interfaces

import "github.com/labstack/echo"

type Auth interface {
	Login(c echo.Context) error
	Logout(c echo.Context) error
}
