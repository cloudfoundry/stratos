package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
)

func (p *portalProxy) doOidcFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doOidcFlowRequest")

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint record: %v", err)
	}

	got401 := false
	expTime := time.Unix(tokenRec.TokenExpiry, 0)

	for {
		if got401 || expTime.Before(time.Now()) {
			refreshedTokenRec, err := p.RefreshOidcToken(cnsi.SkipSSLValidation, cnsiRequest.GUID, cnsiRequest.UserGUID, cnsi.ClientId, cnsi.ClientSecret, cnsi.TokenEndpoint)
			if err != nil {
				log.Info(err)
				return nil, fmt.Errorf("Couldn't refresh OIDC token for Endpoint with GUID %s", cnsiRequest.GUID)
			}
			tokenRec = refreshedTokenRec
		}
		req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

		var client http.Client
		client = p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
		res, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("Request failed: %v", err)
		}

		if res.StatusCode != 401 {
			return res, nil
		}

		if got401 {
			return res, errors.New("Failed to authorize")
		}
		got401 = true
	}
}

func (p *portalProxy) RefreshOidcToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error) {
	log.Debug("refreshToken")
	userToken, ok := p.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	// Parse out token metadata is there is some, and override some of theser parameters

	var scopes string

	log.Info(userToken.Metadata)
	if len(userToken.Metadata) > 0 {
		metadata := &interfaces.OAuth2Metadata{}
		if err := json.Unmarshal([]byte(userToken.Metadata), metadata); err == nil {
			log.Info(metadata)
			log.Info(metadata.ClientID)
			log.Info(metadata.ClientSecret)

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
		return t, fmt.Errorf("Token refresh request failed: %v", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.IDToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from id token")
	}

	u.UserGUID = userGUID

	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, userToken.Disconnected)
	tokenRecord.AuthType = interfaces.AuthTypeOIDC
	// Copy across the metadata from the original token
	tokenRecord.Metadata = userToken.Metadata

	err = p.setCNSITokenRecord(cnsiGUID, userGUID, tokenRecord)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new token: %v", err)
	}

	return tokenRecord, nil
}
