package main

import (
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"crypto/sha1"
	"encoding/base64"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites/userfavoritesendpoints"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
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

	ssoAllowed, err := strconv.ParseBool(c.FormValue("sso_allowed"))
	if err != nil {
		// default to false
		ssoAllowed = false
	}

	cnsiClientId := c.FormValue("cnsi_client_id")
	cnsiClientSecret := c.FormValue("cnsi_client_secret")
	subType := c.FormValue("sub_type")

	if cnsiClientId == "" {
		cnsiClientId = p.GetConfig().CFClient
		cnsiClientSecret = p.GetConfig().CFClientSecret
	}

	newCNSI, err := p.DoRegisterEndpoint(cnsiName, apiEndpoint, skipSSLValidation, cnsiClientId, cnsiClientSecret, ssoAllowed, subType, fetchInfo)
	if err != nil {
		return err
	}

	c.JSON(http.StatusCreated, newCNSI)
	return nil
}

func (p *portalProxy) DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, ssoAllowed bool, subType string, fetchInfo interfaces.InfoFunc) (interfaces.CNSIRecord, error) {

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
			"Failed to validate endpoint",
			"Failed to validate endpoint: %v",
			err)
	}

	h := sha1.New()
	h.Write([]byte(apiEndpointURL.String()))
	guid := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	newCNSI.Name = cnsiName
	newCNSI.APIEndpoint = apiEndpointURL
	newCNSI.SkipSSLValidation = skipSSLValidation
	newCNSI.ClientId = clientId
	newCNSI.ClientSecret = clientSecret
	newCNSI.SSOAllowed = ssoAllowed
	newCNSI.SubType = subType

	err = p.setCNSIRecord(guid, newCNSI)

	// set the guid on the object so it's returned in the response
	newCNSI.GUID = guid

	// Notify plugins if they support the notification interface
	for _, plugin := range p.Plugins {
		if notifier, ok := plugin.(interfaces.EndpointNotificationPlugin); ok {
			notifier.OnEndpointNotification(interfaces.EndpointRegisterAction, &newCNSI)
		}
	}

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
	// Should check for errors?
	p.unsetCNSIRecord(cnsiGUID)

	p.unsetCNSITokenRecords(cnsiGUID)

	ufe := userfavoritesendpoints.Constructor(p, cnsiGUID)
	ufe.RemoveFavorites()

	return nil
}

func (p *portalProxy) buildCNSIList(c echo.Context) ([]*interfaces.CNSIRecord, error) {
	log.Debug("buildCNSIList")
	return p.ListEndpoints()
}

func (p *portalProxy) ListEndpoints() ([]*interfaces.CNSIRecord, error) {
	log.Debug("ListEndpoints")
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

func (p *portalProxy) UpdateEndpointMetadata(guid string, metadata string) error {
	log.Debug("UpdateEndpointMetadata")

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = cnsiRepo.UpdateMetadata(guid, metadata)
	if err != nil {
		msg := "Unable to update endpoint metadata: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
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

	// Lookup the endpoint, so can pass the information to the plugins
	endpoint, lookupErr := cnsiRepo.Find(guid, p.Config.EncryptionKeyInBytes)

	// Delete the endpoint
	err = cnsiRepo.Delete(guid)
	if err != nil {
		msg := "Unable to delete a CNSI record: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	if lookupErr == nil {
		// Notify plugins if they support the notification interface
		for _, plugin := range p.Plugins {
			if notifier, ok := plugin.(interfaces.EndpointNotificationPlugin); ok {
				notifier.OnEndpointNotification(interfaces.EndpointUnregisterAction, &endpoint)
			}
		}
	}

	return nil
}

func (p *portalProxy) SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord) error {
	log.Debug("SaveEndpointToken")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return err
	}

	return tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, tokenRecord, p.Config.EncryptionKeyInBytes)
}

func (p *portalProxy) DeleteEndpointToken(cnsiGUID string, userGUID string) error {
	log.Debug("DeleteEndpointToken")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return err
	}

	return tokenRepo.DeleteCNSIToken(cnsiGUID, userGUID)
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
	log.Debug("GetCNSITokenRecordWithDisconnected")
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
		log.Debugf("Error was: %+v", err)
		return nil, err
	}

	return cnsiList, nil
}

// Uopdate the Access Token, Refresh Token and Token Expiry for a token
func (p *portalProxy) updateTokenAuth(userGUID string, t interfaces.TokenRecord) error {
	log.Debug("updateTokenAuth")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	err = tokenRepo.UpdateTokenAuth(userGUID, t, p.Config.EncryptionKeyInBytes)
	if err != nil {
		msg := "Unable to update Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
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

func (p *portalProxy) unsetCNSITokenRecords(cnsiGUID string) error {
	log.Debug("unsetCNSITokenRecord")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to establish a database reference: '%v'"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	err = tokenRepo.DeleteCNSITokens(cnsiGUID)
	if err != nil {
		msg := "Unable to delete a CNSI Token: %v"
		log.Errorf(msg, err)
		return fmt.Errorf(msg, err)
	}

	return nil
}

func (p *portalProxy) updateEndpoint(c echo.Context) error {
	log.Debug("updateEndpoint")

	endpointID := c.Param("id")

	// Check we have an ID
	if len(endpointID) == 0 {
		return interfaces.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint ID")
	}

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf(dbReferenceError, err)
		return fmt.Errorf(dbReferenceError, err)
	}

	endpoint, err := cnsiRepo.Find(endpointID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Could not find the endpoint %s: '%v'", endpointID, err)
	}

	updates := false

	// Update name
	name := c.FormValue("name")
	if len(name) > 0 {
		endpoint.Name = name
		updates = true
	}

	// Skip SSL validation
	skipSSL := c.FormValue("skipSSL")
	if len(skipSSL) > 0 {
		v, err := strconv.ParseBool(skipSSL)
		if err == nil {
			if v != endpoint.SkipSSLValidation {
				// SSL Validation value changed
				endpoint.SkipSSLValidation = v
				updates = true
				if !v {
					// Skip SSL validation is OFF - so check we can communicate with the endpoint
					plugin, err := p.GetEndpointTypeSpec(endpoint.CNSIType)
					if err != nil {
						return fmt.Errorf("Can not get endpoint type for %s: '%v'", endpoint.CNSIType, err)
					}
					_, _, err = plugin.Info(endpoint.APIEndpoint.String(), endpoint.SkipSSLValidation)
					if err != nil {
						if ok, detail := isSSLRelatedError(err); ok {
							return interfaces.NewHTTPShadowError(
								http.StatusForbidden,
								"SSL error - "+detail,
								"There is a problem with the server Certificate - %s",
								detail)
						}
						return interfaces.NewHTTPShadowError(
							http.StatusBadRequest,
							fmt.Sprintf("Could not validate endpoint: %v", err),
							"Could not validate endpoint: %v",
							err)
					}
				}
			}
		}
	}

	// Client ID and Client Secret
	setClientInfo := c.FormValue("setClientInfo")
	isSet, err := strconv.ParseBool(setClientInfo)
	if err == nil && isSet {
		clientID := c.FormValue("clientID")
		clientSecret := c.FormValue("clientSecret")
		endpoint.ClientId = clientID
		endpoint.ClientSecret = clientSecret
		updates = true
	}

	// Allow SSO
	allowSSO := c.FormValue("allowSSO")
	if len(allowSSO) > 0 {
		v, err := strconv.ParseBool(allowSSO)
		if err == nil {
			if v != endpoint.SSOAllowed {
				// Allow SSO value changed
				endpoint.SSOAllowed = v
				updates = true
			}
		}
	}

	// Apply updates
	if updates {
		err := cnsiRepo.Update(endpoint, p.Config.EncryptionKeyInBytes)
		if err != nil {
			return fmt.Errorf("Could not update the endpoint %s: '%v'", endpointID, err)
		}
	}

	return nil
}

type BackupConnectionType string

const (
	BACKUP_CONNECTION_NONE    BackupConnectionType = "NONE"
	BACKUP_CONNECTION_CURRENT                      = "CURRENT"
	BACKUP_CONNECTION_ALL                          = "ALL"
)

// TODO: RC position
type BackupEndpointsState struct {
	Endpoint bool                 `json:"endpoint"`
	Connect  BackupConnectionType `json:"connect"`
}

// Sent to backup
type BackupRequest struct {
	State     map[string]BackupEndpointsState `json:"state"`
	UserID    string                          `json:"userId"`
	DBVersion string                          `json:"dbVersion"`
	Password  string                          `json:"password"`
}

type BackupRequestEndpointsResponse struct {
	Endpoints []*interfaces.CNSIRecord
	Tokens    []interfaces.BackupTokenRecord
}

type BackupContent struct {
	payload   BackupRequestEndpointsResponse `json:"payload"`
	DBVersion int64                          `json:"dbVersion"`
}

type RestoreRequest struct {
	// Data - Encrypted version of BackupContent
	Data            string `json:"data"`
	Password        string `json:"password"`
	IgnoreDbVersion bool   `json:"ignoreDbVersion"`
}

// TODO: RC split out to new file?
func (p *portalProxy) backupEndpoints(c echo.Context) error {
	log.Debug("backupEndpoints")

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	data := &BackupRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}
	// log.Infof("BODY: %+v", data)

	if data.State == nil || len(data.State) == 0 {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - no endpoints to backup")
	}

	response, err := p.createBackup(data)
	if err != nil {
		return err
	}

	log.Infof("response: %+v", response)

	// Send back the response to the client
	// TODO: RC Missing client_secret when serialised, `-` in definition
	jsonString, err := json.Marshal(response)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusInternalServerError, "Failed to serialize response")
	}

	log.Infof("jsonString: %+v", jsonString)

	// Return data
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (p *portalProxy) createBackup(data *BackupRequest) (*BackupContent, error) {
	log.Debug("createBackup")
	allEndpoints, err := p.ListEndpoints()
	if err != nil {
		return nil, interfaces.NewHTTPError(http.StatusBadGateway, "Failed to fetch endpoints")
	}

	// Fetch/Format required data
	endpoints := make([]*interfaces.CNSIRecord, 0)
	// allTokensFrom := make([]string, 0)
	// userTokenFrom := make([]string, 0)
	tokens := make([]interfaces.BackupTokenRecord, 0)

	for endpointID, endpoint := range data.State {

		if !endpoint.Endpoint {
			continue
		}

		for _, e := range allEndpoints {
			if endpointID == e.GUID {
				endpoints = append(endpoints, e)
				break
			}
		}

		switch connectionType := endpoint.Connect; connectionType {
		case BACKUP_CONNECTION_ALL:
			// allTokensFrom = append(allTokensFrom, endpointID)
			if tokenRecords, ok := p.getCNSITokenRecordsBackup(endpointID); ok {
				log.Warn("tokens for AllConnect")
				tokens = append(tokens, tokenRecords...)
			} else {
				log.Warn("No tokens for AllConnect")
				// TODO: RC
			}
		case BACKUP_CONNECTION_CURRENT:
			// userTokenFrom = append(userTokenFrom, endpointID)
			if tokenRecord, ok := p.GetCNSITokenRecordWithDisconnected(endpointID, data.UserID); ok {
				log.Warn("tokens for Connect")
				// var btr BackupTokenRecord
				// TODO: RC Q This will be the linked token as if it were the users token
				var btr = interfaces.BackupTokenRecord{
					// tokenRecord: tokenRecord,
					TokenRecord:  tokenRecord,
					EndpointGUID: endpointID,
					TokenType:    "CNSI",
					UserGUID:     data.UserID,
				}

				tokens = append(tokens, btr)
			} else {
				log.Warnf("No tokens for Connect: %+v,%+v", endpointID, data.UserID)
				// TODO: RC
				// msg := "Unable to retrieve CNSI token record."
				// log.Debug(msg)
				// return nil, nil, false
			}
		}

		// if endpoint.Connect == BACKUP_CONNECTION_ALL {
		// 	// allTokensFrom = append(allTokensFrom, endpointID)
		// 	if tokenRecords, ok := p.getCNSITokenRecordsBackup(endpointID); ok {
		// 		log.Warn("tokens for AllConnect")
		// 		tokens = append(tokens, tokenRecords...)
		// 	} else {
		// 		log.Warn("No tokens for AllConnect")
		// 		// TODO: RC
		// 	}
		// } else if endpoint.Connect {
		// 	// userTokenFrom = append(userTokenFrom, endpointID)
		// 	if tokenRecord, ok := p.GetCNSITokenRecordWithDisconnected(endpointID, data.UserID); ok {
		// 		log.Warn("tokens for Connect")
		// 		// var btr BackupTokenRecord
		// 		// TODO: RC Q This will be the linked token as if it were the users token
		// 		var btr = interfaces.BackupTokenRecord{
		// 			// tokenRecord: tokenRecord,
		// 			TokenRecord:  tokenRecord,
		// 			EndpointGUID: endpointID,
		// 			TokenType:    "CNSI",
		// 			UserGUID:     data.UserID,
		// 		}

		// 		tokens = append(tokens, btr)
		// 	} else {
		// 		log.Warnf("No tokens for Connect: %+v,%+v", endpointID, data.UserID)
		// 		// TODO: RC
		// 		// msg := "Unable to retrieve CNSI token record."
		// 		// log.Debug(msg)
		// 		// return nil, nil, false
		// 	}
		// }
	}

	log.Infof("endpoints: %+v", endpoints)
	// log.Infof("allTokensFrom: %+v", allTokensFrom)
	// log.Infof("userTokenFrom: %+v", userTokenFrom)
	log.Infof("tokens: %+v", tokens)

	payload := &BackupRequestEndpointsResponse{
		Endpoints: endpoints,
		Tokens:    tokens,
	}

	// Encrypt data (see above) // TODO: RC leave until last
	// encryptedPayload := payload

	versions, err := p.getVersionsData()
	if err != nil {
		return nil, errors.New("Could not find database version")
	}

	// log.Infof("payload: %+v", payload)

	response := &BackupContent{
		payload:   *payload,
		DBVersion: versions.DatabaseVersion,
	}

	// log.Infof("response: %+v", response)

	return response, nil
}

// func (p *portalProxy) GetCNSITokens(cnsiGUID string) ([]interfaces.TokenRecord, bool) {
// 	log.Debug("GetCNSITokens")
// 	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
// 	if err != nil {
// 		return make([]interfaces.TokenRecord, 0), false
// 	}

// 	trs, err := tokenRepo.FindAllCNSITokenIncludeDisconnected(cnsiGUID, p.Config.EncryptionKeyInBytes)
// 	if err != nil {
// 		return make([]interfaces.TokenRecord, 0), false
// 	}

// 	return trs, true
// }

func (p *portalProxy) getCNSITokenRecordsBackup(endpointID string) ([]interfaces.BackupTokenRecord, bool) {
	log.Debug("getCNSITokenRecordsBackup")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	trs, err := tokenRepo.FindAllCNSITokenBackup(endpointID, p.Config.EncryptionKeyInBytes)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	return trs, true
}

func (p *portalProxy) restoreEndpoints(c echo.Context) error {
	log.Debug("restoreEndpoints")

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	data := &RestoreRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}

	err = p.restoreBackup(data)
	if err != nil {
		// TODO: RC write error?
		return err
	}

	// log.Warnf("BACKUP DATA: %+v", backup)
	c.Response().WriteHeader(http.StatusOK)
	return nil

}

func (p *portalProxy) restoreBackup(backup *RestoreRequest) error {
	log.Debug("restoreBackup")

	// TODO: RC check return types of these functions... if we return shadow error

	data := &BackupContent{}
	if err := json.Unmarshal([]byte(backup.Data), backup); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid backup - could not parse JSON")
	}

	if backup.IgnoreDbVersion == false {
		versions, err := p.getVersionsData()
		if err != nil {
			return errors.New("Could not find database version")
		}

		if versions.DatabaseVersion != data.DBVersion {
			errorStr := fmt.Sprintf("Incompatible database versions. Expected %+v but got %+v", versions.DatabaseVersion, data.DBVersion)
			return interfaces.NewHTTPShadowError(http.StatusBadRequest, errorStr, errorStr)
		}
	}

	unencryptedBackup := data.payload

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, endpoint := range unencryptedBackup.Endpoints {
		if err := cnsiRepo.Overwrite(*endpoint, p.Config.EncryptionKeyInBytes); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite endpoints", "Failed to overwrite endpoint: %+v", endpoint.Name)
		}
	}

	tokenRepo, err := tokens.NewPgsqlTokenRepository(p.DatabaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, tr := range unencryptedBackup.Tokens {
		if err := tokenRepo.SaveCNSIToken(tr.EndpointGUID, tr.UserGUID, tr.TokenRecord, p.Config.EncryptionKeyInBytes); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite token", "Failed to overwrite token: %+v", tr.TokenRecord.TokenGUID)
		}
	}

	return nil
}

// find := func(a interfaces.CNSIRecord) bool {
// 	return endpointID == a.GUID
// }

// endpointPos := sliceContainsFn(find, allEndpoints)
// if endpointPos >= 0 {
// 	endpoints = append(endpoints, endpoints[endpointPos])
// }

// // TODO:RC pos
// func sliceContains(what interface{}, where []interface{}) (idx int) {
// 	for i, v := range where {
// 		if v == what {
// 			return i
// 		}
// 	}
// 	return -1
// }

// func sliceContainsFn(is func(a interface{}) bool, where []interface{}) (idx int) {
// 	for i, v := range where {
// 		if is(v) {
// 			return i
// 		}
// 	}
// 	return -1
// }
