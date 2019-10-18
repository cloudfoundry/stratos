package main

import (
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

func (p *portalProxy) doHttpBasicFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doHttpBasicFlowRequest")

	authHandler := func(tokenRec api.TokenRecord, cnsi api.CNSIRecord) (*http.Response, error) {
		// Http Basic has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", "basic "+tokenRec.AuthToken)
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)

}
