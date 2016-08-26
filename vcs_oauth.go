package main

import (
	"bytes"
	"crypto/sha256"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
	"path/filepath"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"

	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"
)

// Templates we'll need - cache them here when the module first loads
// to give us good performance, especially on the ones used > once.
var (
	cwd, _ = os.Getwd()
	s      = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/success.html")))
	f      = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/failure.html")))
	cnf    = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/clientNotFound.html")))
)

// handleVCSAuth This is step 1 of the 2 step OAuth dance. We redirect to the
// OAuth provider, and if all goes well, they will hit our callback URL - see
// handleVCSAuthCallback below.
func (p *portalProxy) handleVCSAuth(c echo.Context) error {
	logger.Debug("handle VCS OAuth")

	endpoint := c.QueryParam("endpoint")
	vcsClientKey := VCSClientMapKey{endpoint}
	if vcsConfig, ok := p.Config.VCSClientMap[vcsClientKey]; ok {
		oauthStateString := uuid.NewV4().String()
		oauthConf := &vcsConfig

		url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)

		// save to endpoint to session via the OAuth state string
		setVCSSession(p, c, oauthStateString, endpoint)

		logger.Debug("OAuth url: %s", url)

		// redirect to the VCS provider
		return c.Redirect(302, url)
	}

	logger.Error("VCS Client not found")

	return c.HTML(http.StatusOK, templateToString(cnf))
}

// handleVCSAuthCallback This is step 2 of the 2 step OAuth dance.
func (p *portalProxy) handleVCSAuthCallback(c echo.Context) error {
	logger.Debug("handleVCSAuthCallback")

	// retrieve endpoint from session using OAuth state string
	state := c.FormValue("state")
	endpoint, ok := p.getSessionStringValue(c, state)
	if !ok {
		return c.HTML(http.StatusOK, templateToString(f))
	}

	// clean up session
	if err := p.unsetSessionValue(c, state); err != nil {
		logger.Error("Unable to delete session value for key %s", state)
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
			logger.Error(msg)
			return c.HTML(http.StatusOK, templateToString(f))
		}

		// stuff the token into the user's session
		sessionKey := newSessionKey(endpoint)
		if err = setVCSSession(p, c, sessionKey, token.AccessToken); err != nil {
			return c.HTML(http.StatusOK, templateToString(f))
		}

		return c.HTML(http.StatusOK, templateToString(s))
	}

	logger.Error("VCS Client not found")
	return c.HTML(http.StatusOK, templateToString(cnf))
}

func (p *portalProxy) verifyVCSOAuthToken(c echo.Context) error {
	logger.Debug("verifyVCSAuthToken")

	var tokenExists = false

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	if _, ok := p.getSessionStringValue(c, newSessionKey(endpoint)); ok {
		logger.Error("VCS OAuth token found in the session.")
		tokenExists = true
	}

	logger.Error("Preparing response")
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
	logger.Debug("getVCSOAuthToken")

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

	logger.Error("Storing value in session")
	if err := p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	return nil
}

func templateToString(t *template.Template) string {
	var html bytes.Buffer
	t.Execute(&html, nil)
	return html.String()
}
