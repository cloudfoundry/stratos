package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/labstack/echo"

	"golang.org/x/oauth2"
)

// VCSType - VCS type (i.e. github, bitbucket)
type VCSType string

// VCSAuthPathPrefix - VCS auth path prefix (i.e. /login (Github), /site (Bitbucket))
type VCSAuthPathPrefix string

// VCSGITHUB - Github
// VCSBITBUCKET - BitBucket
const (
	VCSGITHUB    VCSType = "github"
	VCSBITBUCKET VCSType = "bitbucket"

	VCSGITHUBAUTHPATHPREFIX    VCSAuthPathPrefix = "/login"
	VCSBITBUCKETAUTHPATHPREFIX VCSAuthPathPrefix = "/site"
)

// Define the necessary OAuth scopes needed by the application
// For now, Github only. Using default for BitBucket.
var githubScopes = []string{"admin:repo_hook", "repo", "user"}

// VCSAuthCheckResp - Response used to tell caller whether the user has gone thru
// the GitHub OAuth2 flow
type VCSAuthCheckResp struct {
	Authorized bool `json:"authorized"`
}

// VCSClientMapKey - key for VCSClientMap in portal config
type VCSClientMapKey struct {
	Endpoint string
}

func getVCSClients(pc portalConfig) (map[VCSClientMapKey]oauth2.Config, map[VCSClientMapKey]bool, error) {
	logger.Info("getVCSClients")
	vcsClientMap := make(map[VCSClientMapKey]oauth2.Config)
	vcsSkipSSLMap := make(map[VCSClientMapKey]bool)

	if pc.VCSClients != "" {
		for _, client := range strings.Split(pc.VCSClients, ";") {
			clientData := strings.Split(client, ",")

			clientDataLen := len(clientData)
			if clientDataLen < 4 || clientDataLen > 5 {
				logger.Errorf("Expected to have 4 or 5 elements for VCS entry: %s", clientData)
				continue
			}

			vcsType := strings.ToLower(clientData[0])
			vcsClientType, err := getVCSType(vcsType)
			if err != nil {
				logger.Errorf("Unable to get VCS type %s: %v", vcsType, err)
				continue
			}

			pathPrefix := getAuthPathPrefix(vcsType)
			baseEndpoint := strings.TrimSpace(clientData[1])
			baseEndpointURL, err := url.Parse(baseEndpoint)
			if err != nil {
				logger.Errorf("Unable to parse VCS endpoint URL: %s", baseEndpoint)
				continue
			}

			authEndpoint := fmt.Sprintf("%s://%s%s/oauth/authorize", baseEndpointURL.Scheme, baseEndpointURL.Host, pathPrefix)
			tokenEndpoint := fmt.Sprintf("%s://%s%s/oauth/access_token", baseEndpointURL.Scheme, baseEndpointURL.Host, pathPrefix)

			vcsConfig := oauth2.Config{
				Endpoint: oauth2.Endpoint{
					AuthURL:  authEndpoint,
					TokenURL: tokenEndpoint,
				},
				ClientID:     clientData[2],
				ClientSecret: clientData[3],
			}

			vcsSkipSSLMap[VCSClientMapKey{baseEndpoint}] = false
			if clientDataLen == 5 && clientData[4] != "" && strings.ToLower(clientData[4]) == "true" {
				vcsSkipSSLMap[VCSClientMapKey{baseEndpoint}] = true
			}

			if vcsClientType == VCSGITHUB {
				vcsConfig.Scopes = githubScopes
			}

			vcsClientMap[VCSClientMapKey{baseEndpoint}] = vcsConfig
		}
	}

	return vcsClientMap, vcsSkipSSLMap, nil
}

func getVCSType(vcs string) (VCSType, error) {
	logger.Info("getVCSType")

	var newType VCSType

	switch vcs {
	case
		"github",
		"bitbucket":
		return VCSType(vcs), nil
	}
	return newType, errors.New("Invalid string passed to getVCSType.")
}

func getAuthPathPrefix(vcs string) VCSAuthPathPrefix {
	logger.Info("getAuthPathPrefix")

	switch vcs {
	case "bitbucket":
		return VCSBITBUCKETAUTHPATHPREFIX
	default:
		return VCSGITHUBAUTHPATHPREFIX
	}
}

func (p *portalProxy) listVCSClients(c echo.Context) error {
	logger.Info("listVCSClients")
	keys := make([]string, len(p.Config.VCSClientMap))

	i := 0
	for k := range p.Config.VCSClientMap {
		keys[i] = k.Endpoint
		i++
	}

	jsonString, err := json.Marshal(keys)
	if err != nil {
		return newHTTPShadowError(
			http.StatusUnauthorized,
			"Listing VCS clients failed",
			"Listing VCS clients failed: %v", err)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}
