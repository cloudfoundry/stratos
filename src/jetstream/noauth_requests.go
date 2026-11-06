package main

import (
	"log/slog"
	"net/http"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func (p *portalProxy) doNoAuthFlowRequest(cnsiRequest *api.CNSIRequest, req *http.Request) (*http.Response, error) {
	slog.Debug("doNoAuthFlowRequest")

	authHandler := func(tokenRec api.TokenRecord, cnsi api.CNSIRecord) (*http.Response, error) {
		// No need to add any headers or do any authentication
		client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation, cnsi.CACert)
		return client.Do(req)
	}
	return p.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (p *portalProxy) getCNSIUserForNoAuth(cnsiGUID string, cfTokenRecord *api.TokenRecord) (*api.ConnectedUser, bool) {
	return &api.ConnectedUser{
		GUID: "none",
		Name: "none",
	}, true
}
