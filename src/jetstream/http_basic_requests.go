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

func (p *portalProxy) doBearerFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doBearerFlowRequest")
	return p.doAuthHeaderFlowRequest("bearer", cnsiRequest, req)
}

func (p *portalProxy) doTokenFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doTokenFlowRequest")
	return p.doAuthHeaderFlowRequest("token", cnsiRequest, req)
}

// Auth where a toekn is passed in the HTTP Authorization
func (p *portalProxy) doAuthHeaderFlowRequest(headerPrefix string, cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doAuthHeaderFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {
		authTokenDecodedBytes, err := base64.StdEncoding.DecodeString(tokenRec.AuthToken)
		if err != nil {
			return nil, errors.New("Failed to decode auth token")
		}

		// Token auth has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", headerPrefix+" "+string(authTokenDecodedBytes))
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}
