package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

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
	return a.p.loginToUAA(c)
}

func (a *uaaAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

func (p *portalProxy) loginToUAA(c echo.Context) error {
	log.Debug("loginToUAA")

	if interfaces.AuthEndpointTypes[p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Remote {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"UAA Login is not enabled",
			"UAA Login is not enabled")
		return err
	}

	resp, err := p.doLoginToUAA(c)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	// Add XSRF Token
	p.ensureXSRFToken(c)

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
