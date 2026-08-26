package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func (p *portalProxy) DoOidcFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	slog.Debug("DoOidcFlowRequest")

	authHandler := p.OAuthHandlerFunc(cnsiRequest, req, p.RefreshOidcToken)
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (p *portalProxy) RefreshOidcToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t api.TokenRecord, err error) {
	slog.Debug("RefreshOidcToken", "endpoint", cnsiGUID, "user", userGUID)
	userToken, ok := p.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("info could not be found for user with GUID %s", userGUID)
	}

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	// Parse out token metadata is there is some, and override some of theser parameters

	var scopes string

	// not logged: raw metadata JSON includes the OAuth client secret
	// log.Info(userToken.Metadata)
	if len(userToken.Metadata) > 0 {
		metadata := &api.OAuth2Metadata{}
		if err := json.Unmarshal([]byte(userToken.Metadata), metadata); err == nil {
			// not logged: struct and ClientSecret carry the OAuth client secret
			// log.Info(metadata)
			// log.Info(metadata.ClientSecret)
			slog.Info("OIDC token refresh (client secret not logged)", "clientID", metadata.ClientID)

			if len(metadata.ClientID) > 0 {
				client = metadata.ClientID
			}
			if len(metadata.ClientSecret) > 0 {
				clientSecret = metadata.ClientSecret
			}
			if len(metadata.IssuerURL) > 0 {
				tokenEndpoint = metadata.IssuerURL
				tokenEndpointWithPath = fmt.Sprintf("%s/token", tokenEndpoint)
			}
		}
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(skipSSLValidation, userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath, scopes)
	if err != nil {
		return t, fmt.Errorf("token refresh request failed: %v", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.IDToken)
	if err != nil {
		return t, fmt.Errorf("could not get user token info from id token")
	}

	u.UserGUID = userGUID

	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, userToken.Disconnected)
	tokenRecord.AuthType = api.AuthTypeOIDC
	// Copy across the metadata from the original token
	tokenRecord.Metadata = userToken.Metadata

	err = p.setCNSITokenRecord(cnsiGUID, userGUID, tokenRecord)
	if err != nil {
		return t, fmt.Errorf("couldn't save new token: %v", err)
	}

	return tokenRecord, nil
}
