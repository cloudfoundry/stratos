package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/gorilla/context"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/satori/go.uuid"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

const cfSessionCookieName = "JSESSIONID"

func handleSessionError(err error) error {
	if strings.Contains(err.Error(), "dial tcp") {
		return interfaces.NewHTTPShadowError(
			http.StatusServiceUnavailable,
			"Service is currently unavailable",
			"Service is currently unavailable: %v", err,
		)
	}

	return interfaces.NewHTTPShadowError(
		http.StatusUnauthorized,
		"User session could not be found",
		"User session could not be found: %v", err,
	)
}

func (p *portalProxy) sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("sessionMiddleware")

		p.removeEmptyCookie(c)

		userID, err := p.GetSessionValue(c, "user_id")
		if err == nil {
			c.Set("user_id", userID)
			return h(c)
		}
		return handleSessionError(err)
	}
}

func sessionCleanupMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("sessionCleanupMiddleware")
		err := h(c)
		req := c.Request().(*standard.Request).Request
		context.Clear(req)

		return err
	}
}

func (p *portalProxy) adminMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// if user is an admin, passthrough request

		// get the user guid
		userID, err := p.GetSessionValue(c, "user_id")
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
		log.Debug("errorLoggingMiddleware")
		err := h(c)
		if shadowError, ok := err.(interfaces.ErrHTTPShadow); ok {
			log.Error(shadowError.LogMessage)
			return shadowError.HTTPError
		}

		return err
	}
}

func retryAfterUpgradeMiddleware(h echo.HandlerFunc) echo.HandlerFunc {

	upgradeVolume, noUpgradeVolumeErr := config.GetValue(UpgradeVolume)
	upgradeLockFile, noUpgradeLockFileNameErr := config.GetValue(UpgradeLockFileName)

	// If any of those properties are not set, disable upgrade middleware
	if noUpgradeVolumeErr != nil || noUpgradeLockFileNameErr != nil {
		return func(c echo.Context) error {
			return h(c)
		}
	}

	return func(c echo.Context) error {
		if _, err := os.Stat(fmt.Sprintf("/%s/%s", upgradeVolume, upgradeLockFile)); err == nil {
			c.Response().Header().Add("Retry-After", "10")
			return c.NoContent(http.StatusServiceUnavailable)
		}

		return h(c)
	}
}

func (p *portalProxy) cloudFoundryMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Check that we are on HTTPS - redirect if not
		if c.Request().Header().Contains("X-Forwarded-Proto") {
			proto := c.Request().Header().Get("X-Forwarded-Proto")
			if proto != "https" {
				redirect := fmt.Sprintf("https://%s%s", c.Request().Host(), c.Request().URI())
				return c.Redirect(301, redirect)
			}
			return h(c)
		}

		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"X-Forwarded-Proto not found and is required",
			"X-Forwarded-Proto not found and is required",
		)
	}
}

// For cloud foundry session affinity
// Ensure we add a cookie named "JSESSIONID" for Cloud Foundry session affinity
func (p *portalProxy) cloudFoundrySessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Make sure there is a JSESSIONID cookie set to the session ID
		session, err := p.GetSession(c)
		if err == nil {
			// We have a session
			guid, err := p.GetSessionValue(c, cfSessionCookieName)
			if err != nil || guid == nil {
				guid = uuid.NewV4().String()
				session.Values[cfSessionCookieName] = guid
				p.SaveSession(c, session)
			}
			sessionGUID := fmt.Sprintf("%s", guid)
			// Set the JSESSIONID coolie for Cloud Foundry session affinity
			w := c.Response().(*standard.Response).ResponseWriter
			cookie := sessions.NewCookie(cfSessionCookieName, sessionGUID, session.Options)
			http.SetCookie(w, cookie)
		}
		return h(c)
	}
}
