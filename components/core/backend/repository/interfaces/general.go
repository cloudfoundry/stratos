package interfaces

import 	"github.com/labstack/echo"

type GeneralPlugin interface {
	Init() error
	EchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
	SessionEchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
}
