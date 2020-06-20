package main

import (
	"errors"
	"fmt"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// LoginHookFunc - function that can be hooked into a successful user login
type LoginHookFunc func(c echo.Context) error

//LogoutResponse is sent upon user logout.
//It contains a flag to indicate whether or not the user was signed in with SSO
type LogoutResponse struct {
	IsSSO bool `json:"isSSO"`
}

//InitStratosAuthService is used to instantiate an Auth service when setting up the portalProxy
func (p *portalProxy) InitStratosAuthService(t interfaces.AuthEndpointType) error {
	var auth interfaces.StratosAuth
	switch t {
	case interfaces.Local:
		auth = &localAuth{
			databaseConnectionPool: p.DatabaseConnectionPool,
			localUserScope:         p.Config.ConsoleConfig.LocalUserScope,
			p:                      p,
		}
	case interfaces.Remote:
		auth = &uaaAuth{
			databaseConnectionPool: p.DatabaseConnectionPool,
			p:                      p,
		}
	case interfaces.AuthNone:
		auth = &noAuth{
			databaseConnectionPool: p.DatabaseConnectionPool,
			p:                      p,
		}
	default:
		err := fmt.Errorf("Invalid auth endpoint type: %v", t)
		return err
	}
	p.StratosAuthService = auth
	return nil
}

//GetAuthService gets the auth service from portalProxy via the Auth interface
func (p *portalProxy) GetStratosAuthService() interfaces.StratosAuth {
	return p.StratosAuthService
}

//login is used for both endpoint and direct UAA login
func (p *portalProxy) login(c echo.Context, skipSSLValidation bool, client string, clientSecret string, endpoint string) (uaaRes *interfaces.UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
	log.Debug("login")
	if c.Request().Method == http.MethodGet {
		code := c.QueryParam("code")
		state := c.QueryParam("state")
		// If this is login for a CNSI, then the redirect URL is slightly different
		cnsiGUID := c.QueryParam("guid")
		uaaRes, err = p.getUAATokenWithAuthorizationCode(skipSSLValidation, code, client, clientSecret, endpoint, state, cnsiGUID)
	} else {
		username := c.FormValue("username")
		password := c.FormValue("password")

		if len(username) == 0 || len(password) == 0 {
			return uaaRes, u, errors.New("Needs username and password")
		}
		uaaRes, err = p.getUAATokenWithCreds(skipSSLValidation, username, password, client, clientSecret, endpoint)
	}
	if err != nil {
		return uaaRes, u, err
	}

	u, err = p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (p *portalProxy) consoleLogin(c echo.Context) error {
	return p.StratosAuthService.Login(c)
}

func (p *portalProxy) consoleLogout(c echo.Context) error {
	return p.StratosAuthService.Logout(c)
}
