package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v4"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

const (
	noAuthUserID = "10000000-1111-2222-3333-444444444444"
)

//More fields will be moved into here as global portalProxy struct is phased out
type noAuth struct {
	databaseConnectionPool *sql.DB
	localUserScope         string
	consoleAdminScope      string
	p                      *portalProxy
}

func (a *noAuth) ShowConfig(config *interfaces.ConsoleConfig) {
	log.Info("... !!!!! No Authentication !!!!!")
}

//Login provides no-auth specific Stratos login
func (a *noAuth) Login(c echo.Context) error {
	return errors.New("Can not login when there is no auth")
}

//Logout provides no-auth specific Stratos login
func (a *noAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

//GetUsername gets the user name for the specified local user
func (a *noAuth) GetUsername(userid string) (string, error) {
	return interfaces.DefaultAdminUserName, nil
}

//GetUser gets the user guid for the specified local user
func (a *noAuth) GetUser(userGUID string) (*interfaces.ConnectedUser, error) {
	var scopes []string
	scopes = make([]string, 1)
	scopes[0] = "stratos.noauth"

	connectdUser := &interfaces.ConnectedUser{
		GUID:   noAuthUserID,
		Name:   interfaces.DefaultAdminUserName,
		Admin:  true,
		Scopes: scopes,
	}

	return connectdUser, nil
}

func (a *noAuth) BeforeVerifySession(c echo.Context) {
	var err error
	var expiry int64
	expiry = math.MaxInt64

	session, err := a.p.GetSession(c)
	if err != nil {
		// No session, so create one
		session, err = a.p.NewSession(c)
		a.p.SaveSession(c, session)
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = noAuthUserID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = a.p.setSessionValues(c, sessionValues); err == nil {
		//Makes sure the client gets the right session expiry time
		a.p.handleSessionExpiryHeader(c)
	}
}

//VerifySession for no authentication - always passes
func (a *noAuth) VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	return nil
}

//generateLoginSuccessResponse
func (a *noAuth) generateLoginSuccessResponse(c echo.Context, userGUID string, username string) error {
	log.Debug("generateLoginResponse")

	var err error
	var expiry int64
	expiry = math.MaxInt64

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = userGUID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = a.p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	//Makes sure the client gets the right session expiry time
	if err = a.p.handleSessionExpiryHeader(c); err != nil {
		return err
	}

	resp := &interfaces.LoginRes{
		Account:     username,
		TokenExpiry: expiry,
		APIEndpoint: nil,
		Admin:       true,
	}

	if jsonString, err := json.Marshal(resp); err == nil {
		// Add XSRF Token
		a.p.ensureXSRFToken(c)
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return err
}

//logout
func (a *noAuth) logout(c echo.Context) error {
	log.Debug("logout")

	a.p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	a.p.unsetSessionValue(c, XSRFTokenSessionName)

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
