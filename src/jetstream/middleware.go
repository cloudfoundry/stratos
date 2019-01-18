package main

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/context"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

const cfSessionCookieName = "JSESSIONID"

// Header to communicate the configured Cookie Domain
const StratosDomainHeader = "x-stratos-domain"

// Header to communicate whether SSO Login is enabled and if so, any configured options
const StratosSSOHeader = "x-stratos-sso-login"

// Header to communicate any error during SSO
const StratosSSOErrorHeader = "x-stratos-sso-error"

func handleSessionError(config interfaces.PortalConfig, c echo.Context, err error, doNotLog bool, msg string) error {
	// Add header so front-end knows SSO login is enabled
	if config.SSOLogin {
		// A non-empty SSO Header means SSO is enabled
		// Use the string "enabled" or send the options string if we have one
		options := "enabled"
		if len(config.SSOOptions) > 0 {
			options = config.SSOOptions
		}
		c.Response().Header().Set(StratosSSOHeader, options)
	}

	if strings.Contains(err.Error(), "dial tcp") {
		return interfaces.NewHTTPShadowError(
			http.StatusServiceUnavailable,
			"Service is currently unavailable",
			"Service is currently unavailable: %v", err,
		)
	}

	var logMessage = ""
	if !doNotLog {
		logMessage = msg + ": %v"
	}

	return interfaces.NewHTTPShadowError(
		http.StatusUnauthorized,
		msg, logMessage, err,
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

		// Don't log an error if we are verifying the session, as a failure is not an error
		isVerify := strings.HasSuffix(c.Request().URI(), "/auth/session/verify")
		if isVerify {
			// Tell the frontend what the Cookie Domain is so it can check if sessions will work
			c.Response().Header().Set(StratosDomainHeader, p.Config.CookieDomain)
		}
		return handleSessionError(p.Config, c, err, isVerify, "User session could not be found")
	}
}

// Support for Angular XSRF
func (p *portalProxy) xsrfMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("xsrfMiddleware")

		// Only do this for mutating requests - i.e. we can ignore for GET or HEAD requests
		if c.Request().Method() == "GET" || c.Request().Method() == "HEAD" {
			return h(c)
		}
		errMsg := "Failed to get stored XSRF token from user session"
		token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
		if err == nil {
			// Check the token against the header
			if c.Request().Header().Contains(XSRFTokenHeader) {
				requestToken := c.Request().Header().Get(XSRFTokenHeader)
				if compareTokens(requestToken, token) {
					return h(c)
				}
				errMsg = "Supplied XSRF Token does not match"
			} else {
				errMsg = "XSRF Token was not supplied in the header"
			}
		}
		return interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"XSRF Token could not be found or does not match",
			"XSRF Token error: %s", errMsg,
		)
	}
}

func compareTokens(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
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

// This middleware is not required if Echo is upgraded to v3
func (p *portalProxy) urlCheckMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("urlCheckMiddleware")
		requestPath := c.Request().URL().Path()
		if strings.Contains(requestPath, "../") {
			err := "Invalid path"
			return interfaces.NewHTTPShadowError(
				http.StatusBadRequest,
				err,
				err,
			)
		}
		return h(c)
	}
}

func (p *portalProxy) setStaticCacheContentMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("setStaticContentHeadersMiddleware")
		c.Response().Header().Set("cache-control", "no-cache")
		return h(c)
	}
}

func (p *portalProxy) setSecureCacheContentMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("cache-control", "no-store")
		return h(c)
	}
}

func (p *portalProxy) adminMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// if user is an admin, passthrough request

		// get the user guid
		userID, err := p.GetSessionValue(c, "user_id")
		if err == nil {
			// check their admin status in UAA
			u, err := p.GetUAAUser(userID.(string))
			if err != nil {
				return c.NoContent(http.StatusUnauthorized)
			}

			if u.Admin == true {
				return h(c)
			}
		}

		return handleSessionError(p.Config, c, errors.New("Unauthorized"), false, "You must be a Stratos admin to access this API")
	}
}

func errorLoggingMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("errorLoggingMiddleware")
		err := h(c)
		if shadowError, ok := err.(interfaces.ErrHTTPShadow); ok {
			if len(shadowError.LogMessage) > 0 {
				log.Error(shadowError.LogMessage)
			}
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
