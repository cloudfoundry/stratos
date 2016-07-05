package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
)

func (p *portalProxy) doOauthFlowRequest(cnsiRequest CNSIRequest, req *http.Request) (*http.Response, error) {

	// TODO (wchrisjohnson): Temporary measure until HCE has authentication; REMOVE befoe we ship
	shouldSkipTokenAuth := "true" == cnsiRequest.Header.Get("x-cnap-skip-token-auth")
	if shouldSkipTokenAuth {
		res, err := httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("Request failed: %v", err)
		}

		if res.StatusCode != 401 {
			return res, nil
		}

		return nil, fmt.Errorf("Request failed")
	}

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}

	got401 := false
	expTime := time.Unix(tokenRec.TokenExpiry, 0)
	for {
		if got401 || expTime.Before(time.Now()) {
			refreshedTokenRec, err := p.refreshToken(cnsiRequest.GUID, cnsiRequest.UserGUID, p.Config.HCFClient, p.Config.HCFClientSecret, cnsi.TokenEndpoint)
			if err != nil {
				return nil, fmt.Errorf("Couldn't refresh token for CNSI with GUID %s", cnsiRequest.GUID)
			}
			tokenRec = refreshedTokenRec
		}
		req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)
		res, err := httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("Request failed: %v", err)
		}

		if res.StatusCode != 401 {
			return res, nil
		}

		if got401 {
			return res, fmt.Errorf("Failed to authorize")
		}
		got401 = true
	}
}

func (p *portalProxy) getCNSIRequestRecords(r CNSIRequest) (t tokens.TokenRecord, c cnsis.CNSIRecord, err error) {
	// look up token

	t, ok := p.getCNSITokenRecord(r.GUID, r.UserGUID)
	if !ok {
		return t, c, fmt.Errorf("Could not find token for csni:user %s:%s", r.GUID, r.UserGUID)
	}

	c, ok = p.getCNSIRecord(r.GUID)
	if !ok {
		return t, c, fmt.Errorf("Info could not be found for CNSI with GUID %s", r.GUID)
	}

	return t, c, nil
}

func (p *portalProxy) refreshToken(cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t tokens.TokenRecord, err error) {

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	// TODO (wchrisjohnson): this call is unnecessary. The cnsi token record was retrieved
	// a few lines above where this method was called. We should remove this and pass the
	// token in.
	userToken, ok := p.getCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath)
	if err != nil {
		return t, fmt.Errorf("Token refresh request failed: %v", err)
	}

	u, err := getUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	u.UserGUID = userGUID

	t, err = p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new token: %v", err)
	}

	return t, nil
}
