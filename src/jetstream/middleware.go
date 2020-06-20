package main

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/context"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

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
	log.Debug("handleSessionError")

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

	if doNotLog {
		return interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			msg, msg,
		)
	}

	var logMessage = msg + ": %v"

	return interfaces.NewHTTPShadowError(
		http.StatusUnauthorized,
		msg, logMessage, err,
	)
}

func (p *portalProxy) sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("sessionMiddleware")

		p.removeEmptyCookie(c)

		// Don't need to verify the session for the verify API reequest
		// This will verify itself
		isVerify := strings.HasSuffix(c.Request().RequestURI, "/auth/session/verify")
		if isVerify {
			// Tell the frontend what the Cookie Domain is so it can check if sessions will work
			c.Response().Header().Set(StratosDomainHeader, p.Config.CookieDomain)
			return h(c)
		}

		userID, err := p.GetSessionValue(c, "user_id")
		if err == nil {
			c.Set("user_id", userID)
			return h(c)
		}

		// Clear any session cookie
		cookie := new(http.Cookie)
		cookie.Name = p.SessionCookieName
		cookie.Value = ""
		cookie.Expires = time.Now().Add(-24 * time.Hour)
		cookie.Domain = p.SessionStoreOptions.Domain
		cookie.HttpOnly = p.SessionStoreOptions.HttpOnly
		cookie.Secure = p.SessionStoreOptions.Secure
		cookie.Path = p.SessionStoreOptions.Path
		cookie.MaxAge = 0
		c.SetCookie(cookie)

		return handleSessionError(p.Config, c, err, isVerify, "User session could not be found")
	}
}

// Support for Angular XSRF
func (p *portalProxy) xsrfMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("xsrfMiddleware")

		// Only do this for mutating requests - i.e. we can ignore for GET or HEAD requests
		if c.Request().Method == "GET" || c.Request().Method == "HEAD" {
			p.addXSRF(c)
			return h(c)
		}

		// Routes registered with /apps are assumed to be web apps that do their own XSRF
		if strings.HasPrefix(c.Request().URL.String(), "/pp/v1/apps/") {
			return h(c)
		}

		errMsg := "Failed to get stored XSRF token from user session"
		token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
		if err == nil {
			// Check the token against the header
			requestToken := c.Request().Header.Get(XSRFTokenHeader)
			if len(requestToken) > 0 {
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

func (p *portalProxy) addXSRF(c echo.Context) {
	token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
	if err != nil || len(token) == 0 {
		// Need a new token
		p.ensureXSRFToken(c)
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
		req := c.Request()
		context.Clear(req)

		return err
	}
}

// This middleware is not required if Echo is upgraded to v3
func (p *portalProxy) urlCheckMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("urlCheckMiddleware")
		requestPath := c.Request().URL.Path
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
		c.Response().Header().Set("cache-control", "no-cache")
		c.Response().Header().Set("pragma", "no-cache")
		return h(c)
	}
}

func (p *portalProxy) setSecureCacheContentMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("cache-control", "no-store")
		c.Response().Header().Set("pragma", "no-cache")
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
			u, err := p.StratosAuthService.GetUser(userID.(string))
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
		} else if jetstreamError, ok := err.(interfaces.JetstreamError); ok {
			return jetstreamError.HTTPErrorInContext(c)
		}

		return err
	}
}

func bindToEnv(f func(echo.HandlerFunc, *env.VarSet) echo.HandlerFunc, e *env.VarSet) func(echo.HandlerFunc) echo.HandlerFunc {
	return func(h echo.HandlerFunc) echo.HandlerFunc {
		return f(h, e)
	}
}

func retryAfterUpgradeMiddleware(h echo.HandlerFunc, env *env.VarSet) echo.HandlerFunc {

	upgradeVolume, noUpgradeVolumeOK := env.Lookup(UpgradeVolume)
	upgradeLockFile, noUpgradeLockFileNameOK := env.Lookup(UpgradeLockFileName)

	// If any of those properties are not set, disable upgrade middleware
	if !noUpgradeVolumeOK || !noUpgradeLockFileNameOK {
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
