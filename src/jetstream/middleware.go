package main

import (
	"crypto/subtle"
	"database/sql"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/context"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/cloudfoundry-community/stratos/src/jetstream/api/config"
)

const cfSessionCookieName = "JSESSIONID"

// Header to communicate the configured Cookie Domain
const StratosDomainHeader = "x-stratos-domain"

// Header to communicate any error during SSO
const StratosSSOErrorHeader = "x-stratos-sso-error"

// APIKeySkipperContextKey - name of a context key that indicates that valid API key was supplied
const APIKeySkipperContextKey = "valid_api_key"

// APIKeyHeader - API key authentication header name
const APIKeyHeader = "Authentication"

// APIKeyAuthScheme - API key authentication scheme
const APIKeyAuthScheme = "Bearer"

func handleSessionError(config api.PortalConfig, c echo.Context, err error, doNotLog bool, msg string) error {
	log.Debug("handleSessionError")

	var netOpErr *net.OpError
	if errors.As(err, &netOpErr) {
		if netOpErr.Op == "dial" && netOpErr.Net == "tcp" {
			return api.NewHTTPShadowError(
				http.StatusServiceUnavailable,
				"Service is currently unavailable",
				"Service is currently unavailable: %v", err,
			)
		}
	}

	if doNotLog {
		return api.NewHTTPShadowError(
			http.StatusUnauthorized,
			msg, msg,
		)
	}

	var logMessage = msg + ": %v"

	return api.NewHTTPShadowError(
		http.StatusUnauthorized,
		msg, logMessage, err,
	)
}

type (
	// Skipper - skipper function for middlewares
	Skipper func(echo.Context) bool

	// MiddlewareConfig defines the config for the middleware.
	MiddlewareConfig struct {
		// Skipper defines a function to skip middleware.
		Skipper Skipper
	}
)

func (p *portalProxy) sessionMiddleware() echo.MiddlewareFunc {

	return p.sessionMiddlewareWithConfig(MiddlewareConfig{})
}

func (p *portalProxy) clearSessionCookie(c echo.Context, setCookieDomain bool) {
	if setCookieDomain {
		// Tell the frontend what the Cookie Domain is so it can check if sessions will work
		// (used in verifySession)
		c.Response().Header().Set(StratosDomainHeader, p.Config.CookieDomain)
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
}

func (p *portalProxy) sessionMiddlewareWithConfig(config MiddlewareConfig) echo.MiddlewareFunc {
	// Default skipper function always returns false
	if config.Skipper == nil {
		config.Skipper = func(c echo.Context) bool { return false }
	}

	return func(h echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			log.Debug("sessionMiddleware")

			if config.Skipper(c) {
				log.Debug("Skipping sessionMiddleware")
				return h(c)
			}

			p.removeEmptyCookie(c)

			userID, err := p.GetSessionValue(c, "user_id")
			if err == nil {
				c.Set("user_id", userID)
				return h(c)
			}

			p.clearSessionCookie(c, false)
			return handleSessionError(p.Config, c, err, false, "User session could not be found")
		}
	}
}

func (p *portalProxy) xsrfMiddleware() echo.MiddlewareFunc {
	return p.xsrfMiddlewareWithConfig(MiddlewareConfig{})
}

func (p *portalProxy) xsrfMiddlewareWithConfig(config MiddlewareConfig) echo.MiddlewareFunc {
	// Default skipper function always returns false
	if config.Skipper == nil {
		config.Skipper = func(c echo.Context) bool { return false }
	}

	return func(h echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			log.Debug("xsrfMiddleware")

			if config.Skipper(c) {
				log.Debug("Skipping xsrfMiddleware")
				return h(c)
			}

			// Only do this for mutating requests - i.e. we can ignore for GET or HEAD requests
			if c.Request().Method == "GET" || c.Request().Method == "HEAD" {
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
			return api.NewHTTPShadowError(
				http.StatusUnauthorized,
				"XSRF Token could not be found or does not match",
				"XSRF Token error: %s", errMsg,
			)
		}
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
			return api.NewHTTPShadowError(
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

			if u.Admin {
				return h(c)
			}
		}

		return handleSessionError(p.Config, c, errors.New("Unauthorized"), false, "You must be a Stratos admin to access this API")
	}
}

// endpointAdminMiddleware - checks if user is admin or endpointadmin
func (p *portalProxy) endpointAdminMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("endpointAdminMiddleware")

		userID, err := p.GetSessionValue(c, "user_id")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		u, err := p.StratosAuthService.GetUser(userID.(string))
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		endpointAdmin := strings.Contains(strings.Join(u.Scopes, ""), "stratos.endpointadmin")

		if !endpointAdmin && !u.Admin {
			return handleSessionError(p.Config, c, errors.New("Unauthorized"), false, "You must be a Stratos admin or endpointAdmin to access this API")
		}

		return h(c)
	}
}

// endpointUpdateDeleteMiddleware - checks if user has necessary permissions to modify endpoint
func (p *portalProxy) endpointUpdateDeleteMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("endpointUpdateDeleteMiddleware")
		userID, err := p.GetSessionValue(c, "user_id")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		u, err := p.StratosAuthService.GetUser(userID.(string))
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		endpointID := c.Param("id")

		cnsiRecord, err := p.GetCNSIRecord(endpointID)
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		// endpoint created by admin when no id is saved
		adminEndpoint := len(cnsiRecord.Creator) == 0

		if adminEndpoint && !u.Admin {
			return handleSessionError(p.Config, c, errors.New("Unauthorized"), false, "You must be Stratos admin to modify this endpoint.")
		}

		if !adminEndpoint && !u.Admin && cnsiRecord.Creator != userID.(string) {
			return handleSessionError(p.Config, c, errors.New("Unauthorized"), false, "EndpointAdmins are not allowed to modify endpoints created by other endpointAdmins.")
		}

		return h(c)
	}
}

func errorLoggingMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("errorLoggingMiddleware")
		err := h(c)
		if shadowError, ok := err.(api.ErrHTTPShadow); ok {
			if len(shadowError.LogMessage) > 0 {
				log.Error(shadowError.LogMessage)
			}
			return shadowError.HTTPError
		} else if jetstreamError, ok := err.(api.JetstreamError); ok {
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

func getAPIKeyFromHeader(c echo.Context) (string, error) {
	header := c.Request().Header.Get(APIKeyHeader)

	l := len(APIKeyAuthScheme)
	if len(header) > l+1 && header[:l] == APIKeyAuthScheme {
		return header[l+1:], nil
	}

	return "", errors.New("no API key in the header")
}

func (p *portalProxy) apiKeyMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Debug("apiKeyMiddleware")

		// skipping thise middleware if API keys are disabled
		if p.Config.APIKeysEnabled == config.APIKeysConfigEnum.Disabled {
			log.Debugf("apiKeyMiddleware: API keys are disabled, skipping")
			return h(c)
		}

		apiKeySecret, err := getAPIKeyFromHeader(c)
		if err != nil {
			log.Debugf("apiKeyMiddleware: %v", err)
			return h(c)
		}

		apiKey, err := p.APIKeysRepository.GetAPIKeyBySecret(apiKeySecret)
		if err != nil {
			switch {
			case err == sql.ErrNoRows:
				log.Debug("apiKeyMiddleware: Invalid API key supplied")
			default:
				log.Errorf("apiKeyMiddleware: %v", err)
			}

			return h(c)
		}

		// checking if user is an admin if API keys are enabled for admins only
		if p.Config.APIKeysEnabled == config.APIKeysConfigEnum.AdminOnly {
			user, err := p.StratosAuthService.GetUser(apiKey.UserGUID)
			if err != nil {
				log.Errorf("apiKeyMiddleware: %v", err)
				return h(c)
			}

			if !user.Admin {
				log.Debugf("apiKeyMiddleware: user isn't admin, skipping")
				return h(c)
			}
		}

		c.Set(APIKeySkipperContextKey, true)
		c.Set("user_id", apiKey.UserGUID)

		// some endpoints check not only the context store, but also the contents of the session store
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = apiKey.UserGUID
		p.setSessionValues(c, sessionValues)

		err = p.APIKeysRepository.UpdateAPIKeyLastUsed(apiKey.GUID)
		if err != nil {
			log.Errorf("apiKeyMiddleware: %v", err)
		}

		return h(c)
	}
}

func (p *portalProxy) apiKeySkipper(c echo.Context) bool {
	return c.Get(APIKeySkipperContextKey) != nil && c.Get(APIKeySkipperContextKey).(bool)
}
