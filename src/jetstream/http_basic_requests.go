package main

import (
	"fmt"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (p *portalProxy) doHttpBasicFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doHttpBasicFlowRequest")

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := p.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint records: %v", err)
	}

	// Http Basic has no token refresh or expiry - so much simpler than the OAuth flow
	req.Header.Set("Authorization", "basic "+tokenRec.AuthToken)
	client := p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
	return client.Do(req)
}
