package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	"github.com/labstack/echo"
)

// GitHubAuthCheckResp - Response used to tell caller whether the user has gone thru
// the GitHub OAuth2 flow
type GitHubAuthCheckResp struct {
	Authorized bool `json:"authorized"`
}

// githubOAuthTokenKey - the key used to store the user's GitHub OAuth token in session
const githubOAuthTokenKey = "github_oauth_token"

// TODO (wchrisjohnson): Make configurable w/a default.
//    https://jira.hpcloud.net/browse/TEAMFOUR-632
// AarondL: These scopes should probably be configurable with a default.
//    https://jira.hpcloud.net/browse/TEAMFOUR-632

// Define the necessary OAuth scopes needed by the application
var scopes = []string{"admin:repo_hook", "repo", "repo:status"}

// handleGitHubAuth <TBD>
func (p *portalProxy) handleGitHubAuth(c echo.Context) error {
	log.Println("handleGitHubAuth")

	var (
		oauthConf = &oauth2.Config{
			ClientID:     p.Config.GitHubOauthClientID,
			ClientSecret: p.Config.GitHubOAuthClientSecret,
			Scopes:       scopes,
			Endpoint:     github.Endpoint,
		}

		// TODO (wchrisjohnson): Change this to something purely and significantly
		// random and stuff it in the user's session.
		//    https://jira.hpcloud.net/browse/TEAMFOUR-561
		// AArondL: This is a configuration parameter that appears to be passed in.
		// This means it's anything but random. The idea behind a nonce like this is
		// to store it in the session so that the server has some identification for
		// the request that comes back so that if the nonce isn't found in the
		// session you know it's a bogus oauth2 request.

		// random string for oauth2 API calls to protect against CSRF
		oauthStateString = p.Config.GitHubOAuthState
	)

	// TODO (wchrisjohnson): SECURITY RISK - remove this log statement
	//    https://jira.hpcloud.net/browse/TEAMFOUR-561
	log.Printf("oauthConf: %v", oauthConf)

	// TODO (wchrisjohnson): SECURITY RISK - remove this log statement
	//    https://jira.hpcloud.net/browse/TEAMFOUR-561
	log.Printf("oauthStateString: %s", oauthStateString)

	url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)

	// TODO (wchrisjohnson): SECURITY RISK - remove this log statement
	//    https://jira.hpcloud.net/browse/TEAMFOUR-561
	log.Printf("OAuth url: %s", url)

	return c.Redirect(302, url)
}

// handleGitHubCallback <TBD>
func (p *portalProxy) handleGitHubCallback(c echo.Context) error {
	log.Println("handleGitHubCallback")

	var (
		// OAuth2 configuration expected by the OAuth2 package
		oauthConf = &oauth2.Config{
			ClientID:     p.Config.GitHubOauthClientID,
			ClientSecret: p.Config.GitHubOAuthClientSecret,
			Scopes:       scopes,
			Endpoint:     github.Endpoint,
		}

		// TODO (wchrisjohnson): TEAMFOUR-561 - Change this to something purely and
		// significantly random and stuff it in the user's session.

		// AArondL: This is a configuration parameter that appears to be passed in.
		// This means it's anything but random. The idea behind a nonce like this is
		// to store it in the session so that the server has some identification for
		// the request that comes back so that if the nonce isn't found in the
		// session you know it's a bogus oauth2 request.

		// random string for oauth2 API calls to protect against CSRF
		oauthStateString = p.Config.GitHubOAuthState
	)

	// TODO (wchrisjohnson): TEAMFOUR-561 - Change this to a template and put in a file.
	// This is an entry point for an XSS attack because you have no logic to
	// escape the token at all. Printf should never be used for HTML templating
	// because of that. Please use the html/template package to get this functionality.
	var successHTML = `
    <!doctype html>
    <html>
    <head><link rel="stylesheet" href="/index.css"></head>
    <body id="github-auth-callback-page">
    <h1 class="text-center">GitHub authorization is done.</h1>
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
	if state != oauthStateString {
		msg := fmt.Sprintf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
		log.Printf(msg)
		return c.HTML(http.StatusBadRequest, msg)
	}

	// TODO (wchrisjohnson): SECURITY RISK - TEAMFOUR-561 - remove this log statement
	log.Printf("Got state: %s", state)

	code := c.FormValue("code")
	token, err := oauthConf.Exchange(oauth2.NoContext, code)
	if err != nil {
		msg := fmt.Sprintf("oauthConf.Exchange() failed with '%s'\n", err)
		log.Printf(msg)
		return c.HTML(http.StatusBadRequest, msg)
	}

	// TODO (wchrisjohnson): SECURITY RISK - TEAMFOUR-561 - remove this log statement
	log.Printf("Got token: %+v\n", token)

	// stuff the token into the user's session
	sessionValues := make(map[string]interface{})
	sessionValues[githubOAuthTokenKey] = token.AccessToken

	log.Println("Storing token in session")
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	return c.HTML(http.StatusOK, successHTML)
}

func (p *portalProxy) verifyGitHubAuthToken(c echo.Context) error {

	log.Println("verifyGitHubToken")

	var tokenExists = false

	// We check for the existence of the oauth token in the session
	// we dont care about the token itself at this point.
	log.Println("Checking session for token")
	_, ok := p.getSessionStringValue(c, githubOAuthTokenKey)
	if ok {
		log.Println("GitHub OAuth token found in the session.")
		tokenExists = true
	}

	log.Println("Preparing response")
	authResp := &GitHubAuthCheckResp{
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

func (p *portalProxy) getGitHubAuthToken(c echo.Context) string {

	log.Println("getGitHubAuthToken")
	token, ok := p.getSessionStringValue(c, githubOAuthTokenKey)
	if ok {
		return token
	}

	return ""
}
