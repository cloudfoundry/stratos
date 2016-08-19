package main

import (
	"log"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	portalSessionName = "stackato-console-session"
)

func (p *portalProxy) getSessionValue(c echo.Context, key string) (interface{}, bool) {
	log.Println("getSessionValue")
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
	log.Println("getSessionInt64Value")
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return 0, false
	}

	return intf.(int64), true
}

func (p *portalProxy) getSessionStringValue(c echo.Context, key string) (string, bool) {
	log.Println("getSessionStringValue")
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return "", false
	}

	return intf.(string), true
}

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	log.Println("setSessionValues")

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.SessionStore.Get(req, portalSessionName)

	for k, v := range values {
		session.Values[k] = v
	}

	return p.SessionStore.Save(req, res, session)
}

func (p *portalProxy) unsetSessionValue(c echo.Context, sessionKey string) error {
	log.Println("unsetSessionValues")

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.SessionStore.Get(req, portalSessionName)

	delete(session.Values, sessionKey)

	return p.SessionStore.Save(req, res, session)
}

func (p *portalProxy) clearSession(c echo.Context) error {
	log.Println("clearSession")

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.SessionStore.Get(req, portalSessionName)

	session.Options.MaxAge = -1
	return p.SessionStore.Save(req, res, session)
}
