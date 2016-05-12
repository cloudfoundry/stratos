package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/labstack/echo"
	"github.com/satori/go.uuid"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
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
	apiEndpointURL, err := url.Parse(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get API Endpoint",
			"Failed to get API Endpoint: %v", err)
	}
	guid := uuid.NewV4().String()
	newCNSI := cnsis.CNSIRecord{
		Name:                  cnsiName,
		CNSIType:              cnsis.CNSIHCF,
		APIEndpoint:           apiEndpointURL,
		TokenEndpoint:         v2InfoResponse.TokenEndpoint,
		AuthorizationEndpoint: v2InfoResponse.AuthorizationEndpoint,
	}

	p.setCNSIRecord(guid, newCNSI)

	c.String(http.StatusCreated, guid)

	return nil
}

func (p *portalProxy) listRegisteredCNSIs(c echo.Context) error {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConfig)
	if err != nil {
		return fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	var jsonString []byte

	var cnsiList []*cnsis.CNSIRecord
	cnsiList, err = cnsiRepo.List()
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}

	jsonString, err = json.Marshal(cnsiList)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
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

	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		defer res.Body.Close()

		return v2InfoReponse, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&v2InfoReponse); err != nil {
		return v2InfoReponse, err
	}

	return v2InfoReponse, nil
}

func (p *portalProxy) getCNSIRecord(guid string) (cnsis.CNSIRecord, bool) {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConfig)
	if err != nil {
		return cnsis.CNSIRecord{}, false
	}

	rec, err := cnsiRepo.Find(guid)
	if err != nil {
		return cnsis.CNSIRecord{}, false
	}

	return rec, true
}

func (p *portalProxy) setCNSIRecord(guid string, c cnsis.CNSIRecord) {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConfig)
	if err != nil {
		fmt.Printf("setCNSIRecord: %v", err)
	}

	err = cnsiRepo.Save(guid, c)
	if err != nil {
		fmt.Printf("setCNSIRecord: %v", err)
	}
}

func (p *portalProxy) getCNSITokenRecord(cnsiGUID string, userGUID string) (tokens.TokenRecord, bool) {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConfig)
	if err != nil {
		return tokens.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
	if err != nil {
		return tokens.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) setCNSITokenRecord(cnsiGUID string, userGUID string, t tokens.TokenRecord) {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConfig)
	if err != nil {
		fmt.Printf("setCNSITokenRecord: %v", err)
	}

	err = tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t)
	if err != nil {
		fmt.Printf("setCNSITokenRecord: %v", err)
	}
}
