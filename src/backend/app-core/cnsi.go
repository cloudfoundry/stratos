package main

import (
	"crypto/x509"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"

	"github.com/SUSE/stratos-ui/repository/cnsis"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	"github.com/SUSE/stratos-ui/repository/tokens"
)

const dbReferenceError = "Unable to establish a database reference: '%v'"

func isSSLRelatedError(err error) (bool, string) {
	if urlErr, ok := err.(*url.Error); ok {
		if x509Err, ok := urlErr.Err.(x509.UnknownAuthorityError); ok {
			return true, x509Err.Error()
		}
		if x509Err, ok := urlErr.Err.(x509.HostnameError); ok {
			return true, x509Err.Error()
		}
		if x509Err, ok := urlErr.Err.(x509.CertificateInvalidError); ok {
			return true, x509Err.Error()
		}
	}
	return false, ""
}

func (p *portalProxy) RegisterEndpoint(c echo.Context, fetchInfo interfaces.InfoFunc) error {
	log.Debug("registerEndpoint")
	cnsiName := c.FormValue("cnsi_name")
	apiEndpoint := c.FormValue("api_endpoint")
	skipSSLValidation, err := strconv.ParseBool(c.FormValue("skip_ssl_validation"))
	if err != nil {
		log.Errorf("Failed to parse skip_ssl_validation value: %s", err)
		// default to false
		skipSSLValidation = false
	}

	cnsiClientId := c.FormValue("cnsi_client_id")
	cnsiClientSecret := c.FormValue("cnsi_client_secret")

	if cnsiClientId == "" {
		cnsiClientId = p.GetConfig().CFClient
		cnsiClientSecret = p.GetConfig().CFClientSecret
	}

	newCNSI, err := p.DoRegisterEndpoint(cnsiName, apiEndpoint, skipSSLValidation, cnsiClientId, cnsiClientSecret, fetchInfo)
	if err != nil {
		return err
	}

	c.JSON(http.StatusCreated, newCNSI)
	return nil
}

func (p *portalProxy) DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, fetchInfo interfaces.InfoFunc) (interfaces.CNSIRecord, error) {

	if len(cnsiName) == 0 || len(apiEndpoint) == 0 {
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Needs CNSI Name and API Endpoint",
			"CNSI Name or Endpoint were not provided when trying to register an CF Cluster")
	}

	apiEndpoint = strings.TrimRight(apiEndpoint, "/")

	// Remove trailing slash, if there is one
	apiEndpointURL, err := url.Parse(apiEndpoint)
	if err != nil {
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get API Endpoint",
			"Failed to get API Endpoint: %v", err)
	}

	// check if we've already got this endpoint in the DB
	ok := p.cnsiRecordExists(apiEndpoint)
	if ok {
		// a record with the same api endpoint was found
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Can not register same endpoint multiple times",
			"Can not register same endpoint multiple times",
		)
	}

	newCNSI, _, err := fetchInfo(apiEndpoint, skipSSLValidation)
	if err != nil {
		if ok, detail := isSSLRelatedError(err); ok {
			return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
				http.StatusForbidden,
				"SSL error - "+detail,
				"There is a problem with the server Certificate - %s",
				detail)
		}
		return interfaces.CNSIRecord{}, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to get endpoint v2/info",
			"Failed to get api endpoint v2/info: %v",
			err)
	}

	guid := uuid.NewV4().String()

	newCNSI.Name = cnsiName
	newCNSI.APIEndpoint = apiEndpointURL
	newCNSI.SkipSSLValidation = skipSSLValidation
	newCNSI.ClientId = clientId
	newCNSI.ClientSecret = clientSecret

	err = p.setCNSIRecord(guid, newCNSI)

	// set the guid on the object so it's returned in the response
	newCNSI.GUID = guid

	return newCNSI, err
}

// TODO (wchrisjohnson) We need do this as a TRANSACTION, vs a set of single calls
func (p *portalProxy) unregisterCluster(c echo.Context) error {
	cnsiGUID := c.FormValue("cnsi_guid")
	log.WithField("cnsiGUID", cnsiGUID).Debug("unregisterCluster")

	if len(cnsiGUID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	p.unsetCNSIRecord(cnsiGUID)

	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	p.unsetCNSITokenRecord(cnsiGUID, userID)

	return nil
}

func (p *portalProxy) buildCNSIList(c echo.Context) ([]*interfaces.CNSIRecord, error) {
	log.Debug("buildCNSIList")
	var cnsiList []*interfaces.CNSIRecord
	var err error

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return cnsiList, fmt.Errorf("listRegisteredCNSIs: %s", err)
	}

	cnsiList, err = cnsiRepo.List(p.Config.EncryptionKeyInBytes)
	if err != nil {
		return cnsiList, err
	}

	return cnsiList, nil
}

func (p *portalProxy) listCNSIs(c echo.Context) error {
	log.Debug("listCNSIs")
	cnsiList, err := p.buildCNSIList(c)
	if err != nil {
		return interfaces.NewHTTPShadowError(
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
	log.Debug("listRegisteredCNSIs")
	userGUIDIntf, err := p.GetSessionValue(c, "user_id")
	if err != nil {
		return interfaces.NewHTTPShadowError(
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
	var clusterList []*interfaces.ConnectedEndpoint

	clusterList, err = cnsiRepo.ListByUser(userGUID)
	if err != nil {
		return interfaces.NewHTTPShadowError(
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

func marshalCNSIlist(cnsiList []*interfaces.CNSIRecord) ([]byte, error) {
	log.Debug("marshalCNSIlist")
	jsonString, err := json.Marshal(cnsiList)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of CNSIs",
			"Failed to retrieve list of CNSIs: %v", err,
		)
	}
	return jsonString, nil
}

func marshalClusterList(clusterList []*interfaces.ConnectedEndpoint) ([]byte, error) {
	log.Debug("marshalClusterList")
	jsonString, err := json.Marshal(clusterList)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Failed to retrieve list of clusters",
			"Failed to retrieve list of clusters: %v", err,
		)
	}
	return jsonString, nil
}

func (p *portalProxy) GetCNSIRecord(guid string) (interfaces.CNSIRecord, error) {
	log.Debug("GetCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return interfaces.CNSIRecord{}, err
	}

	rec, err := cnsiRepo.Find(guid, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.CNSIRecord{}, err
	}

	// Ensure that trailing slash is removed from the API Endpoint
	rec.APIEndpoint.Path = strings.TrimRight(rec.APIEndpoint.Path, "/")

	return rec, nil
}

func (p *portalProxy) GetCNSIRecordByEndpoint(endpoint string) (interfaces.CNSIRecord, error) {
	log.Debug("GetCNSIRecordByEndpoint")
	var rec interfaces.CNSIRecord

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return rec, err
	}

	rec, err = cnsiRepo.FindByAPIEndpoint(endpoint, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return rec, err
	}

	// Ensure that trailing slash is removed from the API Endpoint
	rec.APIEndpoint.Path = strings.TrimRight(rec.APIEndpoint.Path, "/")

	return rec, nil
}

func (p *portalProxy) cnsiRecordExists(endpoint string) bool {
	log.Debug("cnsiRecordExists")

	_, err := p.GetCNSIRecordByEndpoint(endpoint)
	return err == nil
}

func (p *portalProxy) setCNSIRecord(guid string, c interfaces.CNSIRecord) error {
	log.Debug("setCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = cnsiRepo.Save(guid, c, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSIRecord(guid string) error {
	log.Debug("unsetCNSIRecord")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = cnsiRepo.Delete(guid)
	if err != nil {
		msg := "Unable to delete a CNSI record: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) GetCNSITokenRecord(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool) {
	log.Debug("GetCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSIToken(cnsiGUID, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) GetCNSITokenRecordWithDisconnected(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool) {
	log.Debug("GetCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	tr, err := tokenRepo.FindCNSITokenIncludeDisconnected(cnsiGUID, userGUID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return interfaces.TokenRecord{}, false
	}

	return tr, true
}

func (p *portalProxy) ListEndpointsByUser(userGUID string) ([]*interfaces.ConnectedEndpoint, error) {
	log.Debug("ListCEndpointsByUser")
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return nil, fmt.Errorf(dbReferenceError, err)
	}

	cnsiList, err := cnsiRepo.ListByUser(userGUID)
	if err != nil {
		return nil, err
	}

	return cnsiList, nil
}

func (p *portalProxy) setCNSITokenRecord(cnsiGUID string, userGUID string, t interfaces.TokenRecord) error {
	log.Debug("setCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to save a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) unsetCNSITokenRecord(cnsiGUID string, userGUID string) error {
	log.Debug("unsetCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
	if err != nil {
		msg := "Unable to delete a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}
