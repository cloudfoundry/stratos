package api

import "github.com/labstack/echo/v5"

type MiddlewarePlugin interface {
	EchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
	SessionEchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
}
