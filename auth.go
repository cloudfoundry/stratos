package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

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
	Admin   string `json:"admin"`
}

// uaaPerms - Does the user have Admin perms within the Cloud Foundry UAA Service?
type uaaPerms struct {
	Type  string `json:"type"`
	Admin string `json:"admin"`
}

// hcfPerms - Does the user have Admin perms within the Cloud Foundry HCF Service?
type hcfPerms struct {
	Type  string `json:"type"`
	GUID  string `json:"guid"`
	Admin string `json:"admin"`
}

// UAAAdminIdentifier - The identifier that the Cloud Foundry UAA Service uses to convey administrative level perms
const UAAAdminIdentifier = "cloud_controller.admin"

// HCFAdminIdentifier - The identifier that the Cloud Foundry HCF Service uses to convey administrative level perms
const HCFAdminIdentifier = "uaa.admin"

func (p *portalProxy) loginToUAA(c echo.Context) error {

	uaaRes, u, err := p.login(c, p.Config.ConsoleClient, p.Config.ConsoleClientSecret, p.Config.UAAEndpoint)
	if err != nil {
		err = newHTTPShadowError(
			http.StatusUnauthorized,
			"Access Denied",
			"Access Denied: %v", err)
		return err
	}

	log.Printf("UAA Reponse: %+v\n", uaaRes)

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	err = p.saveUAAToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return err
	}

	uaaAdmin := false
	if contains(strings.Split(uaaRes.Scope, " "), UAAAdminIdentifier) {
		uaaAdmin = true
	}

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

	// TODO(woodnt): Remove most of the log.Print statements in this file.  We really need to not display a lot of this data.
	//               TEAMFOUR-619
	log.Println("loginToCNSI start")

	cnsiGUID := c.FormValue("cnsi_guid")

	log.Printf("CNSI: %s", cnsiGUID)

	if len(cnsiGUID) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	endpoint := ""
	cnsiRecord, ok := p.getCNSIRecord(cnsiGUID)

	log.Printf("CNSI Record: %v", cnsiRecord)

	if !ok {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No CNSI registered with GUID %s", cnsiGUID)
	}

	endpoint = cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	uaaRes, u, err := p.login(c, p.Config.HCFClient, p.Config.HCFClientSecret, tokenEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}

	log.Printf("UAA Reponse: %+v\n", uaaRes)

	// save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}
	u.UserGUID = userID

	log.Printf("User ID: %s", userID)

	p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
	log.Println("After SAVE of CNSI token")

	hcfAdmin := false
	if contains(strings.Split(uaaRes.Scope, " "), HCFAdminIdentifier) {
		hcfAdmin = true
	}

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

	log.Println("loginToCNSI complete")

	return nil
}

func (p *portalProxy) logoutOfCNSI(c echo.Context) error {

	log.Println("logoutOfCNSI start")

	cnsiGUID := c.FormValue("cnsi_guid")

	log.Printf("CNSI: %s", cnsiGUID)

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

	log.Printf("User ID: %s", userID)

	p.deleteCNSIToken(cnsiGUID, userID)

	log.Println("After DELETE of CNSI token")

	log.Println("logoutOfCNSI complete")
	return nil
}

func (p *portalProxy) login(c echo.Context, client string, clientSecret string, endpoint string) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
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

	res := c.Response().(*standard.Response).ResponseWriter
	cookie := &http.Cookie{
		Name:   portalSessionName,
		Value:  "",
		MaxAge: -1,
	}

	// TODO(wchrisjohnson): Explicitly clear out session  https://jira.hpcloud.net/browse/TEAMFOUR-630
	http.SetCookie(res, cookie)

	return nil
}

func (p *portalProxy) getUAATokenWithCreds(username, password, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAATokenWithRefreshToken(refreshToken, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	return p.getUAAToken(body, client, clientSecret, authEndpoint)
}

func (p *portalProxy) getUAAToken(body url.Values, client, clientSecret, authEndpoint string) (*UAAResponse, error) {

	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		return nil, fmt.Errorf("Failed to create request for UAA: %v", err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	res, err := httpClient.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		return nil, logHTTPError(res, err)
	}

	defer res.Body.Close()

	var response UAAResponse
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

func (p *portalProxy) saveUAAToken(u userTokenInfo, authTok string, refreshTok string) error {
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
	tokenRecord := tokens.TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
	}

	err := p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
	if err != nil {
		log.Printf("%v", err)
		return tokens.TokenRecord{}, err
	}

	return tokenRecord, nil
}

func (p *portalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		log.Printf("%v", err)
		return err
	}

	return nil
}

func (p *portalProxy) getUAATokenRecord(userGUID string) (tokens.TokenRecord, error) {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		fmt.Printf("Database error getting repo for UAA token: %v", err)
		return tokens.TokenRecord{}, err
	}

	tr, err := tokenRepo.FindUAAToken(userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		fmt.Printf("Database error finding UAA token: %v", err)
		return tokens.TokenRecord{}, err
	}

	return tr, nil
}

func (p *portalProxy) setUAATokenRecord(key string, t tokens.TokenRecord) error {

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

	sessionExpireTime, ok := p.getSessionInt64Value(c, "exp")
	if !ok {
		msg := "Could not find session date"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	if time.Now().After(time.Unix(sessionExpireTime, 0)) {
		msg := "Session has expired"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		msg := "Could not find user_id in Session"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	tr, err := p.getUAATokenRecord(sessionUser)
	if err != nil {
		msg := "Unable to find UAA Token: %s"
		log.Printf(msg, err)
		return fmt.Errorf(msg, err)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(tr.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Printf(msg, err)
		return fmt.Errorf(msg, err)
	}

	uaaAdmin := false
	if contains(userTokenInfo.Scope, UAAAdminIdentifier) {
		uaaAdmin = true
	}

	resp := &VerifySessionRes{
		Account: sessionUser,
		Admin:   fmt.Sprintf("%t", uaaAdmin),
	}

	err = c.JSON(http.StatusOK, resp)
	if err != nil {
		return err
	}

	log.Println("verifySession complete")

	return nil
}

// userinfo - returns info about the currently logged in user like so:
// [ { type: 'hcf', guid: 1234asdf, admin: true },
//   { type: 'hcf', guid: 1234asdg, admin: true },
//   { type: 'hcf', guid: 1234asdh, admin: true },
//   { type: 'uaa', admin: true },
// ]
func (p *portalProxy) userInfo(c echo.Context) error {

	log.Println("Entering userInfo")

	sessionUser, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		msg := "Could not find session user_id"
		log.Println(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// this is what gets returned to the caller
	arrPerms := []string{}

	// get the HCF related perms for each HCF endpoint registered
	arrPerms, err := getHCFPerms(p, sessionUser, arrPerms)
	if err != nil {
		return err
	}

	// get the UAA related perms
	arrPerms, err = getUAAPerms(p, sessionUser, arrPerms)
	if err != nil {
		return err
	}

	stringByte := "\x5B" + strings.Join(arrPerms, "\x2C\x20") + "\x5D"

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write([]byte(stringByte))

	return nil
}

func getHCFPerms(p *portalProxy, userGUID string, arrPerms []string) ([]string, error) {
	// Get a list of registered CNSIs by the user`
	CNSITokens, err := p.listCNSITokenRecordsForUser(userGUID)
	if err != nil {
		msg := "Unable to find any registered CNSI tokens"
		log.Println(msg)
		return nil, fmt.Errorf(msg)
	}

	// spin thru all registered CNSIs and grab the scope from each
	for i := 0; i < len(CNSITokens); i++ {

		// get the scope out of the JWT token data
		userTokenInfo, err := getUserTokenInfo(CNSITokens[i].AuthToken)
		if err != nil {
			msg := "Unable to find scope information in the CNSI Auth Token: %s"
			log.Printf(msg, err)
			return nil, fmt.Errorf(msg, err)
		}

		// based on the scope, is the user an admin for this CNSI?
		hcfAdmin := false
		if contains(userTokenInfo.Scope, UAAAdminIdentifier) {
			hcfAdmin = true
		}

		// build an entry for each HCF found for the user
		hcfEntry := &hcfPerms{
			Type:  "hcf",
			GUID:  userTokenInfo.UserGUID,
			Admin: fmt.Sprintf("%t", hcfAdmin),
		}

		h, _ := json.Marshal(hcfEntry)
		s := string(h)

		arrPerms = append(arrPerms, s)
	}

	return arrPerms, nil
}

func getUAAPerms(p *portalProxy, userGUID string, arrPerms []string) ([]string, error) {
	// get the uaa token record
	uaaTokenRecord, err := p.getUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		log.Println(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := getUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Printf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := false
	if contains(userTokenInfo.Scope, UAAAdminIdentifier) {
		uaaAdmin = true
	}

	// add the uaa entry to the output
	uaaEntry := &uaaPerms{
		Type:  "uaa",
		Admin: fmt.Sprintf("%t", uaaAdmin),
	}

	h, _ := json.Marshal(uaaEntry)
	s := string(h)

	arrPerms = append(arrPerms, s)

	return arrPerms, nil
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
