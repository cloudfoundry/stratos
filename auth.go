package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
)

// UAAResponse - Response returned by Cloud Foundry UAA Service
type UAAResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	JTI          string `json:"jti"`
}

// LoginRes - Response the proxy returns to the caller
type LoginRes struct {
	Account     string   `json:"account"`
	TokenExpiry int64    `json:"token_expiry"`
	APIEndpoint *url.URL `json:"api_endpoint"`
	Admin       bool     `json:"admin"`
}

// VerifySessionRes - Response to the caller from a Verify Session action
type VerifySessionRes struct {
	Account string `json:"account"`
	Admin   bool   `json:"admin"`
}

// ConnectedUser - details about the user connected to a specific service or UAA
type ConnectedUser struct {
	GUID  string `json:"guid"`
	Name  string `json:"name"`
	Admin bool   `json:"admin"`
}

// UAAAdminIdentifier - The identifier that the Cloud Foundry UAA Service uses to convey administrative level perms
const UAAAdminIdentifier = "hcp.admin"

// HCFAdminIdentifier - The identifier that the Cloud Foundry HCF Service uses to convey administrative level perms
const HCFAdminIdentifier = "cloud_controller.admin"

// Custom header for communicating the session expiry time to clients
const SessionExpiresOnHeader = "X-Cnap-Session-Expires-On"

func (p *portalProxy) loginToUAA(c echo.Context) error {
	logger.Debug("loginToUAA")

	var HCPIdentityEndpoint = fmt.Sprintf("%s://%s:%s/oauth/token", p.Config.HCPIdentityScheme, p.Config.HCPIdentityHost, p.Config.HCPIdentityPort)

	uaaRes, u, err := p.login(c, p.Config.ConsoleClient, p.Config.ConsoleClientSecret, HCPIdentityEndpoint)
	if err != nil {
		err = newHTTPShadowError(
			http.StatusUnauthorized,
			"Access Denied",
			"Access Denied: %v", err)
		return err
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, ok := p.getSessionValue(c, "expires_on")
	if !ok {
		return err
	}
	c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	err = p.saveUAAToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return err
	}

	uaaAdmin := strings.Contains(uaaRes.Scope, UAAAdminIdentifier)

	resp := &LoginRes{
		Account:     c.FormValue("username"),
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: nil,
		Admin:       uaaAdmin,
	}
	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func (p *portalProxy) loginToCNSI(c echo.Context) error {
	logger.Debug("loginToCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	uaaRes, u, cnsiRecord, err := p.fetchToken(cnsiGUID, c)

	if err != nil {
		return err
	}

	// save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}
	u.UserGUID = userID

	p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)

	hcfAdmin := strings.Contains(uaaRes.Scope, HCFAdminIdentifier)

	resp := &LoginRes{
		Account:     u.UserGUID,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: cnsiRecord.APIEndpoint,
		Admin:       hcfAdmin,
	}
	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func (p*portalProxy) verifyLoginToCNSI(c echo.Context) error {

	logger.Debug("verifyLoginToCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")
	_, _, _, err := p.fetchToken(cnsiGUID, c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}
	return c.NoContent(http.StatusOK)
}

func (p *portalProxy) fetchToken(cnsiGUID string, c echo.Context) (*UAAResponse, *userTokenInfo, *cnsis.CNSIRecord, error) {

	if len(cnsiGUID) == 0 {
		return nil, nil, nil, newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	endpoint := ""
	cnsiRecord, ok := p.getCNSIRecord(cnsiGUID)

	if !ok {
		return nil, nil, nil, newHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No CNSI registered with GUID %s", cnsiGUID)
	}

	endpoint = cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	clientID := p.Config.HCFClient

	if cnsiRecord.CNSIType == cnsis.CNSIHCE {
		clientID = p.Config.HCEClient
	}

	uaaRes, u, err := p.login(c, clientID, "", tokenEndpoint)

	if err != nil {
		return nil, nil, nil, newHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil

}

func (p *portalProxy) logoutOfCNSI(c echo.Context) error {
	logger.Debug("logoutOfCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userID, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	p.deleteCNSIToken(cnsiGUID, userID)

	return nil
}

func (p *portalProxy) login(c echo.Context, client string, clientSecret string, endpoint string) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
	logger.Debug("login")
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	uaaRes, err = p.getUAATokenWithCreds(username, password, client, clientSecret, endpoint)
	if err != nil {
		return uaaRes, u, err
	}

	u, err = getUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (p *portalProxy) logout(c echo.Context) error {
	logger.Debug("logout")
	res := c.Response().(*standard.Response).ResponseWriter
	cookie := &http.Cookie{
		Name:   portalSessionName,
		Value:  "",
		MaxAge: -1,
	}

	http.SetCookie(res, cookie)
	err := p.clearSession(c)
	if err != nil {
		logger.Errorf("Unable to clear session: %v", err)
	}

	return err
}

func (p *portalProxy) getUAATokenWithCreds(username, password, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	logger.Debug("getUAATokenWithCreds")
	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAATokenWithRefreshToken(refreshToken, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	logger.Debug("getUAATokenWithRefreshToken")
	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	return p.getUAAToken(body, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAAToken(body url.Values, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	logger.WithField("authEndpoint", authEndpoint).Debug("getUAAToken")
	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		logger.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		logger.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, logHTTPError(res, err)
	}

	defer res.Body.Close()

	var response UAAResponse
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		logger.Errorf("Error decoding response: %v", err)
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

func (p *portalProxy) saveUAAToken(u userTokenInfo, authTok string, refreshTok string) error {
	logger.Debug("saveUAAToken")
	key := u.UserGUID
	tokenRecord := tokens.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
	}

	err := p.setUAATokenRecord(key, tokenRecord)
	if err != nil {
		return err
	}

	return nil
}

func (p *portalProxy) saveCNSIToken(cnsiID string, u userTokenInfo, authTok string, refreshTok string) (tokens.TokenRecord, error) {
	logger.Debug("saveCNSIToken")
	tokenRecord := tokens.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
	}

	err := p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
	if err != nil {
		logger.Errorf("%v", err)
		return tokens.TokenRecord{}, err
	}

	return tokenRecord, nil
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	logger.Debug("deleteCNSIToken")
	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		logger.Errorf("%v", err)
		return err
	}

	return nil
}

func (p *portalProxy) getUAATokenRecord(userGUID string) (tokens.TokenRecord, error) {
	logger.Debug("getUAATokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		logger.Errorf("Database error getting repo for UAA token: %v", err)
		return tokens.TokenRecord{}, err
	}

	tr, err := tokenRepo.FindUAAToken(userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		logger.Errorf("Database error finding UAA token: %v", err)
		return tokens.TokenRecord{}, err
	}

	return tr, nil
}

func (p *portalProxy) setUAATokenRecord(key string, t tokens.TokenRecord) error {
	logger.Debug("setUAATokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Database error getting repo for UAA token: %v", err)
	}

	err = tokenRepo.SaveUAAToken(key, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Database error saving UAA token: %v", err)
	}

	return nil
}

func (p *portalProxy) verifySession(c echo.Context) error {
	logger.Debug("verifySession")
	sessionExpireTime, ok := p.getSessionInt64Value(c, "exp")
	if !ok {
		msg := "Could not find session date"
		logger.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		msg := "Could not find user_id in Session"
		logger.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	tr, err := p.getUAATokenRecord(sessionUser)
	if err != nil {
		msg := "Unable to find UAA Token: %s"
		logger.Error(msg, err)
		return fmt.Errorf(msg, err)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(tr.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		logger.Error(msg, err)
		return fmt.Errorf(msg, err)
	}

	 // Check if UAA token has expired
	if time.Now().After(time.Unix(sessionExpireTime, 0)) {
		// UAA Token has expired, refresh the token, if that fails, fail the request

		var HCPIdentityEndpoint = fmt.Sprintf("%s://%s:%s/oauth/token", p.Config.HCPIdentityScheme, p.Config.HCPIdentityHost, p.Config.HCPIdentityPort)

		uaaRes, err := p.getUAATokenWithRefreshToken(tr.RefreshToken, p.Config.ConsoleClient, p.Config.ConsoleClientSecret, HCPIdentityEndpoint)
		if err != nil {
			msg := "Could not refresh UAA token"
			logger.Error(msg, err)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}
		u, err := getUserTokenInfo(uaaRes.AccessToken)
		if err != nil {
			return err
		}

		if err = p.saveUAAToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken); err != nil {
			return err
		}
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = u.UserGUID
		sessionValues["exp"] = u.TokenExpiry

		if err = p.setSessionValues(c, sessionValues); err != nil {
			return err
		}
		userTokenInfo = u
	} else {
		// Still need to extend the expires_on of the Session
		if err = p.setSessionValues(c, nil); err != nil {
			return err
		}
	}

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, ok := p.getSessionValue(c, "expires_on")
	if !ok {
		return err
	}
	c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), UAAAdminIdentifier)

	resp := &VerifySessionRes{
		Account: sessionUser,
		Admin:   uaaAdmin,
	}

	err = c.JSON(http.StatusOK, resp)
	if err != nil {
		return err
	}

	return nil
}

func (p *portalProxy) getUAAUser(userGUID string) (*ConnectedUser, error) {
	logger.Debug("getUAAUser")
	// get the uaa token record
	uaaTokenRecord, err := p.getUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		logger.Error(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		logger.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), UAAAdminIdentifier)

	// add the uaa entry to the output
	uaaEntry := &ConnectedUser{
		GUID:  userGUID,
		Name:  userTokenInfo.UserName,
		Admin: uaaAdmin,
	}

	return uaaEntry, nil
}

func (p *portalProxy) getCNSIUser(cnsiGUID string, userGUID string) (*ConnectedUser, bool) {
	logger.Debug("getCNSIUser")
	// get the uaa token record
	hcfTokenRecord, ok := p.getCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		logger.Error(msg)
		return nil, false
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(hcfTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		logger.Errorf(msg, err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser := &ConnectedUser{
		GUID: userTokenInfo.UserGUID,
		Name: userTokenInfo.UserName,
	}

	// is the user an HCF admin?
	cnsiRecord, ok := p.getCNSIRecord(cnsiGUID)
	if !ok {
		msg := "Unable to load CNSI record"
		logger.Error(msg)
		return nil, false
	}
	if cnsiRecord.CNSIType == cnsis.CNSIHCF {
		cnsiAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), HCFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, true
}
