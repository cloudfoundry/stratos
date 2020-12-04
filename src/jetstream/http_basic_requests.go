package main

import (
	"encoding/base64"
	"errors"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (p *portalProxy) doHttpBasicFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doHttpBasicFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {
		// Http Basic has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", "basic "+tokenRec.AuthToken)
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)

}

func (p *portalProxy) doTokenBearerFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doTokenBearerFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {
		authTokenDecodedBytes, err := base64.StdEncoding.DecodeString(tokenRec.AuthToken)
		if err != nil {
			return nil, errors.New("Failed to decode auth token")
		}

		// Token auth has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", "bearer "+string(authTokenDecodedBytes))
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}
