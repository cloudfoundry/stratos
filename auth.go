package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"

	"github.com/hpcloud/portal-proxy/repository/tokens"
)

// UAAResponse - <TBD>
type UAAResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	JTI          string `json:"jti"`
}

// LoginRes - <TBD>
type LoginRes struct {
	Account     string   `json:"account"`
	TokenExpiry int64    `json:"token_expiry"`
	APIEndpoint *url.URL `json:"api_endpoint"`
	Scope       string   `json:"scope"`
}

// uaaPerms - <TBD>
type uaaPerms struct {
	Type  string `json:"type"`
	Admin string `json:"admin"`
}

// hcfPerms - <TBD>
type hcfPerms struct {
	Type  string `json:"type"`
	GUID  string `json:"guid"`
	Admin string `json:"admin"`
}

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

	resp := &LoginRes{
		Account:     c.FormValue("username"),
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: nil,
		Scope:       uaaRes.Scope,
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

	resp := &LoginRes{
		Account:     u.UserGUID,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: cnsiRecord.APIEndpoint,
		Scope:       uaaRes.Scope,
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
			msg := "Unable to find scope information in the CNSI Auth Token"
			log.Println(msg)
			return nil, fmt.Errorf(msg)
		}

		// based on the scope, is the user an admin for this CNSI?
		hcfAdmin := false
		if contains(userTokenInfo.Scope, "cloud_controller.admin") {
			hcfAdmin = true
		}

		// build an entry for each HCF found for the user
		hcfEntry := &hcfPerms{
			Type:  "hcf",
			GUID:  userGUID,
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
		msg := "Unable to find scope information in the UAA Auth Token"
		log.Println(msg)
		return nil, fmt.Errorf(msg)
	}

	// is the user a UAA admin?
	uaaAdmin := false
	if contains(userTokenInfo.Scope, "uaa.admin") {
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
