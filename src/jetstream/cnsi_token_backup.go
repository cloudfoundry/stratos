package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

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
	Endpoints []*interfaces.CNSIRecord
	Tokens    []interfaces.BackupTokenRecord
}

// BackupContent - Everything that's backed up and stored in a file client side
type BackupContent struct {
	Payload   BackupContentPayload `json:"payload"`
	DBVersion int64                `json:"dbVersion"`
}

// RestoreRequest - Request from client to restore content from payload
type RestoreRequest struct {
	// Payload - Encrypted version of BackupContent
	Payload         string `json:"data"`
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
	// TODO: RC Missing client_secret when serialised, `-` in definition
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
	endpoints := make([]*interfaces.CNSIRecord, 0)
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
			if tokenRecords, ok := ctb.getCNSITokenRecordsBackup(endpointID); ok {
				log.Warn("tokens for AllConnect") // TODO: RC REMOVE
				tokens = append(tokens, tokenRecords...)
			} else {
				log.Warn("No tokens for AllConnect") // TODO: RC REMOVE
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
				log.Infof("Request to back up connected user's (%+v) token for endpoint (%+v) failed. No token for user.", endpointID, data.UserID)
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
	// encryptedPayload := payload

	versions, err := ctb.p.getVersionsData()
	if err != nil {
		return nil, errors.New("Could not find database version")
	}

	// log.Infof("payload: %+v", payload)

	response := &BackupContent{
		Payload:   *payload,
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
	if err := json.Unmarshal([]byte(backup.Payload), backup); err != nil {
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

	unencryptedBackup := data.Payload

	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, endpoint := range unencryptedBackup.Endpoints {
		if err := cnsiRepo.Overwrite(*endpoint, ctb.p.Config.EncryptionKeyInBytes); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite endpoints", "Failed to overwrite endpoint: %+v", endpoint.Name)
		}
	}

	tokenRepo, err := tokens.NewPgsqlTokenRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, tr := range unencryptedBackup.Tokens {
		if err := tokenRepo.SaveCNSIToken(tr.EndpointGUID, tr.UserGUID, tr.TokenRecord, ctb.p.Config.EncryptionKeyInBytes); err != nil {
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
