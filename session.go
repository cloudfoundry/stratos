package main

import (
	"time"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	portalSessionName = "stackato-console-session"
)

func (p *portalProxy) getSessionValue(c echo.Context, key string) (interface{}, bool) {
	logger.Debug("getSessionValue")
	req := c.Request().(*standard.Request).Request
	session, _ := p.SessionStore.Get(req, portalSessionName)

	// transfering this session value to echo.Context to keep our API surface
	// low inside our handlers. This allows us to rip out gorilla handlers later
	if intf, ok := session.Values[key]; ok {
		return intf, ok
	}

	return nil, false
}

func (p *portalProxy) getSessionInt64Value(c echo.Context, key string) (int64, bool) {
	logger.Debug("getSessionInt64Value")
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return 0, false
	}

	return intf.(int64), true
}

func (p *portalProxy) getSessionStringValue(c echo.Context, key string) (string, bool) {
	logger.Debug("getSessionStringValue")
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return "", false
	}

	return intf.(string), true
}

func (p *portalProxy) saveSession(c echo.Context, session *sessions.Session) error {
	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter

	expiresOn := time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	session.Values["expires_on"] = expiresOn

	// Secure session cookies
	session.Options.HttpOnly = true
	session.Options.Secure = true

	return p.SessionStore.Save(req, res, session)
}

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	logger.Debug("setSessionValues")

	req := c.Request().(*standard.Request).Request
	session, _ := p.SessionStore.Get(req, portalSessionName)

	for k, v := range values {
		session.Values[k] = v
	}

	return p.saveSession(c, session)
}

func (p *portalProxy) unsetSessionValue(c echo.Context, sessionKey string) error {
	logger.Debug("unsetSessionValues")

	req := c.Request().(*standard.Request).Request
	session, _ := p.SessionStore.Get(req, portalSessionName)

	delete(session.Values, sessionKey)

	return p.saveSession(c, session)
}

func (p *portalProxy) clearSession(c echo.Context) error {
	logger.Debug("clearSession")

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.SessionStore.Get(req, portalSessionName)

	session.Options.MaxAge = -1
	return p.SessionStore.Save(req, res, session)
}
