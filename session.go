package main

import (
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	portalSessionName = "portal-session"
)

func (p *portalProxy) getSessionValue(c echo.Context, key string) (interface{}, bool) {
	req := c.Request().(*standard.Request).Request
	session, _ := p.CookieStore.Get(req, portalSessionName)

	// transfering this session value to echo.Context to keep our API surface
	// low inside our handlers. This allows us to rip out gorilla handlers later
	if intf, ok := session.Values[key]; ok {
		return intf, ok
	}

	return nil, false
}

func (p *portalProxy) getSessionInt64Value(c echo.Context, key string) (int64, bool) {
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return 0, false
	}

	return intf.(int64), true
}

func (p *portalProxy) getSessionStringValue(c echo.Context, key string) (string, bool) {
	intf, ok := p.getSessionValue(c, key)
	if !ok {
		return "", false
	}

	return intf.(string), true
}

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.CookieStore.Get(req, portalSessionName)

	for k, v := range values {
		session.Values[k] = v
	}

	return p.CookieStore.Save(req, res, session)
}
