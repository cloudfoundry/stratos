package main

import (
	"fmt"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

const (
	portalSessionName = "console-session"
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
	req := c.Request().(*standard.Request).Request
	return p.SessionStore.Get(req, portalSessionName)
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
	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter

	expiresOn := time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	session.Values["expires_on"] = expiresOn

	return p.SessionStore.Save(req, res, session)
}

func (p *portalProxy) setSessionValues(c echo.Context, values map[string]interface{}) error {
	log.Debug("setSessionValues")

	req := c.Request().(*standard.Request).Request
	session, err := p.SessionStore.Get(req, portalSessionName)
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

	req := c.Request().(*standard.Request).Request
	session, err := p.SessionStore.Get(req, portalSessionName)
	if err != nil {
		return err
	}

	delete(session.Values, sessionKey)

	return p.SaveSession(c, session)
}

func (p *portalProxy) clearSession(c echo.Context) error {
	log.Debug("clearSession")

	req := c.Request().(*standard.Request).Request
	res := c.Response().(*standard.Response).ResponseWriter
	session, err := p.SessionStore.Get(req, portalSessionName)
	if err != nil {
		return err
	}

	session.Options.MaxAge = -1
	return p.SessionStore.Save(req, res, session)
}
