package main

import (
	"fmt"
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

const (
	// Default cookie name/cookie name prefix
	jetstreamSessionName              = "console-session"
	JetStreamSessionContextKey        = "jetstream-session"
	JetStreamSessionContextUpdatedKey = "jetstream-session-updated"
	jetStreamSessionHookInstalled     = "jetstream-session-hook-installed"
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
	session := c.Get(JetStreamSessionContextKey)
	if session != nil {
		if sess, ok := session.(*sessions.Session); ok {
			return sess, nil
		}
	}

	s, err := p.SessionStore.Get(req, p.SessionCookieName)
	if err == nil {
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

func (p *portalProxy) SaveSession(c echo.Context, session *sessions.Session) error {
	// Update the cached session and mark that it has been updated

	// We're not calling the real session save, so we need to set the session expiry ourselves
	setSessionExpiresOn(session)

	c.Set(JetStreamSessionContextKey, session)
	c.Set(JetStreamSessionContextUpdatedKey, true)
	// Session was updated, so we need to Save and write the cookie when we are done
	p.registerSessionWriterHook(c)
	return nil
}

func (p *portalProxy) registerSessionWriterHook(c echo.Context) {
	if c.Get(jetStreamSessionHookInstalled) == nil {
		c.Set(jetStreamSessionHookInstalled, true)
		c.Response().Before(p.writeSesstionHook(c))
	}
}

// Save and write the session cookie if needed
// This is called only once per request to avoid duplication
func (p *portalProxy) writeSesstionHook(c echo.Context) func() {
	return func() {
		// Has the seession been modified and need saving?
		sessionModifed := c.Get(JetStreamSessionContextUpdatedKey)
		if sessionModifed != nil {
			sessionIntf := c.Get(JetStreamSessionContextKey)
			if sessionIntf != nil {
				if session, ok := sessionIntf.(*sessions.Session); ok {
					p.SessionStore.Save(c.Request(), c.Response().Writer, session)
				}
			}
		}
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
