package main

import (
	"net/http"

	"github.com/gorilla/context"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

func sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		req := c.Request().(*standard.Request).Request
		session, _ := cookieStore.Get(req, "portal-session")

		// transfering this session value to echo.Context to keep our API surface
		// low inside our handlers. This allows us to rip out gorilla handlers later
		if intf, ok := session.Values["user_id"]; ok {
			if userID, ok := intf.(string); ok {
				c.Set("user_id", userID)
				return h(c)
			}
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
