package main

import (
	"fmt"
	"log"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"

	"github.com/labstack/echo"
)

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
        name: 'GitHub Oauth - token',
        data: __TOKEN__
      }), window.location.origin);
    })();
  </script>
  </body>
  </html>`

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

	// func handleGitHubLogin(w http.ResponseWriter, r *http.Request) {
	url := oauthConf.AuthCodeURL(oauthStateString, oauth2.AccessTypeOnline)
	c.Redirect(200, url)
	// http.Redirect(w,e r, url, http.StatusTemporaryRedirect)

	return nil
}

func (p *portalProxy) handleGitHubCallback(c echo.Context) error {

	log.Println("handleGitHubCallback")

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

	state := c.FormValue("state")
	if state != oauthStateString {
		log.Printf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
		// http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		c.Redirect(500, "/")
		return fmt.Errorf("invalid oauth state, expected '%s', got '%s'\n", oauthStateString, state)
	}

	log.Printf("Got state: %s", state)

	code := c.FormValue("code")
	token, err := oauthConf.Exchange(oauth2.NoContext, code)
	if err != nil {
		log.Printf("oauthConf.Exchange() failed with '%s'\n", err)
		// http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		c.Redirect(500, "/")
		return fmt.Errorf("oauthConf.Exchange() failed with '%s'\n", err)
	}

	log.Printf("Got token: %s", token)

	// oauthClient := oauthConf.Client(oauth2.NoContext, token)
	// client := github.NewClient(oauthClient)
	// user, _, err := client.Users.Get("")
	// if err != nil {
	// 	fmt.Printf("client.Users.Get() faled with '%s'\n", err)
	// 	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
	// 	return
	// }

	// log.Printf("Logged in as GitHub user: %s\n", *user.Login)
	// http.Redirect(w, r, "/", http.StatusTemporaryRedirect)

	//
	// send conf page to user
	return nil
}
