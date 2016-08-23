package main

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"

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

func getVCSClients(pc portalConfig) (map[VCSClientMapKey]oauth2.Config, error) {
	vcsClientMap := make(map[VCSClientMapKey]oauth2.Config)
	if pc.VCSClients != "" {
		for _, client := range strings.Split(pc.VCSClients, ";") {
			clientData := strings.Split(client, ",")
			if len(clientData) == 4 {
				vcsType := strings.ToLower(clientData[0])
				vcsClientType, err := getVCSType(vcsType)
				if err != nil {
					log.Printf("Unable to get VCS type %s: %v", vcsType, err)
					continue
				}

				pathPrefix := getAuthPathPrefix(vcsType)
				baseEndpoint := strings.TrimSpace(clientData[1])
				baseEndpointURL, err := url.Parse(baseEndpoint)
				if err != nil {
					log.Printf("Unable to parse VCS endpoint URL: %s", baseEndpoint)
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

				if vcsClientType == VCSGITHUB {
					vcsConfig.Scopes = githubScopes
				}

				vcsClientMap[VCSClientMapKey{baseEndpoint}] = vcsConfig
			}
		}
	}

	return vcsClientMap, nil
}

func getVCSType(vcs string) (VCSType, error) {
	log.Println("getVCSType")

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
	log.Println("getAuthPathPrefix")

	switch vcs {
	case "bitbucket":
		return VCSBITBUCKETAUTHPATHPREFIX
	default:
		return VCSGITHUBAUTHPATHPREFIX
	}
}
