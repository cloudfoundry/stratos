package main

import (
	"encoding/json"
	"net/http"
	"net/url"

	"github.com/labstack/echo"
	"github.com/satori/go.uuid"
)

type v2Info struct {
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
}

func (p *portalProxy) registerHCFCluster(c echo.Context) error {
	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")

	if len(cnsiName) == 0 || len(apiEndpoint) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Needs CNSI Name and API Endpoint",
			"CNSI Name or Endpoint were not provided when trying to register an HCF Cluster")
	}

	v2InfoResponse, err := getHCFv2Info(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get endpoint v2/info",
			"Failed to get api endpoint v2/info: %v",
			err)
	}

	// save data to temporary map
	var newCNSI cnsiRecord
	guid := uuid.NewV4().String()
	newCNSI.Name = cnsiName
	newCNSI.CNSIType = cnsiHCF
	newCNSI.APIEndpoint = apiEndpoint
	newCNSI.TokenEndpoint = v2InfoResponse.TokenEndpoint
	newCNSI.AuthorizationEndpoint = v2InfoResponse.AuthorizationEndpoint

	p.CNSIMut.Lock()
	p.CNSIs[guid] = newCNSI
	p.CNSIMut.Unlock()

	return nil
}

func getHCFv2Info(apiEndpoint string) (v2Info, error) {
	var v2InfoReponse v2Info

	// make a call to apiEndpoint/v2/info to get the auth and token endpoints
	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return v2InfoReponse, err
	}

	uri.Path = "v2/info"
	res, err := httpClient.Get(uri.String())
	if err != nil {
		return v2InfoReponse, err
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&v2InfoReponse); err != nil {
		return v2InfoReponse, err
	}

	return v2InfoReponse, nil
}
