package main

import (
	"crypto/sha256"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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
		oauthStateString := uuid.NewV4().String()
		oauthConf := &vcsConfig

		url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)

		// save to endpoint to session using OAuth state string
		setVCSSession(p, c, oauthStateString, endpoint)

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

	// retrieve endpoint from session using OAuth state string
	state := c.FormValue("state")
	endpoint, ok := p.getSessionStringValue(c, state)
	if !ok {
		msg := fmt.Sprintf("Invalid OAuth state - %s not found in session\n", state)
		return c.HTML(http.StatusBadRequest, msg)
	}

	// clean up session
	if err := p.unsetSessionValue(c, state); err != nil {
		log.Printf("Unable to delete session value for key %s", state)
	}

	vcsClientKey := VCSClientMapKey{endpoint}
	if vcsConfig, ok := p.Config.VCSClientMap[vcsClientKey]; ok {
		oauthConf := &vcsConfig

		tr := &http.Transport{Proxy: http.ProxyFromEnvironment}
		if p.Config.SkipTLSVerification {
			tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
		}
		client := &http.Client{Transport: tr}
		ctx := context.WithValue(oauth2.NoContext, oauth2.HTTPClient, client)

		code := c.FormValue("code")
		token, err := oauthConf.Exchange(ctx, code)
		if err != nil {
			msg := fmt.Sprintf("oauthConf.Exchange() failed with '%s'\n", err)
			log.Println(msg)
			return c.HTML(http.StatusBadRequest, msg)
		}

		// stuff the token into the user's session
		sessionKey := newSessionKey(endpoint)
		if err = setVCSSession(p, c, sessionKey, token.AccessToken); err != nil {
			return c.HTML(http.StatusBadRequest, "Unable to update user session with token")
		}

		return c.HTML(http.StatusOK, successHTML)
	}

	log.Println("VCS Client not found")
	return c.HTML(http.StatusBadRequest, "VCS Client not found")
}

func (p *portalProxy) verifyVCSOAuthToken(c echo.Context) error {
	log.Println("verifyVCSAuthToken")

	var tokenExists = false

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	if _, ok := p.getSessionStringValue(c, newSessionKey(endpoint)); ok {
		log.Println("VCS OAuth token found in the session.")
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

	return nil
}

func (p *portalProxy) getVCSOAuthToken(c echo.Context) (string, bool) {
	log.Println("getVCSOAuthToken")

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	if token, ok := p.getSessionStringValue(c, newSessionKey(endpoint)); ok {
		return token, true
	}

	return "", false
}

func newSessionKey(endpoint string) string {
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
