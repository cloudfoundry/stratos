package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	log "github.com/Sirupsen/logrus"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/SUSE/stratos-ui/repository/tokens"
)

// UAAResponse - Response returned by Cloud Foundry UAA Service
type UAAResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	JTI          string `json:"jti"`
	IDToken      string `json:"id_token"`
}

// LoginHookFunc - function that can be hooked into a successful user login
type LoginHookFunc func(c echo.Context) error

// UAAAdminIdentifier - The identifier that UAA uses to convey administrative level perms
const UAAAdminIdentifier = "stratos.admin"

// CFAdminIdentifier - The scope that Cloud Foundry uses to convey administrative level perms
const CFAdminIdentifier = "cloud_controller.admin"

// SessionExpiresOnHeader Custom header for communicating the session expiry time to clients
const SessionExpiresOnHeader = "X-Cap-Session-Expires-On"

// SessionExpiresAfterHeader Custom header for communicating the session expiry time to clients
const ClientRequestDateHeader = "X-Cap-Request-Date"

// EmptyCookieMatcher - Used to detect and remove empty Cookies sent by certain browsers
var EmptyCookieMatcher *regexp.Regexp = regexp.MustCompile(portalSessionName + "=(?:;[ ]*|$)")

func (p *portalProxy) getUAAIdentityEndpoint() string {
	log.Info("getUAAIdentityEndpoint")
	return fmt.Sprintf("%s/oauth/token", p.Config.ConsoleConfig.UAAEndpoint)
}

func (p *portalProxy) removeEmptyCookie(c echo.Context) {
	req := c.Request().(*standard.Request).Request
	originalCookie := req.Header.Get("Cookie")
	cleanCookie := EmptyCookieMatcher.ReplaceAllLiteralString(originalCookie, "")
	req.Header.Set("Cookie", cleanCookie)
}

// Get the user name for the specified user
func (p *portalProxy) GetUsername(userid string) (string, error) {
	tr, err := p.GetUAATokenRecord(userid)
	if err != nil {
		return "", err
	}

	u, userTokenErr := p.GetUserTokenInfo(tr.AuthToken)
	if userTokenErr != nil {
		return "", userTokenErr
	}

	return u.UserName, nil
}

func (p *portalProxy) loginToUAA(c echo.Context) error {
	log.Debug("loginToUAA")

	uaaRes, u, err := p.login(c, p.Config.ConsoleConfig.SkipSSLValidation, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		err = interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Access Denied",
			"Access Denied: %v", err)
		return err
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	// Ensure that login disregards cookies from the request
	req := c.Request().(*standard.Request).Request
	req.Header.Set("Cookie", "")
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return err
	}

	_, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return err
	}

	if p.Config.LoginHook != nil {
		err = p.Config.LoginHook(c)
		if err != nil {
			log.Warn("Login hook failed", err)
		}
	}

	uaaAdmin := strings.Contains(uaaRes.Scope, p.Config.ConsoleConfig.ConsoleAdminScope)

	resp := &interfaces.LoginRes{
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

// Connect to the given Endpoint
func (p *portalProxy) loginToCNSI(c echo.Context) error {
	log.Debug("loginToCNSI")
	cnsiGuid := c.FormValue("cnsi_guid")

	if len(cnsiGuid) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	resp, err := p.DoLoginToCNSI(c, cnsiGuid)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) DoLoginToCNSI(c echo.Context, cnsiGUID string) (*interfaces.LoginRes, error) {

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", cnsiGUID, err)
	}

	// Get ther User ID since we save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	// Ask the endpoint type to connect
	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		endpointType := endpointPlugin.GetType()
		if cnsiRecord.CNSIType == endpointType {
			tokenRecord, isAdmin, err := endpointPlugin.Connect(c, cnsiRecord, userID)
			if err != nil {
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint endpoint",
					"Could not connect to the endpoint endpoint: %s", err)
			}

			err = p.setCNSITokenRecord(cnsiGUID, userID, *tokenRecord)
			if err != nil {
				return nil, interfaces.NewHTTPShadowError(
					http.StatusBadRequest,
					"Failed to save Token for endpoint",
					"Error occurred: %s", err)
			}

			resp := &interfaces.LoginRes{
				Account:     userID,
				TokenExpiry: tokenRecord.TokenExpiry,
				APIEndpoint: cnsiRecord.APIEndpoint,
				Admin:       isAdmin,
			}

			return resp, nil
		}
	}

	return nil, interfaces.NewHTTPShadowError(
		http.StatusBadRequest,
		"Endpoint connection not supported",
		"Endpoint connection not supported")
}

func (p *portalProxy) ConnectOAuth2(c echo.Context, cnsiRecord interfaces.CNSIRecord) (*interfaces.TokenRecord, error) {
	uaaRes, u, _, err := p.FetchOAuth2Token(cnsiRecord, c)
	if err != nil {
		return nil, err
	}
	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, false)
	return &tokenRecord, nil
}

func (p *portalProxy) fetchHttpBasicToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {

	uaaRes, u, err := p.loginHttpBasic(c)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (p *portalProxy) FetchOAuth2Token(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*UAAResponse, *interfaces.JWTUserTokenInfo, *interfaces.CNSIRecord, error) {
	endpoint := cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	clientID, err := p.GetClientId(cnsiRecord.CNSIType)
	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Endpoint type has not been registered",
			"Endpoint type has not been registered %s: %s", cnsiRecord.CNSIType, err)
	}

	uaaRes, u, err := p.login(c, cnsiRecord.SkipSSLValidation, clientID, "", tokenEndpoint)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (p *portalProxy) GetClientId(cnsiType string) (string, error) {
	plugin, err := p.GetEndpointTypeSpec(cnsiType)
	if err != nil {
		return "", errors.New("Endpoint type not registered")
	}
	return plugin.GetClientId(), nil
}

func (p *portalProxy) logoutOfCNSI(c echo.Context) error {
	log.Debug("logoutOfCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return fmt.Errorf("Could not find correct session value: %s", err)
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("Unable to load CNSI record: %s", err)
	}

	// If cnsi is cf AND cf is auto-register only clear the entry
	if cnsiRecord.CNSIType == "cf" && p.GetConfig().AutoRegisterCFUrl == cnsiRecord.APIEndpoint.String() {
		log.Debug("Setting token record as disconnected")

		tokenRecord := p.InitEndpointTokenRecord(0, "cleared_token", "cleared_token", true)
		if err := p.setCNSITokenRecord(cnsiGUID, userGUID, tokenRecord); err != nil {
			return fmt.Errorf("Unable to clear token: %s", err)
		}
	} else {
		log.Debug("Deleting Token")
		if err := p.deleteCNSIToken(cnsiGUID, userGUID); err != nil {
			return fmt.Errorf("Unable to delete token: %s", err)
		}
	}

	return nil
}

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

func (p *portalProxy) login(c echo.Context, skipSSLValidation bool, client string, clientSecret string, endpoint string) (uaaRes *UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
	log.Debug("login")
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	uaaRes, err = p.getUAATokenWithCreds(skipSSLValidation, username, password, client, clientSecret, endpoint)
	if err != nil {
		return uaaRes, u, err
	}

	u, err = p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (p *portalProxy) loginHttpBasic(c echo.Context) (uaaRes *UAAResponse, u *interfaces.JWTUserTokenInfo, err error) {
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

func (p *portalProxy) logout(c echo.Context) error {
	log.Debug("logout")

	p.removeEmptyCookie(c)

	err := p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	return err
}

func (p *portalProxy) getUAATokenWithCreds(skipSSLValidation bool, username, password, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	log.Debug("getUAATokenWithCreds")

	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAATokenWithRefreshToken(skipSSLValidation bool, refreshToken, client, clientSecret, authEndpoint string, scopes string) (*UAAResponse, error) {
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

func (p *portalProxy) getUAAToken(body url.Values, skipSSLValidation bool, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	log.WithField("authEndpoint", authEndpoint).Debug("getUAAToken")
	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	var h http.Client
	if skipSSLValidation {
		h = httpClientSkipSSL
	} else {
		h = httpClient
	}

	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		defer res.Body.Close()
		body, _ := ioutil.ReadAll(res.Body)
		log.Info("Msg: %s", string(body))

		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	var response UAAResponse

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		log.Errorf("Error decoding response: %v", err)
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

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

// Helper to initialzie a token record using the specified parameters
func (p *portalProxy) InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) interfaces.TokenRecord {
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  expiry,
		Disconnected: disconnect,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	return tokenRecord
}

func (p *portalProxy) removed_saveCNSIToken(cnsiID string, u interfaces.JWTUserTokenInfo, authTok string, refreshTok string, disconnect bool) (interfaces.TokenRecord, error) {
	log.Debug("saveCNSIToken")

	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
		Disconnected: disconnect,
		AuthType:     interfaces.AuthTypeOAuth2,
	}

	err := p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
	if err != nil {
		log.Errorf("%v", err)
		return interfaces.TokenRecord{}, err
	}

	return tokenRecord, nil
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	log.Debug("deleteCNSIToken")

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		log.Errorf("%v", err)
		return err
	}

	return nil
}

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

func (p *portalProxy) verifySession(c echo.Context) error {
	log.Debug("verifySession")

	sessionExpireTime, err := p.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	tr, err := p.GetUAATokenRecord(sessionUser)
	if err != nil {
		msg := fmt.Sprintf("Unable to find UAA Token: %s", err)
		log.Error(msg, err)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// Check if UAA token has expired
	if time.Now().After(time.Unix(sessionExpireTime, 0)) {

		// UAA Token has expired, refresh the token, if that fails, fail the request
		uaaRes, tokenErr := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, tr.RefreshToken, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
		if tokenErr != nil {
			msg := "Could not refresh UAA token"
			log.Error(msg, tokenErr)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}

		u, userTokenErr := p.GetUserTokenInfo(uaaRes.AccessToken)
		if userTokenErr != nil {
			return userTokenErr
		}

		if _, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken); err != nil {
			return err
		}
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = u.UserGUID
		sessionValues["exp"] = u.TokenExpiry

		if err = p.setSessionValues(c, sessionValues); err != nil {
			return err
		}
	} else {
		// Still need to extend the expires_on of the Session
		if err = p.setSessionValues(c, nil); err != nil {
			return err
		}
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return err
	}

	info, err := p.getInfo(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	err = c.JSON(http.StatusOK, info)
	if err != nil {
		return err
	}

	return nil
}

func (p *portalProxy) handleSessionExpiryHeader(c echo.Context) error {

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, err := p.GetSessionValue(c, "expires_on")
	if err != nil {
		msg := "Could not get session expiry"
		log.Error(msg+" - ", err)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}
	c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	expiry := expOn.(time.Time)
	expiryDuration := expiry.Sub(time.Now())

	// Subtract time now to get the duration add this to the time provided by the client
	if c.Request().Header().Contains(ClientRequestDateHeader) {
		clientDate := c.Request().Header().Get(ClientRequestDateHeader)
		clientDateInt, err := strconv.ParseInt(clientDate, 10, 64)
		if err == nil {
			clientDateInt += int64(expiryDuration.Seconds())
			c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(clientDateInt, 10))
		}
	}

	return nil
}

func (p *portalProxy) getUAAUser(userGUID string) (*interfaces.ConnectedUser, error) {
	log.Debug("getUAAUser")

	// get the uaa token record
	uaaTokenRecord, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		log.Error(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), p.Config.ConsoleConfig.ConsoleAdminScope)

	// add the uaa entry to the output
	uaaEntry := &interfaces.ConnectedUser{
		GUID:  userGUID,
		Name:  userTokenInfo.UserName,
		Admin: uaaAdmin,
	}

	return uaaEntry, nil
}

func (p *portalProxy) GetCNSIUser(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, bool) {
	user, _, ok := p.GetCNSIUserAndToken(cnsiGUID, userGUID)
	return user, ok
}

func (p *portalProxy) GetCNSIUserAndToken(cnsiGUID string, userGUID string) (*interfaces.ConnectedUser, *interfaces.TokenRecord, bool) {
	log.Debug("GetCNSIUser")

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		log.Error(msg)
		return nil, nil, false
	}

	var cnsiUser *interfaces.ConnectedUser
	var scope = []string{}

	if cfTokenRecord.AuthType == interfaces.AuthTypeHttpBasic {
		cnsiUser = &interfaces.ConnectedUser{
			GUID: cfTokenRecord.RefreshToken,
			Name: cfTokenRecord.RefreshToken,
		}
	} else {
		// get the scope out of the JWT token data
		userTokenInfo, err := p.GetUserTokenInfo(cfTokenRecord.AuthToken)
		if err != nil {
			msg := "Unable to find scope information in the CNSI UAA Auth Token: %s"
			log.Errorf(msg, err)
			return nil, nil, false
		}

		// add the uaa entry to the output
		cnsiUser = &interfaces.ConnectedUser{
			GUID: userTokenInfo.UserGUID,
			Name: userTokenInfo.UserName,
		}
		scope = userTokenInfo.Scope
	}

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		msg := "Unable to load CNSI record: %s"
		log.Errorf(msg, err)
		return nil, nil, false
	}
	// TODO should be an extension point
	if cnsiRecord.CNSIType == "cf" {
		cnsiAdmin := strings.Contains(strings.Join(scope, ""), p.Config.CFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, &cfTokenRecord, true
}

// Refresh the UAA Token for the user
func (p *portalProxy) RefreshUAAToken(userGUID string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshUAAToken")

	userToken, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		return t, fmt.Errorf("UAA Token info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, userToken.RefreshToken,
		p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
	if err != nil {
		return t, fmt.Errorf("UAA Token refresh request failed: %v", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	u.UserGUID = userGUID

	t, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new UAA token: %v", err)
	}

	return t, nil
}
