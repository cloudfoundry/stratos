package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

type cnsiTokenBackup struct {
	databaseConnectionPool *sql.DB
	p                      *portalProxy
}

// BackupConnectionType - Determine what kind of connection details are stored for an endpoint
type BackupConnectionType string

const (
	BACKUP_CONNECTION_NONE    BackupConnectionType = "NONE"
	BACKUP_CONNECTION_CURRENT                      = "CURRENT"
	BACKUP_CONNECTION_ALL                          = "ALL"
)

// BackupEndpointsState - For a given endpoint define what's backed up
type BackupEndpointsState struct {
	Endpoint bool                 `json:"endpoint"`
	Connect  BackupConnectionType `json:"connect"`
}

// BackupRequest - Request from client to create a back up file
type BackupRequest struct {
	State     map[string]BackupEndpointsState `json:"state"`
	UserID    string                          `json:"userId"`
	DBVersion string                          `json:"dbVersion"`
	Password  string                          `json:"password"`
}

// BackupContentPayload - Encrypted part of the backup
type BackupContentPayload struct {
	Endpoints []map[string]interface{}
	Tokens    []interfaces.BackupTokenRecord
}

// BackupContent - Everything that's backed up and stored in a file client side
type BackupContent struct {
	Payload   []byte `json:"payload"`
	DBVersion int64  `json:"dbVersion"`
}

// RestoreRequest - Request from client to restore content from payload
type RestoreRequest struct {
	// Data - Content of backup file. This should be of type BackupContent (//TODO: RC test as BackupContent)
	Data            string `json:"data"`
	Password        string `json:"password"`
	IgnoreDbVersion bool   `json:"ignoreDbVersion"`
}

func (ctb *cnsiTokenBackup) BackupEndpoints(c echo.Context) error {
	log.Debug("BackupEndpoints")

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	data := &BackupRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}

	if data.State == nil || len(data.State) == 0 {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - no endpoints to backup")
	}

	response, err := ctb.createBackup(data)
	if err != nil {
		return err
	}

	log.Infof("response: %+v", response) // TODO: RC REMOVE

	// Send back the response to the client
	jsonString, err := json.Marshal(response)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusInternalServerError, "Failed to serialize response")
	}

	log.Infof("jsonString: %+v", jsonString) // TODO: RC REMOVE

	// Return data
	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (ctb *cnsiTokenBackup) createBackup(data *BackupRequest) (*BackupContent, error) {
	log.Debug("createBackup")
	allEndpoints, err := ctb.p.ListEndpoints()
	if err != nil {
		return nil, interfaces.NewHTTPError(http.StatusBadGateway, "Failed to fetch endpoints")
	}

	// Fetch/Format required data
	endpoints := make([]map[string]interface{}, 0)
	tokens := make([]interfaces.BackupTokenRecord, 0)

	for endpointID, endpoint := range data.State {

		if !endpoint.Endpoint {
			continue
		}

		for _, e := range allEndpoints {
			if endpointID == e.GUID {
				endpoints = append(endpoints, serializeEndpoint(e))
				break
			}
		}

		switch connectionType := endpoint.Connect; connectionType {
		case BACKUP_CONNECTION_ALL:
			if tokenRecords, ok := ctb.getCNSITokenRecordsBackup(endpointID); ok {
				log.Warn("tokens for AllConnect") // TODO: RC REMOVE
				tokens = append(tokens, tokenRecords...)
			} else {
				text := fmt.Sprintf("Failed to fetch tokens for endpoint %+v", endpointID)
				return nil, interfaces.NewHTTPError(http.StatusBadGateway, text)
			}
		case BACKUP_CONNECTION_CURRENT:
			// userTokenFrom = append(userTokenFrom, endpointID)
			if tokenRecord, ok := ctb.p.GetCNSITokenRecordWithDisconnected(endpointID, data.UserID); ok {
				log.Warn("tokens for Connect")
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
				text := fmt.Sprintf("Request to back up connected user's (%+v) token for endpoint (%+v) failed.", endpointID, data.UserID)
				return nil, interfaces.NewHTTPError(http.StatusBadGateway, text)
			}
		}
	}

	log.Infof("endpoints: %+v", endpoints) // TODO: RC REMOVE
	log.Infof("tokens: %+v", tokens)       // TODO: RC REMOVE

	payload := &BackupContentPayload{
		Endpoints: endpoints,
		Tokens:    tokens,
	}

	// Encrypt data (see above) // TODO: RC leave until last

	bPayload, _ := json.Marshal(payload)
	encryptedPayload, err := crypto.EncryptToken(encryptionKey, fmt.Sprintf("%+v", bPayload)) //TODO: RC error handling

	versions, err := ctb.p.getVersionsData()
	if err != nil {
		return nil, errors.New("Could not find database version")
	}

	// log.Infof("payload: %+v", payload)

	response := &BackupContent{
		Payload:   encryptedPayload,
		DBVersion: versions.DatabaseVersion,
	}

	// log.Infof("response: %+v", response)

	return response, nil
}

func (ctb *cnsiTokenBackup) getCNSITokenRecordsBackup(endpointID string) ([]interfaces.BackupTokenRecord, bool) {
	log.Debug("getCNSITokenRecordsBackup")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(ctb.databaseConnectionPool)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	trs, err := tokenRepo.FindAllCNSITokenBackup(endpointID, ctb.p.Config.EncryptionKeyInBytes)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	return trs, true
}

func (ctb *cnsiTokenBackup) RestoreEndpoints(c echo.Context) error {
	log.Debug("RestoreEndpoints")

	// Check we can unmarshall the request
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	data := &RestoreRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - could not parse JSON")
	}

	err = ctb.restoreBackup(data)
	if err != nil {
		return err
	}

	// log.Warnf("BACKUP DATA: %+v", backup) // TODO: RC REMOVE
	c.Response().WriteHeader(http.StatusOK)
	return nil

}

func (ctb *cnsiTokenBackup) restoreBackup(backup *RestoreRequest) error {
	log.Debug("restoreBackup")

	// TODO: RC Q all errors are NewHTTPError

	data := &BackupContent{}
	if err := json.Unmarshal([]byte(backup.Data), data); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid backup - could not parse JSON")
	}

	if backup.IgnoreDbVersion == false {
		versions, err := ctb.p.getVersionsData()
		if err != nil {
			return errors.New("Could not find database version")
		}

		if versions.DatabaseVersion != data.DBVersion {
			errorStr := fmt.Sprintf("Incompatible database versions. Expected %+v but got %+v", versions.DatabaseVersion, data.DBVersion)
			return interfaces.NewHTTPShadowError(http.StatusBadRequest, errorStr, errorStr)
		}
	}

	unencryptedBackup, err := crypto.DecryptToken(encryptionKey, data.Payload) //TODO: RC error handling, comments
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to decrypt payload", "Failed to decrypt payload: %+v", err)
	}

	payload := &BackupContentPayload{}
	if err = json.Unmarshal([]byte(unencryptedBackup), payload); err != nil {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Could not parse payload")
	}

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, endpoint := range payload.Endpoints {
		e := deSerializeEndpoint(endpoint)
		if err := cnsiRepo.Overwrite(e, ctb.p.Config.EncryptionKeyInBytes); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite endpoints", "Failed to overwrite endpoint: %+v", e.Name)
		}
	}

	tokenRepo, err := tokens.NewPgsqlTokenRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, tr := range payload.Tokens {
		if err := tokenRepo.SaveCNSIToken(tr.EndpointGUID, tr.UserGUID, tr.TokenRecord, ctb.p.Config.EncryptionKeyInBytes); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite token", "Failed to overwrite token: %+v", tr.TokenRecord.TokenGUID)
		}
	}

	return nil
}

// Work around the omission of the client secret when serialising the cnsi record
func serializeEndpoint(endpoint *interfaces.CNSIRecord) map[string]interface{} {
	// encode the original
	m, _ := json.Marshal(endpoint)

	// decode it back to get a map
	var a interface{}
	json.Unmarshal(m, &a)
	newEndpoint := a.(map[string]interface{})

	// Replace the map key
	newEndpoint["client_secret"] = endpoint.ClientSecret

	return newEndpoint
}

// Work around the omission of the client secret when serialising the cnsi record
func deSerializeEndpoint(endpoint map[string]interface{}) interfaces.CNSIRecord {
	// encode the endpoint map
	m, _ := json.Marshal(endpoint)

	// decode it back to get a record with all values except client secret
	var a interfaces.CNSIRecord
	json.Unmarshal(m, &a)

	// manually add the client secret
	a.ClientSecret = fmt.Sprintf("%v", endpoint["client_secret"])
	log.Errorf("CLIENT SECRET: %+v", a.ClientSecret) // TODO: RC REMOVE
	return a
}
