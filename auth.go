package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

type UAAResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	JTI          string `json:"jti"`
}

func (p *portalProxy) loginToUAA(c echo.Context) error {

	uaaRes, u, err := p.login(c, p.Config.UAAEndpoint)
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

	p.saveUAAToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)

	return nil
}

func (p *portalProxy) loginToCNSI(c echo.Context) error {
	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	endpoint := p.CNSIs[cnsiGUID].AuthorizationEndpoint
	if endpoint == "" {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No CNSI registered with GUID %s", cnsiGUID)
	}

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)
	uaaRes, u, err := p.login(c, tokenEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}

	p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)

	return nil
}

func (p *portalProxy) login(c echo.Context, endpoint string) (uaaRes *UAAResponse, u *userTokenInfo, err error) {
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	uaaRes, err = p.getUAATokenWithCreds(username, password, endpoint)
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
	http.SetCookie(res, cookie)

	return nil
}

func (p *portalProxy) getUAATokenWithCreds(username, password, authEndpoint string) (*UAAResponse, error) {
	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, authEndpoint)
}

func (p *portalProxy) getUAATokenWithRefreshToken(refreshToken, authEndpoint string) (*UAAResponse, error) {
	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	return p.getUAAToken(body, authEndpoint)
}

func (p *portalProxy) getUAAToken(body url.Values, authEndpoint string) (*UAAResponse, error) {

	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		return nil, fmt.Errorf("Failed to create request for UAA: %v", err)
	}

	req.SetBasicAuth(p.Config.UAAClient, p.Config.UAAClientSecret)
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

func mkTokenRecordKey(cnsiID string, userGUID string) string {
	return fmt.Sprintf("%s:%s", cnsiID, userGUID)
}

func (p *portalProxy) saveUAAToken(u userTokenInfo, authTok string, refreshTok string) error {
	key := u.UserGUID
	tokenRecord := tokenRecord{
		TokenExpiry:  u.TokenExpiry,
		AuthToken:    authTok,
		RefreshToken: refreshTok,
	}
	p.setUAATokenRecord(key, tokenRecord)

	return nil
}

func (p *portalProxy) saveCNSIToken(cnsiID string, u userTokenInfo, authTok string, refreshTok string) error {
	key := mkTokenRecordKey(cnsiID, u.UserGUID)
	tokenRecord := tokenRecord{
		TokenExpiry:  u.TokenExpiry,
		AuthToken:    authTok,
		RefreshToken: refreshTok,
	}
	p.setCNSITokenRecord(key, tokenRecord)

	return nil
}

func (p *portalProxy) getUAATokenRecord(key string) tokenRecord {
	p.UAATokenMapMut.RLock()
	t := p.UAATokenMap[key]
	p.UAATokenMapMut.RUnlock()

	return t
}

func (p *portalProxy) setUAATokenRecord(key string, t tokenRecord) {
	p.UAATokenMapMut.Lock()
	p.UAATokenMap[key] = t
	p.UAATokenMapMut.Unlock()
}
