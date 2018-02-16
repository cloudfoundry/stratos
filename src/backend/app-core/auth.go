package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/SUSE/stratos-ui/config"
	"io/ioutil"
	"net/http"
	"net/url"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	log "github.com/Sirupsen/logrus"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

	"gopkg.in/yaml.v2"

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

	u, userTokenErr := getUserTokenInfo(tr.AuthToken)
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

func (p *portalProxy) loginToCNSI(c echo.Context) error {
	log.Debug("loginToCNSI")
	cnsiGuid := c.FormValue("cnsi_guid")

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
	uaaRes, u, cnsiRecord, err := p.fetchToken(cnsiGUID, c)

	if err != nil {
		return nil, err
	}

	// save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}
	u.UserGUID = userID

	p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken, false)

	cfAdmin := strings.Contains(uaaRes.Scope, p.Config.CFAdminIdentifier)

	resp := &interfaces.LoginRes{
		Account:     u.UserGUID,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: cnsiRecord.APIEndpoint,
		Admin:       cfAdmin,
	}

	return resp, nil
}

func (p *portalProxy) verifyLoginToCNSI(c echo.Context) error {
	log.Debug("verifyLoginToCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")
	_, _, _, err := p.fetchToken(cnsiGUID, c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}
	return c.NoContent(http.StatusOK)
}

func (p *portalProxy) fetchToken(cnsiGUID string, c echo.Context) (*UAAResponse, *userTokenInfo, *interfaces.CNSIRecord, error) {

	if len(cnsiGUID) == 0 {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No CNSI registered with GUID %s: %s", cnsiGUID, err)
	}

	// Look for auth type
	authType := c.FormValue("auth_type")
	if len(authType) == 0 {
		authType = interfaces.AuthTypeOAuth2
	}

	if authType == interfaces.AuthTypeOAuth2 {
		return p.fetchOAuth2Token(cnsiRecord, c)
	}

	if authType == interfaces.AuthTypeHttpBasic {
		return p.fetchHttpBasicToken(cnsiRecord, c)
	}

	if authType == interfaces.AuthTypeKubeConfig {
		return p.fetcKubeConfigToken(cnsiRecord, c)
	}

	return nil, nil, nil, interfaces.NewHTTPShadowError(
		http.StatusBadRequest,
		"Unknown Auth Type",
		"Unkown Auth Type for CNSI %s: %s", cnsiGUID, authType)
}

func (p *portalProxy) fetchHttpBasicToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*UAAResponse, *userTokenInfo, *interfaces.CNSIRecord, error) {

	uaaRes, u, err := p.loginHttpBasic(c)

	if err != nil {
		return nil, nil, nil, interfaces.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

type KubeConfigClusterDetail struct {
	Server string `yaml:"server"`
}

type KubeConfigCluster struct {
	Name    string `yaml:"name"`
	Cluster struct {
		Server string
	}
}

type KubeConfigUser struct {
	Name string `yaml:"name"`
	User struct {
		AuthProvider struct {
			Name   string      `yaml:"name"`
			Config interface{} `yaml:"config"`
		} `yaml:"auth-provider"`
	}
}

type KubeConfigAuthProviderOIDC struct {
	ClientID     string `yaml:"client-id"`
	ClientSecret string `yaml:"client-secret"`
	IDToken      string `yaml:"id-token"`
	IdpIssuerURL string `yaml:"idp-issuer-url"`
	RefreshToken string `yaml:"refresh-token"`
}

//ExtraScopes string `yaml:"extra-scopes"`

type KubeConfigContexts struct {
	Context struct {
		Cluster string
		User    string
	} `yaml:"context"`
}

type KubeConfigFile struct {
	ApiVersion string               `yaml:"apiVersion"`
	Kind       string               `yaml:"kind"`
	Clusters   []KubeConfigCluster  `yaml:"clusters"`
	Users      []KubeConfigUser     `yaml:"users"`
	Contexts   []KubeConfigContexts `yaml:"contexts"`
}

func (p *portalProxy) fetcKubeConfigToken(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*UAAResponse, *userTokenInfo, *interfaces.CNSIRecord, error) {

	log.Info("Fetching Kube Config Token")

	req := c.Request().(*standard.Request).Request

	// Need to extract the parameters from the request body
	defer req.Body.Close()
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, nil, nil, err
	}

	log.Info("== BODY ===")
	log.Info(body)

	kubeConfig := KubeConfigFile{}
	err = yaml.Unmarshal(body, &kubeConfig)
	if err != nil {
		return nil, nil, nil, err
	}

	log.Info("OK")
	log.Info(err)
	log.Info(string(body))

	log.Info(len(kubeConfig.Clusters))
	log.Info(kubeConfig.ApiVersion)
	log.Info(kubeConfig.Kind)
	log.Info(kubeConfig.Clusters[0].Name)

	// Verify that this is a Kube Config file
	if kubeConfig.ApiVersion != "v1" || kubeConfig.Kind != "Config" {
		return nil, nil, nil, errors.New("Not a valid Kubernetes Config file")
	}

	// Find the config corresponding to our API Endpoint
	log.Info(cnsiRecord.APIEndpoint.String())

	var name string

	for _, cluster := range kubeConfig.Clusters {
		if cluster.Cluster.Server == cnsiRecord.APIEndpoint.String() {
			name = cluster.Name
			break
		}
	}

	var userName string
	var user *KubeConfigUser

	log.Info(name)
	if len(name) > 0 {
		log.Info("Found config")

		// Now find context to determine which user to use
		for _, context := range kubeConfig.Contexts {
			if context.Context.Cluster == name {
				userName = context.Context.User
				break
			}
		}

		if len(userName) > 0 {
			log.Info("Found user")
			log.Info(userName)

			for _, u := range kubeConfig.Users {
				if u.Name == userName {
					user = &u
					break
				}
			}
		}
	}

	if user == nil {
		return nil, nil, nil, errors.New("Can not find config for Kubernetes cluster")
	}

	log.Info(user.User.AuthProvider.Name)

	// We onlt support OIDC auth provider at the moment
	if user.User.AuthProvider.Name != "oidc" {
		return nil, nil, nil, errors.New("Unsupported authentication provider")
	}
	log.Info(user.User.AuthProvider.Config)

	oidcConfig := KubeConfigAuthProviderOIDC{}

	err = unMarshalHelper(user.User.AuthProvider.Config, &oidcConfig)
	if err == nil {
		return nil, nil, nil, errors.New("Can not unmarshal OIDC Auth Provider configuration")
	}

	log.Info(err)
	log.Info(oidcConfig.ClientID)

	// uaaRes, u, err := p.loginHttpBearer(cnsiRecord, c)

	// if err != nil {
	// 	return nil, nil, nil, interfaces.NewHTTPShadowError(
	// 		http.StatusUnauthorized,
	// 		"Login failed",
	// 		"Login failed: %v", err)
	// }
	// return uaaRes, u, &cnsiRecord, nil

	return nil, nil, nil, errors.New("Not implemented")
}

func unMarshalHelper(values interface{}, intf interface{}) error {

	m := values.(map[interface{}]interface{})

	value := reflect.ValueOf(intf)

	if value.Kind() != reflect.Ptr {
		return errors.New("config: must provide pointer to struct value")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("config: must provide pointer to struct value")
	}

	nFields := value.NumField()
	typ := value.Type()

	for i := 0; i < nFields; i++ {
		field := value.Field(i)
		strField := typ.Field(i)
		tag := strField.Tag.Get("yaml")
		if tag == "" {
			continue
		}

		if tagValue, ok := m[tag].(string); ok {
			if err := config.SetStructFieldValue(value, field, tagValue); err != nil {
				return err
			}
		}
	}

	return nil
}

func (p *portalProxy) fetchOAuth2Token(cnsiRecord interfaces.CNSIRecord, c echo.Context) (*UAAResponse, *userTokenInfo, *interfaces.CNSIRecord, error) {
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

		userTokenInfo := userTokenInfo{
			UserGUID: userGUID,
		}

		if _, err := p.saveCNSIToken(cnsiGUID, userTokenInfo, "cleared_token", "cleared_token", true); err != nil {
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

	u, err := getUserTokenInfo(uaaRes.AccessToken)
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

func (p *portalProxy) login(c echo.Context, skipSSLValidation bool, client string, clientSecret string, endpoint string) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
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

	u, err = getUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (p *portalProxy) loginHttpBasic(c echo.Context) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
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

func (p *portalProxy) loginHttpBearer(cnsiRecord interfaces.CNSIRecord, c echo.Context) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
	log.Debug("login")

	log.Info("Login HTTP Bearer")

	token := c.FormValue("token")

	if len(token) == 0 {
		return uaaRes, u, errors.New("Needs token")
	}

	log.Info("Login HTTP Bearer 1")
	// authString := fmt.Sprintf("%s:%s", username, password)
	token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlOTI4M2M0NTE4Y2U5NjZjZjk2MjZjNmNiZjJlYzU2NDA2NTIzZjIifQ.eyJpc3MiOiJodHRwczovL2t1YmUtYXBpLmRldmVudi5jYXBicmlzdG9sLmNvbTozMjAwMCIsInN1YiI6IkNpMTFhV1E5ZEdWemRDeHZkVDFRWlc5d2JHVXNaR005YVc1bWNtRXNaR005WTJGaGMzQXNaR005Ykc5allXd1NCR3hrWVhBIiwiYXVkIjoiY2Fhc3AtY2xpIiwiZXhwIjoxNTE4MDkzOTM5LCJpYXQiOjE1MTgwMDc1MzksIm5vbmNlIjoiMzA3M2NmZmQ1YzJjZTVjODkwZjdhODM5Zjc5YTQ1NDciLCJhdF9oYXNoIjoiQ1pULUtUQ1hwbjZzZmxrNFZEM3E2QSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJncm91cHMiOlsiQWRtaW5pc3RyYXRvcnMiXSwibmFtZSI6IkEgVXNlciJ9.XTRtlsE1wOvitOIb9rTUDD-MxCYTJlfE-aVan6ztFiK2pO42NzrsuzRRVIqA9Toc4EzJIMzP5-yVMZXFHfiQWtDbm4IeYWSxHaZYKFxs_-2Pu5M_ScqCiLWsma4A-kW9_nwPEEsDtnKYTnvEPvl3MC89rEiT-WlT13h5KyfQ1ZDulgM3h9DwGvOrI2C9c3J2VeMGZh2bglZIasLrfNmdFMbmGRaEf4Gxvp4J0bhIij3J-ZN_rwWQfxwePZXxC4hE10FHqtGjLWax8Px654g0rClqfySTfr2wAJngN5xDEYxv2vaBMvtUHHu6uEyj8H5jy6GKQKhIvnJjhyZOYDs6Cw"
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(token))

	uaaRes = &UAAResponse{}
	uaaRes.AccessToken = fmt.Sprintf("Bearer %s", base64EncodedAuthString)
	log.Info("Login HTTP Bearer 1")

	// Make a request to the auth endpoint - to check that the auth is working
	log.Info(uaaRes.AccessToken)

	//authEndpoint := cnsiRecord.AuthorizationEndpoint
	authEndpoint := "http://149.44.104.40:8001/v1/api"
	req, err := http.NewRequest("GET", authEndpoint, strings.NewReader(""))
	req.Header.Set("Authorization", uaaRes.AccessToken)

	//, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for Http Endpoint: %v"
		log.Errorf(msg, err)
		return nil, u, fmt.Errorf(msg, err)
	}

	var h http.Client
	if cnsiRecord.SkipSSLValidation {
		h = httpClientSkipSSL
	} else {
		h = httpClient
	}

	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, u, interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	log.Info(res.Body)

	// dec := json.NewDecoder(res.Body)
	// if err = dec.Decode(&response); err != nil {
	// 	log.Errorf("Error decoding response: %v", err)
	// 	return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	// }

	// return &response, nil

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

func (p *portalProxy) getUAATokenWithRefreshToken(skipSSLValidation bool, refreshToken, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	log.Debug("getUAATokenWithRefreshToken")

	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

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

func (p *portalProxy) saveAuthToken(u userTokenInfo, authTok string, refreshTok string) (interfaces.TokenRecord, error) {
	log.Debug("saveAuthToken")

	key := u.UserGUID
	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
	}

	err := p.setUAATokenRecord(key, tokenRecord)
	if err != nil {
		return tokenRecord, err
	}

	return tokenRecord, nil
}

func (p *portalProxy) saveCNSIToken(cnsiID string, u userTokenInfo, authTok string, refreshTok string, disconnect bool) (interfaces.TokenRecord, error) {
	log.Debug("saveCNSIToken")

	tokenRecord := interfaces.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
		Disconnected: disconnect,
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
		uaaRes, tokenErr := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, tr.RefreshToken, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
		if tokenErr != nil {
			msg := "Could not refresh UAA token"
			log.Error(msg, tokenErr)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}

		u, userTokenErr := getUserTokenInfo(uaaRes.AccessToken)
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
	userTokenInfo, err := getUserTokenInfo(uaaTokenRecord.AuthToken)
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
	log.Debug("GetCNSIUser")

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		log.Error(msg)
		return nil, false
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(cfTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the CNSI UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser := &interfaces.ConnectedUser{
		GUID: userTokenInfo.UserGUID,
		Name: userTokenInfo.UserName,
	}

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		msg := "Unable to load CNSI record: %s"
		log.Errorf(msg, err)
		return nil, false
	}
	// TODO should be an extension point
	if cnsiRecord.CNSIType == "cf" {
		cnsiAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), p.Config.CFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, true
}

// Refresh the UAA Token for the user
func (p *portalProxy) RefreshUAAToken(userGUID string) (t interfaces.TokenRecord, err error) {
	log.Debug("RefreshUAAToken")

	userToken, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		return t, fmt.Errorf("UAA Token info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, userToken.RefreshToken,
		p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint())
	if err != nil {
		return t, fmt.Errorf("UAA Token refresh request failed: %v", err)
	}

	u, err := getUserTokenInfo(uaaRes.AccessToken)
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
