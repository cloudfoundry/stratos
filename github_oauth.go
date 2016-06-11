package main

import (
	"fmt"
	"log"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	"github.com/labstack/echo"
)

// handleGitHubAuth <TBD>
func (p *portalProxy) handleGitHubAuth(c echo.Context) error {

	log.Println("handleGitHubAuth")

	var (
		oauthConf = &oauth2.Config{
			ClientID:     p.Config.GitHubOauthClientID,
			ClientSecret: p.Config.GitHubOAuthClientSecret,
			Scopes:       []string{"admin:repo_hook", "repo", "repo:status "},
			Endpoint:     github.Endpoint,
		}
		// random string for oauth2 API calls to protect against CSRF
		oauthStateString = p.Config.GitHubOAuthState
	)

	// TODO (wchrisjohnson) SECURITY RISK - remove this log statement once running
	log.Printf("oauthConf: %v", oauthConf)

	// TODO (wchrisjohnson) SECURITY RISK - remove this log statement once running
	log.Printf("oauthStateString: %s", oauthStateString)

	url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)

	log.Printf("OAuth url: %s", url)

	return c.Redirect(302, url)
}

// handleGitHubCallback <TBD>
func (p *portalProxy) handleGitHubCallback(c echo.Context) error {

	log.Println("handleGitHubCallback")

	var (
		// Define the necessary OAuth scopes needed by the application
		scopes = []string{"admin:repo_hook", "repo", "repo:status "}

		// OAuth2 configuration expected by the OAuth2 package
		oauthConf = &oauth2.Config{
			ClientID:     p.Config.GitHubOauthClientID,
			ClientSecret: p.Config.GitHubOAuthClientSecret,
			Scopes:       scopes,
			Endpoint:     github.Endpoint,
		}

		// random string for oauth2 API calls to protect against CSRF
		oauthStateString = p.Config.GitHubOAuthState

		// The markup that defines the reponse back to the user after succcessfully
		// authenticating against GitHub
		successHTML = `
      <!doctype html>
      <html>
      <head><link rel="stylesheet" href="/index.css"></head>
      <body id="github-auth-callback-page">
      <h1 class="text-center">GitHub authorization is done.</h1>
      <p class="text-center"><button class="btn btn-primary" onclick="window.close()">Close window and continue</button></p>
      <script>
        (function () {
          window.opener.postMessage(JSON.stringify({
            name: 'GitHub Oauth - token',
            data: %s
          }), window.location.origin);
        })();
      </script>
      </body>
      </html>`
	)

	state := c.FormValue("state")
	if state != oauthStateString {
		msg := fmt.Sprintf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
		log.Printf(msg)
		return c.String(http.StatusBadRequest, msg)
	}

	// TODO (wchrisjohnson) SECURITY RISK - remove this log statement once running
	log.Printf("Got state: %s", state)

	code := c.FormValue("code")
	token, err := oauthConf.Exchange(oauth2.NoContext, code)
	if err != nil {
		msg := fmt.Sprintf("oauthConf.Exchange() failed with '%s'\n", err)
		log.Printf(msg)
		return c.String(http.StatusBadRequest, msg)
	}

	// TODO (wchrisjohnson) SECURITY RISK - remove this log statement once running
	log.Printf("Got token: %s", token)

	return c.String(http.StatusOK, fmt.Sprintf(successHTML, token))
}
