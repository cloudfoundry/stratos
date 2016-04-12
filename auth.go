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

	tokenInfo, err := getUserTokenInfo(strings.TrimPrefix(uaaRes.AccessToken, "bearer "))
	if err != nil {
		log.Printf("Bad UAA token: %v", err)
		return echo.NewHTTPError(500, `{"error": "Bad UAA token"}`)
	}

	fmt.Println(tokenInfo)

	return nil
}

func (p *portalProxy) logout(c echo.Context) error {
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
