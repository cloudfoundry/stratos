package main

import (
	"log"
	"net/http"
	"os"

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

func errorLoggingMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := h(c)
		if shadowError, ok := err.(errHTTPShadow); ok {
			log.Println(shadowError.LogMessage)
			return shadowError.HTTPError
		}

		return err
	}
}

func retryAfterUpgradeMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// if the upgrade lockfile exists, return a 503 for all API requests
		// TODO: check for actual upgrade lock file once we know how to address it correctly
		if _, err := os.Stat("./upgrade.lock"); err == nil {
			c.Response().Header().Add("Retry-After", "10")
			return c.NoContent(http.StatusServiceUnavailable)
		}

		return h(c)
	}
}
