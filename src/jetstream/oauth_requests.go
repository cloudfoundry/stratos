package main

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	log "github.com/sirupsen/logrus"
)

func (p *portalProxy) OAuthHandlerFunc(cnsiRequest *api.CNSIRequest, req *http.Request, refreshOAuthTokenFunc api.RefreshOAuthTokenFunc) api.AuthHandlerFunc {

	return func(tokenRec api.TokenRecord, cnsi api.CNSIRecord) (*http.Response, error) {

		got401 := false

		for {
			expTime := time.Unix(tokenRec.TokenExpiry, 0)
			if got401 || expTime.Before(time.Now()) {
				refreshedTokenRec, err := refreshOAuthTokenFunc(cnsi.SkipSSLValidation, cnsiRequest.GUID, cnsiRequest.UserGUID, cnsi.ClientId, cnsi.ClientSecret, cnsi.TokenEndpoint)
				if err != nil {
					log.Info(err)
					return nil, fmt.Errorf("couldn't refresh token for CNSI with GUID %s", cnsiRequest.GUID)
				}
				tokenRec = refreshedTokenRec
			}
			req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

			var client http.Client
			client = p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
			res, err := client.Do(req)
			if err != nil {
				return nil, fmt.Errorf("request failed: %v", err)
			}

			if res.StatusCode != 401 {
				return res, nil
			}

			if got401 {
				return res, errors.New("failed to authorize")
			}
			got401 = true
		}
	}
}

func (p *portalProxy) DoOAuthFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("DoOAuthFlowRequest")
	authHandler := p.OAuthHandlerFunc(cnsiRequest, req, p.RefreshOAuthToken)
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)

}

func (p *portalProxy) getCNSIRequestRecords(r *api.CNSIRequest) (t api.TokenRecord, c api.CNSIRecord, err error) {
	log.Debug("getCNSIRequestRecords")

	var ok bool

	if r.Token != nil {
		t = *r.Token
	} else {
		// look up token
		t, ok = p.GetCNSITokenRecord(r.GUID, r.UserGUID)
		if !ok {
			return t, c, fmt.Errorf("could not find token for csni:user %s:%s", r.GUID, r.UserGUID)
		}
	}

	c, err = p.GetCNSIRecord(r.GUID)
	if err != nil {
		return t, c, fmt.Errorf("info could not be found for CNSI with GUID %s: %s", r.GUID, err)
	}

	return t, c, nil
}

func (p *portalProxy) RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t api.TokenRecord, err error) {
	log.Debug("refreshToken")
	userToken, ok := p.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("info could not be found for user with GUID %s", userGUID)
	}

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	uaaRes, err := p.getUAATokenWithRefreshToken(skipSSLValidation, userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath, "")
	if err != nil {
		return t, fmt.Errorf("token refresh request failed: %v", err)
	}

	u, err := p.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("could not get user token info from access token")
	}

	u.UserGUID = userGUID

	tokenRecord := p.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, userToken.Disconnected)
	tokenRecord.TokenGUID = userToken.TokenGUID
	err = p.updateTokenAuth(userGUID, tokenRecord)
	if err != nil {
		return t, fmt.Errorf("couldn't update token: %v", err)
	}

	return tokenRecord, nil
}
