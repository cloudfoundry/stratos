package main

import (
	"database/sql"
	"errors"
	"math"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

const (
	noAuthUserID = "10000000-1111-2222-3333-444444444444"

	// sessionNeverExpires marks sessions that have no expiry (no-auth and
	// local-auth logins); session validation treats any future exp as valid,
	// so MaxInt64 means the session never expires.
	sessionNeverExpires int64 = math.MaxInt64
)

// More fields will be moved into here as global portalProxy struct is phased out
type noAuth struct {
	databaseConnectionPool *sql.DB
	p                      *portalProxy
}

func (a *noAuth) ShowConfig(config *api.ConsoleConfig) {
	log.Info("... !!!!! No Authentication !!!!!")
}

// Login provides no-auth specific Stratos login
func (a *noAuth) Login(c *echo.Context) error {
	return errors.New("can not login when there is no auth")
}

// Logout provides no-auth specific Stratos login
func (a *noAuth) Logout(c *echo.Context) error {
	return a.logout(c)
}

// GetUsername gets the user name for the specified local user
func (a *noAuth) GetUsername(userid string) (string, error) {
	return api.DefaultAdminUserName, nil
}

// GetUser gets the user guid for the specified local user
func (a *noAuth) GetUser(userGUID string) (*api.ConnectedUser, error) {
	var scopes = make([]string, 1)
	scopes[0] = "stratos.noauth"

	connectdUser := &api.ConnectedUser{
		GUID:   noAuthUserID,
		Name:   api.DefaultAdminUserName,
		Admin:  true,
		Scopes: scopes,
	}

	return connectdUser, nil
}

func (a *noAuth) BeforeVerifySession(c *echo.Context) {
	expiry := sessionNeverExpires

	if _, err := a.p.GetSession(c); err != nil {
		// No session, so create one
		session, newErr := a.p.NewSession(c)
		if newErr != nil {
			log.Warnf("Unable to create session: %v", newErr)
		} else if saveErr := a.p.SaveSession(c, session); saveErr != nil {
			log.Warnf("Unable to save session: %v", saveErr)
		}
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = noAuthUserID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err := a.p.setSessionValues(c, sessionValues); err == nil {
		//Makes sure the client gets the right session expiry time
		if err := a.p.handleSessionExpiryHeader(c); err != nil {
			log.Warnf("Unable to set session expiry header: %v", err)
		}
	}
}

// VerifySession for no authentication - always passes
func (a *noAuth) VerifySession(c *echo.Context, sessionUser string, sessionExpireTime int64) error {
	return nil
}

// logout
func (a *noAuth) logout(c *echo.Context) error {
	log.Debug("logout")

	a.p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	if err := a.p.unsetSessionValue(c, XSRFTokenSessionName); err != nil {
		log.Warnf("Unable to remove XSRF token from session: %v", err)
	}

	err := a.p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: a.p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}
