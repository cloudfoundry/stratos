package main

import (
	"net/http"
	"os"

	"github.com/gorilla/context"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

func handleSessionError(err error) error {
	if _, ok := err.(*SessionValueNotFound); ok {
		return newHTTPShadowError(
			http.StatusUnauthorized,
			"User session could not be found",
			"User session could not be found: %v", err,
		)
	}
	return newHTTPShadowError(
		http.StatusServiceUnavailable,
		"Service is currently unavailable",
		"Service is currently unavailable: %v", err,
	)
}

func (p *portalProxy) sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger.Debug("sessionMiddleware")
		userID, err := p.getSessionValue(c, "user_id")
		if err == nil {
			c.Set("user_id", userID)
			return h(c)
		}
		return handleSessionError(err)
	}
}

func sessionCleanupMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger.Debug("sessionCleanupMiddleware")
		err := h(c)
		req := c.Request().(*standard.Request).Request
		context.Clear(req)

		return err
	}
}

func (p *portalProxy) stackatoAdminMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// if user is an admin, passthrough request
		// get the user guid
		userID, err := p.getSessionValue(c, "user_id")
		if err == nil {
			// check their admin status in UAA
			u, err := p.getUAAUser(userID.(string))
			if err != nil {
				return c.NoContent(http.StatusUnauthorized)
			}

			if u.Admin == true {
				return h(c)
			}
		}

		return handleSessionError(err)
	}
}

func errorLoggingMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger.Debug("errorLoggingMiddleware")
		err := h(c)
		if shadowError, ok := err.(errHTTPShadow); ok {
			logger.Error(shadowError.LogMessage)
			return shadowError.HTTPError
		}

		return err
	}
}

func retryAfterUpgradeMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// if the upgrade lockfile exists, return a 503 for all API requests
		// TODO: check for actual upgrade lock file once we know how to address it correctly
		if _, err := os.Stat("/hsc-migration-volume/upgrade.lock"); err == nil {
			c.Response().Header().Add("Retry-After", "10")
			return c.NoContent(http.StatusServiceUnavailable)
		}

		return h(c)
	}
}
