package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/stringutils"
)

// UAAAdminIdentifier - The identifier that UAA uses to convey administrative level perms
const UAAAdminIdentifier = "stratos.admin"

//More fields will be moved into here as global portalProxy struct is phased out
type uaaAuth struct {
	databaseConnectionPool *sql.DB
	p                      *portalProxy
	skipSSLValidation      bool
}

//Login provides UAA-auth specific Stratos login
func (a *uaaAuth) Login(c echo.Context) error {
	log.Debug("UAA Login")
	//This check will remain in until auth is factored down into its own package
	if interfaces.AuthEndpointTypes[a.p.Config.ConsoleConfig.AuthEndpointType] != interfaces.Remote {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"UAA Login is not enabled",
			"UAA Login is not enabled")
		return err
	}

	resp, err := a.p.loginToUAA(c)
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

//Logout provides UAA-auth specific Stratos login
func (a *uaaAuth) Logout(c echo.Context) error {
	return a.logout(c)
}

//GetUsername gets the user name for the specified UAA user
func (a *uaaAuth) GetUsername(userid string) (string, error) {
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

//GetUser gets the user guid for the specified UAA user
func (a *uaaAuth) GetUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("GetUser")

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

//VerifySession verifies the session the specified UAA user and refreshes the token if necessary
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
	}

	return nil
}

//logout performs the underlying logout from the UAA endpoint
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

//loginToUAA performs the underlying login to the UAA endpoint
func (p *portalProxy) loginToUAA(c echo.Context) (*interfaces.LoginRes, error) {
	log.Debug("loginToUAA")
	uaaRes, u, err := p.login(c, p.Config.ConsoleConfig.SkipSSLValidation, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	var resp *interfaces.LoginRes
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

	} else { //Login succes

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
		resp = &interfaces.LoginRes{
			Account:     u.UserName,
			TokenExpiry: u.TokenExpiry,
			APIEndpoint: nil,
			Admin:       uaaAdmin,
		}
	}
	return resp, err
}

//getUAAIdentityEndpoint gets the token endpoint for the UAA
func (p *portalProxy) getUAAIdentityEndpoint() string {
	log.Debug("getUAAIdentityEndpoint")
	return fmt.Sprintf("%s/oauth/token", p.Config.ConsoleConfig.UAAEndpoint)
}

//saveAuthToken stores the UAA token for a given user
func (p *portalProxy) saveAuthToken(u interfaces.JWTUserTokenInfo, authTok string, refreshTok string) (interfaces.TokenRecord, error) {
	log.Debug("saveAuthToken")

	key := u.UserGUID
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	err := p.setUAATokenRecord(key, tokenRecord)
	if err != nil {
		return tokenRecord, err
	}

	return tokenRecord, nil
}

//setUAATokenRecord saves the uaa token for the given user, to our store
func (p *portalProxy) setUAATokenRecord(key string, t interfaces.TokenRecord) error {
	log.Debug("setUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Database error getting repo for UAA token: %v", err)
	}

	err = tokenRepo.SaveAuthToken(key, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Database error saving UAA token: %v", err)
	}

	return nil
}

//RefreshUAALogin refreshes the UAA login and optionally stores the new token
func (p *portalProxy) RefreshUAALogin(username, password string, store bool) error {
	log.Debug("RefreshUAALogin")
	uaaRes, err := p.getUAATokenWithCreds(p.Config.ConsoleConfig.SkipSSLValidation, username, password, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		return err
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return err
	}

	if store {
		_, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
		if err != nil {
			return err
		}
	}

	return nil
}

//getUAATokenWithAuthorizationCode
func (p *portalProxy) getUAATokenWithAuthorizationCode(skipSSLValidation bool, code, client, clientSecret, authEndpoint string, state string, cnsiGUID string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithAuthorizationCode")

	body := url.Values{}
	body.Set("grant_type", "authorization_code")
	body.Set("code", code)
	body.Set("client_id", client)
	body.Set("client_secret", clientSecret)
	body.Set("redirect_uri", getSSORedirectURI(state, state, cnsiGUID))

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

//getUAATokenWithCreds
func (p *portalProxy) getUAATokenWithCreds(skipSSLValidation bool, username, password, client, clientSecret, authEndpoint string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithCreds")

	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

//getUAATokenWithRefreshToken
func (p *portalProxy) getUAATokenWithRefreshToken(skipSSLValidation bool, refreshToken, client, clientSecret, authEndpoint string, scopes string) (*interfaces.UAAResponse, error) {
	log.Debug("getUAATokenWithRefreshToken")

	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	if len(scopes) > 0 {
		body.Set("scope", scopes)
	}

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

//getUAAToken
func (p *portalProxy) getUAAToken(body url.Values, skipSSLValidation bool, client, clientSecret, authEndpoint string) (*interfaces.UAAResponse, error) {
	log.WithField("authEndpoint", authEndpoint).Debug("getUAAToken")
	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	var h = p.GetHttpClientForRequest(req, skipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	var response interfaces.UAAResponse

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		log.Errorf("Error decoding response: %v", err)
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

//GetUAATokenRecord fetched the uaa token for the given user, from our store
func (p *portalProxy) GetUAATokenRecord(userGUID string) (interfaces.TokenRecord, error) {
	log.Debug("GetUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for UAA token: %v", err)
		return interfaces.TokenRecord{}, err
	}

	tr, err := tokenRepo.FindAuthToken(userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		log.Errorf("Database error finding UAA token: %v", err)
		return interfaces.TokenRecord{}, err
	}

	return tr, nil
}

//RefreshUAAToken refreshes the UAA Token for the user using the refresh token, then updates our store
func (p *portalProxy) RefreshUAAToken(userGUID string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshUAAToken")

	userToken, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		return t, fmt.Errorf("UAA Token info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, userToken.RefreshToken,
		p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
	if err != nil {
		err = fmt.Errorf("UAA Token refresh request failed: %v", err)
	} else {
		u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
		if err != nil {
			return t, fmt.Errorf("Could not get user token info from access token")
		}

		u.UserGUID = userGUID

		t, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
		if err != nil {
			return t, fmt.Errorf("Couldn't save new UAA token: %v", err)
		}
	}
	return t, err
}

//SSO
//SSO Login will be refactored at a later date

// ssoLoginToUAA is a callback invoked after the UAA login flow has completed and during logout
// We use a single callback so this can be whitelisted in the client
func (p *portalProxy) ssoLoginToUAA(c echo.Context) error {
	state := c.QueryParam("state")

	stateErr := validateSSORedirectState(state, p.Config.SSOWhiteList)
	if stateErr != nil {
		return stateErr
	}
	// We use the same callback URL for both UAA and endpoint login
	// Check if it is an endpoint login and dens to the right handler
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) > 0 {
		return p.ssoLoginToCNSI(c)
	}

	if state == "logout" {
		return c.Redirect(http.StatusTemporaryRedirect, "/login?SSO_Message=You+have+been+logged+out")
	}
	_, err := p.loginToUAA(c)
	if err != nil {
		// Send error as query string param
		msg := err.Error()
		if httpError, ok := err.(interfaces.ErrHTTPShadow); ok {
			msg = httpError.UserFacingError
		}
		if httpError, ok := err.(interfaces.ErrHTTPRequest); ok {
			msg = httpError.Response
		}
		state = fmt.Sprintf("%s/login?SSO_Message=%s", state, url.QueryEscape(msg))
	}


	return c.Redirect(http.StatusTemporaryRedirect, state)
}

//ssoLogoutOfUAA performs SSO logout from the UAA
func (p *portalProxy) ssoLogoutOfUAA(c echo.Context) error {
	if !p.Config.SSOLogin {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	// Redirect to the UAA to logout of the UAA session as well (if configured to do so), otherwise redirect back to the UI login page
	var redirectURL string
	if p.hasSSOOption("logout") {
		redirectURL = fmt.Sprintf("%s/logout.do?client_id=%s&redirect=%s", p.Config.ConsoleConfig.UAAEndpoint, p.Config.ConsoleConfig.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, "logout", "")))
	} else {
		redirectURL = "/login?SSO_Message=You+have+been+logged+out"
	}
	return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

//hasSSOOption returns whether or not SSO is enabled
func (p *portalProxy) hasSSOOption(option string) bool {
	// Remove all spaces
	opts := stringutils.RemoveSpaces(p.Config.SSOOptions)

	// Split based on ','
	options := strings.Split(opts, ",")
	return stringutils.ArrayContainsString(options, option)
}

//initSSOlogin performs SSO Login via UAA
func (p *portalProxy) initSSOlogin(c echo.Context) error {
	if !p.Config.SSOLogin {
		err := interfaces.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	stateErr := validateSSORedirectState(state, p.Config.SSOWhiteList)
	if stateErr != nil {
		return stateErr
	}

	redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s", p.Config.ConsoleConfig.AuthorizationEndpoint, p.Config.ConsoleConfig.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, state, "")))
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
	return nil
}

func validateSSORedirectState(state string, whiteListStr string) error {
	if len(state) == 0 {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}
	if !safeSSORedirectState(state,whiteListStr) {
		err := interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: Disallowed redirect state",
			"SSO Login: Disallowed redirect state")
		return err
	}

	return nil
}

func safeSSORedirectState(state string, whiteListStr string) bool {
	if len(whiteListStr) == 0 {
		return true
	}

	whiteList := strings.Split(whiteListStr, ",")
	if len(whiteList) == 0 {
		return true
	}

	for _, n := range whiteList {
		if stringutils.CompareURL(state, n) {
			return true
		}
	}
	return false
}

//getSSORedirectURI gets the SSO redirect uri for the given endpoint and state
func getSSORedirectURI(base string, state string, endpointGUID string) string {
	baseURL, _ := url.Parse(base)
	baseURL.Path = ""
	baseURL.RawQuery = ""
	baseURLString := strings.TrimRight(baseURL.String(), "?")

	returnURL := fmt.Sprintf("%s/pp/v1/auth/sso_login_callback?state=%s", baseURLString, url.QueryEscape(state))
	if len(endpointGUID) > 0 {
		returnURL = fmt.Sprintf("%s&guid=%s", returnURL, endpointGUID)
	}
	return returnURL
}

//HTTP Basic

//fetchHTTPBasicToken currently unused?
func (p *portalProxy) fetchHTTPBasicToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*interfaces.UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {

	uaaRes, u, err := p.loginHTTPBasic(c)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

//fetchHTTPBasicToken currently unused?
func (p *portalProxy) loginHTTPBasic(c echo.Context) (uaaRes *interfaces.UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
	log.Debug("login")
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	uaaRes.AccessToken = fmt.Sprintf("Basic %s", base64EncodedAuthString)
	return uaaRes, u, nil
}
