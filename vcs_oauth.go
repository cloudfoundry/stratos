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

	"github.com/hpcloud/portal-proxy/repository/vcs"
	"github.com/labstack/echo"
)

// Templates we'll need - cache them here when the module first loads
// to give us good performance, especially on the ones used > once.
var (
	cwd, _      = os.Getwd()
	successTpl  = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/success.html")))
	failureTpl  = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/failure.html")))
	notfoundTpl = template.Must(template.ParseFiles(filepath.Join(cwd, "./templates/clientNotFound.html")))
)

type GithubUser struct {
	ID   string `json:"id"`
	Name string `json:"login"`
}

// handleVCSAuth This is step 1 of the 2 step OAuth dance. We redirect to the
// OAuth provider, and if all goes well, they will hit our callback URL - see
// handleVCSAuthCallback below.
func (p *portalProxy) handleVCSAuth(c echo.Context) error {
	logger.Debug("handle VCS OAuth")

	endpoint := c.QueryParam("endpoint")
	userGUID, err := getPortalUserGUID(c)
	if err != nil {
		logger.Errorf("Can't find portal user GUID: %s", err)
		return c.HTML(http.StatusOK, templateToString(failureTpl))
	}

	// Check if this user + endpoint already has a token
	vcsRepository, err := vcstokens.NewPgsqlVCSTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		logger.Errorf("Can't connect to VCS Token Repository: %s", err)
		return c.HTML(http.StatusOK, templateToString(failureTpl))
	}
	vcsToken, err := vcsRepository.FindVCSToken(endpoint, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		vcsClientKey := VCSClientMapKey{endpoint}
		if vcsConfig, ok := p.Config.VCSClientMap[vcsClientKey]; ok {
			//oauthStateString := uuid.NewV4().String()
			oauthConf := &vcsConfig
			url := oauthConf.AuthCodeURL(userGUID, oauth2.AccessTypeOnline)

			// save to endpoint to session via the OAuth state string
			// state string is set to userGUID so that we can retrieve the userGUID in the callback handler
			setVCSSession(p, c, userGUID, endpoint)

			logger.Debugf("OAuth url: %s", url)

			// redirect to the VCS provider
			return c.Redirect(302, url)
		}

		logger.Error("VCS Client not found")

		return c.HTML(http.StatusOK, templateToString(notfoundTpl))
	}

	sessionKey := newSessionKey(endpoint)
	if err = setVCSSession(p, c, sessionKey, vcsToken.AccessToken); err != nil {
		return c.HTML(http.StatusOK, templateToString(failureTpl))
	}

	return c.HTML(http.StatusOK, templateToString(successTpl))
}

// handleVCSAuthCallback This is step 2 of the 2 step OAuth dance.
func (p *portalProxy) handleVCSAuthCallback(c echo.Context) error {
	logger.Debug("handleVCSAuthCallback")

	// retrieve endpoint from session using OAuth state string
	userGUID := c.FormValue("state")
	endpoint, ok := p.getSessionStringValue(c, userGUID)
	if !ok {
		return c.HTML(http.StatusOK, templateToString(failureTpl))
	}

	// clean up session
	if err := p.unsetSessionValue(c, userGUID); err != nil {
		logger.Errorf("Unable to delete session value for key %s", userGUID)
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
			logger.Errorf("oauthConf.Exchange() failed with '%s'\n", err)
			return c.HTML(http.StatusOK, templateToString(failureTpl))
		}

		t := new(vcstokens.VCSTokenRecord)
		t.UserGUID = userGUID // TODO: figure out how to get the user guid into this function
		t.AccessToken = token.AccessToken
		t.Endpoint = endpoint

		// If not, get a new token and store it in the DB for the user.
		vcsRepository, err := vcstokens.NewPgsqlVCSTokenRepository(p.DatabaseConnectionPool)
		if err != nil {
			logger.Errorf("Can't connect to VCS Token Repository: %s", err)
			return c.HTML(http.StatusOK, templateToString(failureTpl))
		}

		err = vcsRepository.SaveVCSToken(*t, p.Config.EncryptionKeyInBytes)
		if err != nil {
			logger.Warnf("Failed to save token to VCS Token Repository: %s", err)
		}

		sessionKey := newSessionKey(endpoint)
		if err = setVCSSession(p, c, sessionKey, token.AccessToken); err != nil {
			return c.HTML(http.StatusOK, templateToString(failureTpl))
		}

		return c.HTML(http.StatusOK, templateToString(successTpl))
	}

	logger.Error("VCS Client not found")
	return c.HTML(http.StatusOK, templateToString(notfoundTpl))
}

func (p *portalProxy) verifyVCSOAuthToken(c echo.Context) error {
	logger.Debug("verifyVCSAuthToken")

	var tokenExists = false

	endpoint := c.Request().Header().Get("x-cnap-vcs-url")
	if _, ok := p.getSessionStringValue(c, newSessionKey(endpoint)); ok {
		logger.Debug("VCS OAuth token found in the session.")
		tokenExists = true
	}

	logger.Debug("Preparing response")
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

	logger.Debug("Storing value in session")
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
