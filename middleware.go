package main

import (
	"net/http"

	"github.com/gorilla/context"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

func (p *portalProxy) sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		if userID, ok := p.getSessionValue(c, "user_id"); ok {
			c.Set("user_id", userID)
			return h(c)
		}

		return c.NoContent(http.StatusUnauthorized)
	}
}

func sessionCleanupMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := h(c)
		req := c.Request().(*standard.Request).Request
		context.Clear(req)

		return err
	}
}
