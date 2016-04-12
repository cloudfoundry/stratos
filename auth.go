package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
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

func (p *portalProxy) login(c echo.Context) error {
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return echo.NewHTTPError(400, `{"error": "Needs username and password"}`)
	}

	uaaRes, err := getUAAToken(username, password, p.Config.UAAEndpoint, p.Config.UAAClient, p.Config.UAAClientSecret)
	if err != nil {
		log.Printf("UAA call failed : %v", err)
		return echo.NewHTTPError(500, `{"error": "UAA call failed!"}`)
	}

	accessToken := strings.TrimPrefix(uaaRes.AccessToken, "bearer ")
	tokenInfo, err := getUserTokenInfo(accessToken)
	if err != nil {
		log.Printf("Bad UAA token: %v", err)
		return echo.NewHTTPError(500, `{"error": "Bad UAA token"}`)
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = tokenInfo.UserGUID
	sessionValues["exp"] = tokenInfo.TokenExpiry

	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	p.saveUAAToken("foo", tokenInfo, accessToken, uaaRes.RefreshToken)

	return nil
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

func getUAAToken(username, password, authEndpoint, client, clientSecret string) (*UAAResponse, error) {
	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		io.Copy(os.Stdout, res.Body)
		return nil, fmt.Errorf("UAA returned non-200: %d", res.StatusCode)
	}

	var response UAAResponse
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		return nil, err
	}

	return &response, nil
}

func mkTokenRecordKey(cnsiID string, userGUID string) string {
	return fmt.Sprintf("%s:%s", cnsiID, userGUID)
}

func (p *portalProxy) saveUAAToken(cnsiID string, u userTokenInfo, authTok string, refreshTok string) error {
	key := mkTokenRecordKey(cnsiID, u.UserGUID)
	var tokenRecord tokenRecord
	tokenRecord.CNSIID = cnsiID
	tokenRecord.UserGUID = u.UserGUID
	tokenRecord.TokenExpiry = u.TokenExpiry
	tokenRecord.AuthToken = authTok
	tokenRecord.RefreshToken = refreshTok

	p.TokenMap[key] = tokenRecord

	return nil
}
