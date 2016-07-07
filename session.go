package main

import (
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	portalSessionName = "stackato-console-session"
)

// VerifySessionRes - <TBD>
type VerifySessionRes struct {
	Account string `json:"account"`
	Scope   string `json:"scope"`
}

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

func (p *portalProxy) verifySession(c echo.Context) error {

	sessionExpireTime, ok := p.getSessionInt64Value(c, "exp")
	if !ok {
		msg := "Could not find session date"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	if time.Now().After(time.Unix(sessionExpireTime, 0)) {
		msg := "Session has expired"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		msg := "Could not find session user_id"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// FIXME(woodnt): OBVIOUSLY this needs to not be hard-coded.
	//                Currently this is waiting on https://jira.hpcloud.net/browse/TEAMFOUR-617
	resp := &VerifySessionRes{
		Account: sessionUser,
		Scope:   "openid scim.read cloud_controller.admin uaa.user cloud_controller.read password.write routing.router_groups.read cloud_controller.write doppler.firehose scim.write",
	}

	err := c.JSON(http.StatusOK, resp)
	if err != nil {
		return err
	}

	log.Println("verifySession complete")

	return nil
}
