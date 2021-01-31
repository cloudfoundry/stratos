package main

import (
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	log "github.com/sirupsen/logrus"
)

func (p *portalProxy) doNoAuthFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doNoAuthFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {
		// No need to add any headers or do any authentication
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (p *portalProxy) getCNSIUserForNoAuth(cnsiGUID string, cfTokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	return &interfaces.ConnectedUser{
		GUID: "none",
		Name: "none",
	}, true
}
