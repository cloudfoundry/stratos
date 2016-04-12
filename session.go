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

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, _ := p.CookieStore.Get(req, portalSessionName)

	for k, v := range values {
		session.Values[k] = v
	}

	return p.CookieStore.Save(req, res, session)
}
