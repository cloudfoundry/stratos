package main

import (
	"errors"
	"fmt"
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	log "github.com/sirupsen/logrus"
)

const (
	// Default cookie name/cookie name prefix
	jetstreamSessionName              = "console-session"
	JetStreamSessionContextKey        = "jetstream-session"
	JetStreamSessionContextUpdatedKey = "jetstream-session-updated"
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

	// If we have already got the session, it will be available on the echo Context
	session := c.Get(JetStreamSessionContextKey)
	if session != nil {
		if sess, ok := session.(*sessions.Session); ok {
			log.Warn("Found session on context: " + sess.ID)
			log.Warn(sess.Values)
			return sess, nil
		}
	}

	req := c.Request().(*standard.Request).Request
	s, err := p.SessionStore.Get(req, p.SessionCookieName)
	if err == nil {
		log.Warn("Got session from session store... storing in context")
		c.Set(JetStreamSessionContextKey, s)
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

// Used by middleware to store the session and add the cookie
// This is called only once per request to avoid duplication
func (p *portalProxy) WriteSession(c echo.Context) error {
	sessionModifed := c.Get(JetStreamSessionContextUpdatedKey)
	if sessionModifed == nil {
		// Session not modified, so nothing to do
		return nil
	}

	sessionIntf := c.Get(JetStreamSessionContextKey)
	if sessionIntf != nil {
		if session, ok := sessionIntf.(*sessions.Session); ok {
			log.Warn("Writing session: " + session.ID)

			req := c.Request().(*standard.Request).Request
			res := c.Response().(*standard.Response).ResponseWriter

			expiresOn := time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
			session.Values["expires_on"] = expiresOn
			c.Set(JetStreamSessionContextKey, session)

			// We saved the session, so remove the update key so we don't save it again
			err := p.SessionStore.Save(req, res, session)
			c.Set(JetStreamSessionContextUpdatedKey, nil)
			return err
		}
	}

	return errors.New("Could not find modified session to save in the Context")
}

func (p *portalProxy) SaveSession(c echo.Context, session *sessions.Session) error {
	// Update the cached session and mark that it has been updated

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter

	err := p.SessionStore.Save(req, res, session)
	if err == nil {
		log.Warn("Session saved okay")
		log.Warn(session)
		// Saved it okay
		session.IsNew = false
		setSessionExpiresOn(session)
	}

	c.Response().
	

	// Update the session on the context to indicate that the session is not new
	c.Set(JetStreamSessionContextKey, session)
	return err
}

func dedupCookies(c echo.Context) {
	// if c.Response().Header().Contains("Set-Cookie") {
	// 	header := c.Response().Header().Get("Set-Cookie")
	// 	c.Response().Header().Del("Set-Cookie")
	// 	c.Response().Header().Set("Set-Cookie", header)
	// }

	// Cookies
	for _, cookie := range c.Cookies() {
		log.Warn(cookie.Name() + " " + cookie.Value())
	}
}

func setSessionExpiresOn(session *sessions.Session) {
	var expiresOn time.Time
	exOn := session.Values["expires_on"]
	if exOn == nil {
		expiresOn = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	} else {
		expiresOn = exOn.(time.Time)
		if expiresOn.Sub(time.Now().Add(time.Second*time.Duration(session.Options.MaxAge))) < 0 {
			expiresOn = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
		}
	}
	session.Values["expires_on"] = expiresOn
	log.Warn(session)
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
