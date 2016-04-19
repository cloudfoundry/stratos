package main

import (
	"fmt"
	"net/http"
	"time"
)

type CNSIRequest struct {
	GUID     string
	UserGUID string
	Response []byte
	Error    error
}

func (p *portalProxy) getCNSIRequestRecords(r CNSIRequest) (t tokenRecord, c cnsiRecord, err error) {
	// look up token
	t, ok := p.getCNSITokenRecord(r.GUID, r.UserGUID)
	if !ok {
		return t, c, fmt.Errorf("Could not find token for user:cnsi %s:%s", r.GUID, r.UserGUID)
	}

	c, ok = p.getCNSIRecord(r.GUID)
	if !ok {
		return t, c, fmt.Errorf("Info could not be found for CNSI with GUID %s", r.GUID)
	}

	return t, c, nil
}

func (p *portalProxy) doOauthFlowRequest(cnsiRequest CNSIRequest, req *http.Request) (*http.Response, error) {
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}

	got401 := false
	expTime := time.Unix(tokenRec.TokenExpiry, 0)
	for {
		if got401 || expTime.Before(time.Now()) {
			refreshedTokenRec, err := p.refreshToken(cnsiRequest.GUID, cnsiRequest.UserGUID, cnsi.TokenEndpoint)
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

	panic("Authentication code hit impossible case")
}

func (p *portalProxy) refreshToken(cnsiGUID string, userGUID string, tokenEndpoint string) (t tokenRecord, err error) {

	userToken, ok := p.getCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := p.getUAATokenWithRefreshToken(userToken.RefreshToken, tokenEndpoint)
	if err != nil {
		return t, fmt.Errorf("Token refresh request failed: %v", err)
	}

	u, err := getUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	t, err = p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new token: %v", err)
	}

	return t, nil
}
