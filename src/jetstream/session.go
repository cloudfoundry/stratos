package main

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
)

const (

	// XSRFTokenHeader - XSRF Token Header name
	XSRFTokenHeader = "X-Xsrf-Token"
	// XSRFTokenSessionName - XSRF Token Session name
	XSRFTokenSessionName = "xsrf_token"

	// SessionExpiresOnHeader Custom header for communicating the session expiry time to clients
	sessionExpiresOnHeader = "X-Cap-Session-Expires-On"
	// ClientRequestDateHeader Custom header for getting date form client
	clientRequestDateHeader = "X-Cap-Request-Date"
	// XSRFTokenCookie - XSRF Token Cookie name
	xSRFTokenCookie = "XSRF-TOKEN"
	// Default cookie name/cookie name prefix
	jetstreamSessionName              = "console-session"
	jetStreamSessionContextKey        = "jetstream-session"
	jetStreamSessionContextUpdatedKey = "jetstream-session-updated"
)

// SessionValueNotFound - Error returned when a requested key was not found in the session
type SessionValueNotFound struct {
	msg string
}

func (e *SessionValueNotFound) Error() string {
	return fmt.Sprintf("Session value not found %s", e.msg)
}

func (p *portalProxy) GetSession(c echo.Context) (*sessions.Session, error) {
	log.Debug("getSession")
	req := c.Request()
	// If we have already got the session, it will be available on the echo Context
	session := c.Get(jetStreamSessionContextKey)
	if session != nil {
		if sess, ok := session.(*sessions.Session); ok {
			return sess, nil
		}
	}

	s, err := p.SessionStore.Get(req, p.SessionCookieName)
	if err == nil {
		c.Set(jetStreamSessionContextKey, s)
	}
	return s, err
}

func (p *portalProxy) GetSessionValue(c echo.Context, key string) (interface{}, error) {
	log.Debug("getSessionValue")
	session, err := p.GetSession(c)
	if err != nil {
		return nil, err
	}

	// transfering this session value to echo.Context to keep our API surface
	// low inside our handlers. This allows us to rip out gorilla handlers later
	if intf, ok := session.Values[key]; ok {
		return intf, nil
	}

	return nil, &SessionValueNotFound{key}
}

func (p *portalProxy) GetSessionInt64Value(c echo.Context, key string) (int64, error) {
	log.Debug("GetSessionInt64Value")
	intf, err := p.GetSessionValue(c, key)
	if err != nil {
		return 0, err
	}

	return intf.(int64), nil
}

func (p *portalProxy) GetSessionStringValue(c echo.Context, key string) (string, error) {
	log.Debug("GetSessionStringValue")
	intf, err := p.GetSessionValue(c, key)
	if err != nil {
		return "", err
	}

	return intf.(string), nil
}

func (p *portalProxy) SaveSession(c echo.Context, session *sessions.Session) error {
	// Update the cached session and mark that it has been updated

	// We're not calling the real session save, so we need to set the session expiry ourselves
	expiresOn := time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	session.Values["expires_on"] = expiresOn

	// If this is the first time we have updated the session, register the session writer hook
	if c.Get(jetStreamSessionContextUpdatedKey) == nil {
		c.Response().Before(p.writeSessionHook(c))
	}

	c.Set(jetStreamSessionContextKey, session)
	c.Set(jetStreamSessionContextUpdatedKey, true)
	return nil
}

// Save and write the session cookie if needed
// This is called only once per request to avoid duplication
func (p *portalProxy) writeSessionHook(c echo.Context) func() {
	return func() {
		// Has the session been modified and need saving?
		sessionModifed := c.Get(jetStreamSessionContextUpdatedKey)
		sessionIntf := c.Get(jetStreamSessionContextKey)
		if sessionModifed != nil && sessionIntf != nil {
			if session, ok := sessionIntf.(*sessions.Session); ok {
				err := p.SessionStore.Save(c.Request(), c.Response().Writer, session)
				if err != nil {
					log.Error("Failed to save session")
					log.Error(err)
				}
			}
		}
	}
}

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	log.Debug("setSessionValues")
	session, err := p.GetSession(c)
	if err != nil {
		return err
	}

	for k, v := range values {
		session.Values[k] = v
	}

	return p.SaveSession(c, session)
}

func (p *portalProxy) unsetSessionValue(c echo.Context, sessionKey string) error {
	log.Debug("unsetSessionValues")
	session, err := p.GetSession(c)
	if err != nil {
		return err
	}

	delete(session.Values, sessionKey)

	return p.SaveSession(c, session)
}

func (p *portalProxy) clearSession(c echo.Context) error {
	log.Debug("clearSession")
	session, err := p.GetSession(c)
	if err != nil {
		return err
	}

	session.Options.MaxAge = -1

	return p.SaveSession(c, session)
}

func (p *portalProxy) removeEmptyCookie(c echo.Context) {
	req := c.Request()
	originalCookie := req.Header.Get("Cookie")
	cleanCookie := p.EmptyCookieMatcher.ReplaceAllLiteralString(originalCookie, "")
	req.Header.Set("Cookie", cleanCookie)
}

func (p *portalProxy) handleSessionExpiryHeader(c echo.Context) error {

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, err := p.GetSessionValue(c, "expires_on")
	if err != nil {
		msg := "Could not get session expiry"
		log.Error(msg+" - ", err)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}
	c.Response().Header().Set(sessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	expiry := expOn.(time.Time)
	expiryDuration := expiry.Sub(time.Now())

	// Subtract time now to get the duration add this to the time provided by the client
	clientDate := c.Request().Header.Get(clientRequestDateHeader)
	if len(clientDate) > 0 {
		clientDateInt, err := strconv.ParseInt(clientDate, 10, 64)
		if err == nil {
			clientDateInt += int64(expiryDuration.Seconds())
			c.Response().Header().Set(sessionExpiresOnHeader, strconv.FormatInt(clientDateInt, 10))
		}
	}

	return nil
}

// Create a token for XSRF if needed, store it in the session and add the response header for the front-end to pick up
func (p *portalProxy) ensureXSRFToken(c echo.Context) {
	token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
	if err != nil || len(token) == 0 {
		// Need a new token
		tokenBytes, err := crypto.GenerateRandomBytes(32)
		if err == nil {
			token = base64.StdEncoding.EncodeToString(tokenBytes)
		} else {
			token = ""
		}
		sessionValues := make(map[string]interface{})
		sessionValues[XSRFTokenSessionName] = token
		p.setSessionValues(c, sessionValues)
	}

	if len(token) > 0 {
		c.Response().Header().Set(XSRFTokenHeader, token)
	}
}

func (p *portalProxy) verifySession(c echo.Context) error {
	log.Debug("verifySession")

	sessionExpireTime, err := p.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	err = p.StratosAuthService.VerifySession(c, sessionUser, sessionExpireTime)

	// Could not verify session
	if err != nil {
		log.Error(err)
		err = echo.NewHTTPError(http.StatusForbidden, "Could not verify user")

	} else {

		// Still need to extend the expires_on of the Session (set session will save session, in save we update `expires_on`)
		if err = p.setSessionValues(c, nil); err != nil {
			return err
		}

		err = p.handleSessionExpiryHeader(c)
		if err != nil {
			return err
		}

		info, err := p.getInfo(c)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		// Add XSRF Token
		p.ensureXSRFToken(c)

		err = c.JSON(http.StatusOK, info)
		if err != nil {
			return err
		}
	}

	return err
}
