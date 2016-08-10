package main

import (
	"crypto/sha256"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"

	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
)

// handleVCSAuth <TBD>
func (p *portalProxy) handleVCSAuth(c echo.Context) error {
	log.Println("handle VCS OAuth")

	endpoint := c.QueryParam("endpoint")
	vcsClientKey := VCSClientMapKey{endpoint}
	if vcsConfig, ok := p.Config.VCSClientMap[vcsClientKey]; ok {
		oauthStateString := uuid.NewV4().String() + ";" + endpoint
		oauthConf := &vcsConfig

		url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)

		sessionKey := getSessionKey(endpoint)
		setVCSSession(p, c, sessionKey, oauthStateString)

		log.Printf("oauthConf: %+v", oauthConf)
		log.Printf("OAuth url: %s", url)

		return c.Redirect(302, url)
	}

	log.Println("VCS Client not found")
	return c.HTML(http.StatusBadRequest, "VCS Client not found")
}

// handleVCSAuthCallback <TBD>
func (p *portalProxy) handleVCSAuthCallback(c echo.Context) error {
	log.Println("handleVCSAuthCallback")

	// TODO (wchrisjohnson): TEAMFOUR-561 - Change this to a template and put in a file.
	// This is an entry point for an XSS attack because you have no logic to
	// escape the token at all. Printf should never be used for HTML templating
	// because of that. Please use the html/template package to get this functionality.
	var successHTML = `
    <!doctype html>
    <html>
    <head><link rel="stylesheet" href="/index.css"></head>
    <body id="github-auth-callback-page">
    <h1 class="text-center">VCS authorization is done.</h1>
    <p class="text-center"><button class="btn btn-primary" onclick="window.close()">Close window and continue</button></p>
    <script>
      (function () {
        window.opener.postMessage(JSON.stringify({
          name: 'GitHub Oauth - token'
        }), window.location.origin);
      })();
    </script>
    </body>
    </html>`

	state := c.FormValue("state")
	endpoint := strings.Split(state, ";")[1]
	vcsClientKey := VCSClientMapKey{endpoint}
	if vcsConfig, ok := p.Config.VCSClientMap[vcsClientKey]; ok {
		oauthConf := &vcsConfig
		log.Printf("Github callback config: %v", oauthConf)

		sessionKey := getSessionKey(endpoint)

		oauthStateString, ok := p.getSessionStringValue(c, sessionKey)
		if !ok {
			log.Println("GitHub OAuth token found in the session.")
			return c.HTML(http.StatusBadRequest, "OAuth state string not found")
		}

		if state != oauthStateString {
			msg := fmt.Sprintf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
			log.Printf(msg)
			return c.HTML(http.StatusBadRequest, msg)
		}

		// TODO (wchrisjohnson): SECURITY RISK - TEAMFOUR-561 - remove this log statement
		log.Printf("Got state: %s", state)

		tr := &http.Transport{Proxy: http.ProxyFromEnvironment}
		if p.Config.SkipTLSVerification {
			tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
		}
		client := &http.Client{Transport: tr}
		ctx := context.TODO()
		ctx = context.WithValue(ctx, oauth2.HTTPClient, client)

		code := c.FormValue("code")
		token, err := oauthConf.Exchange(ctx, code)
		if err != nil {
			msg := fmt.Sprintf("oauthConf.Exchange() failed with '%s'\n", err)
			log.Printf(msg)
			return c.HTML(http.StatusBadRequest, msg)
		}

		// TODO (wchrisjohnson): SECURITY RISK - TEAMFOUR-561 - remove this log statement
		log.Printf("Got token: %+v\n", token)

		// stuff the token into the user's session
		if err = setVCSSession(p, c, sessionKey, token.AccessToken); err != nil {
			return c.HTML(http.StatusBadRequest, "Unable to update user session with token")
		}

		return c.HTML(http.StatusOK, successHTML)
	}

	log.Println("VCS Client not found")
	return c.HTML(http.StatusBadRequest, "VCS Client not found")
}

func (p *portalProxy) verifyVCSAuthToken(c echo.Context) error {
	log.Println("verifyVCSAuthToken")

	var tokenExists = false

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	tokenKey, ok := p.getSessionStringValue(c, getSessionKey(endpoint))
	if ok {
		// We check for the existence of the oauth token in the session
		// we dont care about the token itself at this point.
		log.Println("Checking session for token")
		_, ok := p.getSessionStringValue(c, tokenKey)
		if ok {
			log.Println("GitHub OAuth token found in the session.")
			tokenExists = true
		}

		log.Println("Preparing response")
		authResp := &VCSAuthCheckResp{
			Authorized: tokenExists,
		}

		jsonString, err := json.Marshal(authResp)
		if err != nil {
			return err
		}

		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return nil
}

func (p *portalProxy) getVCSAuthToken(c echo.Context) string {
	log.Println("getVCSAuthToken")

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	if token, ok := p.getSessionStringValue(c, getSessionKey(endpoint)); ok {
		return token
	}

	return ""
}

func getSessionKey(endpoint string) string {
	shaHash := sha256.New()
	return fmt.Sprintf("%x", shaHash.Sum([]byte(endpoint)))
}

func setVCSSession(p *portalProxy, c echo.Context, sessionKey string, sessionValue string) error {
	// stuff the token into the user's session
	sessionValues := make(map[string]interface{})
	sessionValues[sessionKey] = sessionValue

	log.Println("Storing value in session")
	if err := p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	return nil
}
