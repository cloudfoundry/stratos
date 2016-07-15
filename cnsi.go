package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"

	"github.com/labstack/echo"
	"github.com/satori/go.uuid"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
)

type v2Info struct {
	AuthorizationEndpoint  string `json:"authorization_endpoint"`
	TokenEndpoint          string `json:"token_endpoint"`
	DopplerLoggingEndpoint string `json:"doppler_logging_endpoint"`
}

type hceInfo struct {
	AuthorizationEndpoint string `json:"auth_endpoint"`
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

	apiEndpointURL, err := url.Parse(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get API Endpoint",
			"Failed to get API Endpoint: %v", err)
	}

	v2InfoResponse, err := getHCFv2Info(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get endpoint v2/info",
			"Failed to get api endpoint v2/info: %v",
			err)
	}

	guid := uuid.NewV4().String()

	// save data to temporary map
	newCNSI := cnsis.CNSIRecord{
		Name:                   cnsiName,
		CNSIType:               cnsis.CNSIHCF,
		APIEndpoint:            apiEndpointURL,
		TokenEndpoint:          v2InfoResponse.TokenEndpoint,
		AuthorizationEndpoint:  v2InfoResponse.AuthorizationEndpoint,
		DopplerLoggingEndpoint: v2InfoResponse.DopplerLoggingEndpoint,
	}

	err = p.setCNSIRecord(guid, newCNSI)
	if err != nil {
		return err
	}

	// set the guid on the object so it's returned in the response
	newCNSI.GUID = guid
	jsonString, err := json.Marshal(newCNSI)
	if err != nil {
		return err
	}

	//c.String(http.StatusCreated, guid)
	c.Response().WriteHeader(http.StatusCreated)
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

func (p *portalProxy) registerHCECluster(c echo.Context) error {

	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")

	if len(cnsiName) == 0 || len(apiEndpoint) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Needs CNSI Name and API Endpoint",
			"CNSI Name or Endpoint were not provided when trying to register an HCE Cluster")
	}

	apiEndpointURL, err := url.Parse(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get API Endpoint",
			"Failed to get API Endpoint: %v", err)
	}

	infoResponse, err := getHCEInfo(apiEndpoint)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get endpoint 'info'",
			"Failed to get api endpoint 'info': %v",
			err)
	}

	guid := uuid.NewV4().String()

	// save data to temporary map
	newCNSI := cnsis.CNSIRecord{
		Name:                  cnsiName,
		CNSIType:              cnsis.CNSIHCE,
		APIEndpoint:           apiEndpointURL,
		TokenEndpoint:         infoResponse.AuthorizationEndpoint,
		AuthorizationEndpoint: infoResponse.AuthorizationEndpoint,
	}

	err = p.setCNSIRecord(guid, newCNSI)
	if err != nil {
		return err
	}

	// set the guid on the object so it's returned in the response
	newCNSI.GUID = guid

	c.JSON(http.StatusCreated, newCNSI)

	return nil
}

// TODO (wchrisjohnson) We need do this as a TRANSACTION, vs a set of single calls.  https://jira.hpcloud.net/browse/TEAMFOUR-631
func (p *portalProxy) unregisterCluster(c echo.Context) error {

	log.Println("unregisterCluster start")

	cnsiGUID := c.FormValue("cnsi_guid")

	log.Printf("CNSI: %s", cnsiGUID)

	if len(cnsiGUID) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	p.unsetCNSIRecord(cnsiGUID)

	log.Println("After DELETE of CNSI record")

	userID, ok := p.getSessionStringValue(c, "user_id")
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	log.Printf("User ID: %s", userID)

	p.unsetCNSITokenRecord(cnsiGUID, userID)

	log.Println("After DELETE of CNSI token")

	log.Println("unregisterCluster complete")
	return nil
}

func (p *portalProxy) listCNSIs(c echo.Context) error {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
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

	jsonString, err = marshalCNSIlist(cnsiList)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) listRegisteredCNSIs(c echo.Context) error {

	userGUIDIntf, ok := p.getSessionValue(c, "user_id")
	if !ok {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"User session could not be found",
			"User session could not be found",
		)
	}
	userGUID := userGUIDIntf.(string)

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	var jsonString []byte
	var clusterList []*cnsis.RegisteredCluster

	clusterList, err = cnsiRepo.ListByUser(userGUID)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of clusters",
			"Failed to retrieve list of clusters: %v", err,
		)
	}

	jsonString, err = marshalClusterList(clusterList)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func marshalCNSIlist(cnsiList []*cnsis.CNSIRecord) ([]byte, error) {
	jsonString, err := json.Marshal(cnsiList)
	if err != nil {
		return nil, newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}
	return jsonString, nil
}

func marshalClusterList(clusterList []*cnsis.RegisteredCluster) ([]byte, error) {
	jsonString, err := json.Marshal(clusterList)
	if err != nil {
		return nil, newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of clusters",
			"Failed to retrieve list of clusters: %v", err,
		)
	}
	return jsonString, nil
}

func getHCFv2Info(apiEndpoint string) (v2Info, error) {
	var v2InfoReponse v2Info

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

func getHCEInfo(apiEndpoint string) (hceInfo, error) {
	var infoReponse hceInfo

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return infoReponse, err
	}

	uri.Path = "info"
	res, err := httpClient.Get(uri.String())
	if err != nil {
		return infoReponse, err
	}

	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		defer res.Body.Close()

		return infoReponse, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&infoReponse); err != nil {
		return infoReponse, err
	}

	return infoReponse, nil
}

func (p *portalProxy) getCNSIRecord(guid string) (cnsis.CNSIRecord, bool) {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return cnsis.CNSIRecord{}, false
	}

	rec, err := cnsiRepo.Find(guid)
	if err != nil {
		return cnsis.CNSIRecord{}, false
	}

	return rec, true
}

func (p *portalProxy) setCNSIRecord(guid string, c cnsis.CNSIRecord) error {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Unable to establish a database reference: '%v'", err)
	}

	err = cnsiRepo.Save(guid, c)
	if err != nil {
		return fmt.Errorf("Unable to save a CNSI record: '%v'", err)
	}

	return nil
}

func (p *portalProxy) unsetCNSIRecord(guid string) error {

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Unable to establish a database reference: '%v'", err)
	}

	err = cnsiRepo.Delete(guid)
	if err != nil {
		return fmt.Errorf("Unable to delete a CNSI record: '%v'", err)
	}

	return nil
}

func (p *portalProxy) getCNSITokenRecord(cnsiGUID string, userGUID string) (tokens.TokenRecord, bool) {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return tokens.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSIToken(cnsiGUID, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return tokens.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) listCNSITokenRecordsForUser(userGUID string) ([]*tokens.TokenRecord, error) {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return nil, err
	}

	tokensList, err := tokenRepo.ListCNSITokensForUser(userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return nil, err
	}

	return tokensList, nil
}

func (p *portalProxy) setCNSITokenRecord(cnsiGUID string, userGUID string, t tokens.TokenRecord) error {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Unable to establish a database reference: '%v'", err)
	}

	err = tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Unable to save a CNSI Token: %v", err)
	}

	return nil
}

func (p *portalProxy) unsetCNSITokenRecord(cnsiGUID string, userGUID string) error {

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Printf("Unable to establish a database reference: '%v'", err)
		return fmt.Errorf("Unable to establish a database reference: '%v'", err)
	}

	err = tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
	if err != nil {
		log.Printf("Unable to delete a CNSI Token: %v", err)
		return fmt.Errorf("Unable to delete a CNSI Token: %v", err)
	}

	return nil
}
