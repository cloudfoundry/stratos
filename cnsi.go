package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"

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
	logger.Debug("registerHCFCluster")
	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")
	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		logger.Errorf("Failed to parse skip_ssl_validation value: %s", err)
		// default to false
		skipSSLValidation = false
	}

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

	// check if we've already got this endpoint in the DB
	ok := p.cnsiRecordExists(apiEndpoint)
	if ok {
		// a record with the same api endpoint was found
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Can not register same endpoint multiple times",
			"Can not register same endpoint multiple times",
		)
	}

	v2InfoResponse, err := getHCFv2Info(apiEndpoint, skipSSLValidation)
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
		SkipSSLValidation:      skipSSLValidation,
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
	logger.Debug("registerHCECluster")
	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")
	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		logger.Errorf("Failed to parse skip_ssl_validation value: %s", err)
		// default to false
		skipSSLValidation = false
	}

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

	infoResponse, err := getHCEInfo(apiEndpoint, skipSSLValidation)
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
		SkipSSLValidation:     skipSSLValidation,
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
	cnsiGUID := c.FormValue("cnsi_guid")
	logger.WithField("cnsiGUID", cnsiGUID).Debug("unregisterCluster")

	if len(cnsiGUID) == 0 {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	p.unsetCNSIRecord(cnsiGUID)

	userID, err := p.getSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	p.unsetCNSITokenRecord(cnsiGUID, userID)

	return nil
}

func (p *portalProxy) buildCNSIList(c echo.Context) ([]*cnsis.CNSIRecord, error) {
	logger.Debug("buildCNSIList")
	var cnsiList []*cnsis.CNSIRecord

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return cnsiList, fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	cnsiList, err = cnsiRepo.List()
	if err != nil {
		return cnsiList, err
	}

	return cnsiList, nil
}

func (p *portalProxy) listCNSIs(c echo.Context) error {
	logger.Debug("listCNSIs")
	cnsiList, err := p.buildCNSIList(c)
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}

	jsonString, err := marshalCNSIlist(cnsiList)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) listRegisteredCNSIs(c echo.Context) error {
	logger.Debug("listRegisteredCNSIs")
	userGUIDIntf, err := p.getSessionValue(c, "user_id")
	if err != nil {
		return newHTTPShadowError(
			http.StatusBadRequest,
			"User session could not be found",
			"User session could not be found: %v", err,
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
	logger.Debug("marshalCNSIlist")
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
	logger.Debug("marshalClusterList")
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

func getHCFv2Info(apiEndpoint string, skipSSLValidation bool) (v2Info, error) {
	logger.Debug("getHCFv2Info")
	var v2InfoReponse v2Info

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return v2InfoReponse, err
	}

	uri.Path = "v2/info"
	h := httpClient
	if skipSSLValidation {
		h = httpClientSkipSSL
	}
	res, err := h.Get(uri.String())
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

func getHCEInfo(apiEndpoint string, skipSSLValidation bool) (hceInfo, error) {
	logger.Debug("getHCEInfo")
	var infoReponse hceInfo

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return infoReponse, err
	}

	uri.Path = "info"
	h := httpClient
	if skipSSLValidation {
		h = httpClientSkipSSL
	}
	res, err := h.Get(uri.String())
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

func (p *portalProxy) getCNSIRecord(guid string) (cnsis.CNSIRecord, error) {
	logger.Debug("getCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return cnsis.CNSIRecord{}, err
	}

	rec, err := cnsiRepo.Find(guid)
	if err != nil {
		return cnsis.CNSIRecord{}, err
	}

	return rec, nil
}

func (p *portalProxy) cnsiRecordExists(endpoint string) bool {
	logger.Debug("cnsiRecordExists")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return false
	}

	_, err = cnsiRepo.FindByAPIEndpoint(endpoint)
	if err != nil {
		return false
	}

	return true
}

func (p *portalProxy) setCNSIRecord(guid string, c cnsis.CNSIRecord) error {
	logger.Debug("setCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = cnsiRepo.Save(guid, c)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSIRecord(guid string) error {
	logger.Debug("unsetCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = cnsiRepo.Delete(guid)
	if err != nil {
		msg := "Unable to delete a CNSI record: %v"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) getCNSITokenRecord(cnsiGUID string, userGUID string) (tokens.TokenRecord, bool) {
	logger.Debug("getCNSITokenRecord")
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
	logger.Debug("listCNSITokenRecordsForUser")
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
	logger.Debug("setCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSITokenRecord(cnsiGUID string, userGUID string) error {
	logger.Debug("unsetCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to delete a CNSI Token: %v"
		logger.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}
