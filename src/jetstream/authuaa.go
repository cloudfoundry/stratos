package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type uaaAuth struct {
	databaseConnectionPool *sql.DB
	//MORE FIELDS HERE
	p *portalProxy
}

func (a *uaaAuth) Login(c echo.Context) error {
	return a.loginToUAA(c)
}

func (a *uaaAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

// Get the user name for the specified user
func (a *uaaAuth) GetStratosUsername(userid string) (string, error) {
	tr, err := a.p.GetUAATokenRecord(userid)
	if err != nil {
		return "", err
	}
	u, userTokenErr := a.p.GetUserTokenInfo(tr.AuthToken)
	if userTokenErr != nil {
		return "", userTokenErr
	}
	return u.UserName, nil
}

func (a *uaaAuth) GetStratosUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("GetStratosUser")
	
	// get the uaa token record
	uaaTokenRecord, err := a.p.GetUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		log.Error(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := a.p.GetUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), a.p.Config.ConsoleConfig.ConsoleAdminScope)

	// add the uaa entry to the output
	uaaEntry := &interfaces.ConnectedUser{
		GUID:   userGUID,
		Name:   userTokenInfo.UserName,
		Admin:  uaaAdmin,
		Scopes: userTokenInfo.Scope,
	}

	return uaaEntry, nil
	
}

func (a *uaaAuth) VerifySession(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	tr, err := a.p.GetUAATokenRecord(sessionUser)
	if err != nil {
		msg := fmt.Sprintf("Unable to find UAA Token: %s", err)
		log.Error(msg, err)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// Check if UAA token has expired
	if time.Now().After(time.Unix(sessionExpireTime, 0)) {

		// UAA Token has expired, refresh the token, if that fails, fail the request
		uaaRes, tokenErr := a.p.getUAATokenWithRefreshToken(a.p.Config.ConsoleConfig.SkipSSLValidation, tr.RefreshToken, a.p.Config.ConsoleConfig.ConsoleClient, a.p.Config.ConsoleConfig.ConsoleClientSecret, a.p.getUAAIdentityEndpoint(), "")
		if tokenErr != nil {
			msg := "Could not refresh UAA token"
			log.Error(msg, tokenErr)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}

		u, userTokenErr := a.p.GetUserTokenInfo(uaaRes.AccessToken)
		if userTokenErr != nil {
			return userTokenErr
		}

		if _, err = a.p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken); err != nil {
			return err
		}
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = u.UserGUID
		sessionValues["exp"] = u.TokenExpiry

		if err = a.p.setSessionValues(c, sessionValues); err != nil {
			return err
		}
	} else {
		// Still need to extend the expires_on of the Session
		if err = a.p.setSessionValues(c, nil); err != nil {
			return err
		}
	}

	return nil
}

func (a *uaaAuth) loginToUAA(c echo.Context) error {
	log.Debug("loginToUAA")

	if interfaces.AuthEndpointTypes[a.p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Remote {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"UAA Login is not enabled",
			"UAA Login is not enabled")
		return err
	}

	resp, err := a.p.doLoginToUAA(c)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	// Add XSRF Token
	a.p.ensureXSRFToken(c)

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func (p *portalProxy) doLoginToUAA(c echo.Context) (*interfaces.LoginRes, error) {
	log.Debug("doLoginToUAA")
	uaaRes, u, err := p.login(c, p.Config.ConsoleConfig.SkipSSLValidation, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		// Check the Error
		errMessage := "Access Denied"
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure
			authError := &interfaces.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = authError.ErrorDescription
			}
		}

		err = interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"UAA Login failed: %s: %v", errMessage, err)
		return nil, err
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return nil, err
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return nil, err
	}

	_, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return nil, err
	}

	err = p.ExecuteLoginHooks(c)
	if err != nil {
		log.Warnf("Login hooks failed: %v", err)
	}

	uaaAdmin := strings.Contains(uaaRes.Scope, p.Config.ConsoleConfig.ConsoleAdminScope)
	resp := &interfaces.LoginRes{
		Account:     u.UserName,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: nil,
		Admin:       uaaAdmin,
	}
	return resp, nil
}

func (a *uaaAuth) logout(c echo.Context) error {
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
