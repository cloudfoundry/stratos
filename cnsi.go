package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"

	"github.com/labstack/echo"
)

type v2Info struct {
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
}

func (p *portalProxy) registerHCFCluster(c echo.Context) error {
	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")

	if len(cnsiName) == 0 || len(apiEndpoint) == 0 {
		return echo.NewHTTPError(400, `{"error": "Needs CNSI Name and API Endpoint"}`)
	}

	v2InfoResponse, err := getHCFv2Info(apiEndpoint)
	if err != nil {
		return err
	}

	// save data to temporary map
	var newCNSI cnsiRecord
	newCNSI.CNSIType = cnsiHCF
	newCNSI.APIEndpoint = apiEndpoint
	newCNSI.TokenEndpoint = v2InfoResponse.TokenEndpoint
	newCNSI.AuthorizationEndpoint = v2InfoResponse.AuthorizationEndpoint

	p.CNSIMut.Lock()
	p.CNSIs[cnsiName] = newCNSI
	p.CNSIMut.Unlock()

	return nil
}

func getHCFv2Info(apiEndpoint string) (v2Info, error) {
	var v2InfoReponse v2Info

	// make a call to apiEndpoint/v2/info to get the auth and token endpoints
	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		log.Printf("Invalid endpoint url %v", apiEndpoint)
		return v2InfoReponse, echo.NewHTTPError(http.StatusBadRequest, `{"error": "Invalid endpoint url"}`)
	}

	uri.Path = "v2/info"
	res, err := httpClient.Get(uri.String())
	if err != nil {
		log.Printf("Unable to reach %v", apiEndpoint)
		logHTTPError(res, err)
		return v2InfoReponse, echo.NewHTTPError(500, `{"error": "Unable to reach endpoint"}`)
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&v2InfoReponse); err != nil {
		log.Printf("Unable to decode response from v2/info")
		return v2InfoReponse, echo.NewHTTPError(http.StatusInternalServerError, `{"error": "Invalid response from endpoint"}`)
	}

	return v2InfoReponse, nil
}
