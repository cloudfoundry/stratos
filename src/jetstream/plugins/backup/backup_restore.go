package backup

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
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
	encryptionKey          []byte
	userID                 string
	dbVersion              int64
	p                      interfaces.PortalProxy
}

// ConnectionType - Determine what kind of connection details are stored for an endpoint
type ConnectionType string

const (
	BACKUP_CONNECTION_NONE    ConnectionType = "NONE"
	BACKUP_CONNECTION_CURRENT                = "CURRENT"
	BACKUP_CONNECTION_ALL                    = "ALL"
)

// BackupEndpointsState - For a given endpoint define what's backed up
type BackupEndpointsState struct {
	Endpoint bool           `json:"endpoint"`
	Connect  ConnectionType `json:"connect"`
}

// BackupRequest - Request from client to create a back up file
type BackupRequest struct {
	State    map[string]BackupEndpointsState `json:"state"`
	Password string                          `json:"password"`
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
	// Data - Content of backup file. This should be of type BackupContent
	Data            string `json:"data"`
	Password        string `json:"password"`
	IgnoreDbVersion bool   `json:"ignoreDbVersion"`
}

func (ctb *cnsiTokenBackup) BackupEndpoints(c echo.Context) error {
	log.Debug("BackupEndpoints")

	// Create the backup request struct from the body
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Invalid request body", "Invalid request body: %+v", err)
	}

	data := &BackupRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Invalid request body - could not parse JSON", "Invalid request body - could not parse JSON: %+v", err)
	}

	if data.State == nil || len(data.State) == 0 {
		return interfaces.NewHTTPError(http.StatusBadRequest, "Invalid request body - no endpoints to backup")
	}

	// Create backup
	response, err := ctb.createBackup(data)
	if err != nil {
		return err
	}

	// Send the response back to the client
	jsonString, err := json.Marshal(response)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to serialize response", "Failed to serialize response: %+v", err)
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (ctb *cnsiTokenBackup) createBackup(data *BackupRequest) (*BackupContent, error) {
	log.Debug("createBackup")
	allEndpoints, err := ctb.p.ListEndpoints()
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(http.StatusBadGateway, "Failed to fetch endpoints", "Failed to fetch endpoints: %+v", err)
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
				tokens = append(tokens, tokenRecords...)
			} else {
				text := fmt.Sprintf("Failed to fetch tokens for endpoint %+v", endpointID)
				return nil, interfaces.NewHTTPError(http.StatusBadGateway, text)
			}
		case BACKUP_CONNECTION_CURRENT:
			if tokenRecord, ok := ctb.p.GetCNSITokenRecordWithDisconnected(endpointID, ctb.userID); ok {
				var btr = interfaces.BackupTokenRecord{
					TokenRecord:  tokenRecord,
					EndpointGUID: endpointID,
					TokenType:    "cnsi",
					UserGUID:     ctb.userID,
				}
				tokens = append(tokens, btr)
			} else {
				text := fmt.Sprintf("Request to back up connected user's (%+v) token for endpoint (%+v) failed.", endpointID, ctb.userID)
				return nil, interfaces.NewHTTPError(http.StatusBadGateway, text)
			}
		}
	}

	// Create the payload, this will be encrypted
	payload := &BackupContentPayload{
		Endpoints: endpoints,
		Tokens:    tokens,
	}

	// Encrypt the entire payload
	encryptedPayload, err := encryptPayload(payload, data.Password)
	if err != nil {
		return nil, interfaces.NewHTTPShadowError(http.StatusBadGateway, "Could not encrypt payload", "Could not encrypt payload: %+v", err)
	}

	// Add the db version to the response, this will allow client side up front validation
	response := &BackupContent{
		Payload:   encryptedPayload,
		DBVersion: ctb.dbVersion,
	}

	return response, nil
}

func (ctb *cnsiTokenBackup) getCNSITokenRecordsBackup(endpointID string) ([]interfaces.BackupTokenRecord, bool) {
	log.Debug("getCNSITokenRecordsBackup")
	tokenRepo, err := tokens.NewPgsqlTokenRepository(ctb.databaseConnectionPool)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	trs, err := tokenRepo.FindAllCNSITokenBackup(endpointID, ctb.encryptionKey)
	if err != nil {
		return make([]interfaces.BackupTokenRecord, 0), false
	}

	return trs, true
}

func (ctb *cnsiTokenBackup) RestoreEndpoints(c echo.Context) error {
	log.Debug("RestoreEndpoints")

	// Create the restore request struct from the body
	body, err := ioutil.ReadAll(c.Request().Body)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Invalid request body", "Invalid request body: %+v", err)
	}

	data := &RestoreRequest{}
	if err = json.Unmarshal(body, data); err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Invalid request body - could not parse JSON", "Invalid request body - could not parse JSON: %+v", err)
	}

	err = ctb.restoreBackup(data)
	if err != nil {
		return err
	}

	c.Response().WriteHeader(http.StatusOK)
	return nil
}

func (ctb *cnsiTokenBackup) restoreBackup(backup *RestoreRequest) error {
	log.Debug("restoreBackup")

	data := &BackupContent{}
	if err := json.Unmarshal([]byte(backup.Data), data); err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Invalid backup - could not parse JSON", "Invalid backup - could not parse JSON: %+v", err)
	}

	// Check that the db version of backup file matches the stratos db version
	if backup.IgnoreDbVersion == false {
		if ctb.dbVersion != data.DBVersion {
			errorStr := fmt.Sprintf("Incompatible database versions. Expected %+v but got %+v", ctb.dbVersion, data.DBVersion)
			return interfaces.NewHTTPError(http.StatusBadRequest, errorStr)
		}
	}

	// Get the actual, unencrypted set of endpoints and tokens
	payloadString, err := decryptPayload(data.Payload, backup.Password)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to decrypt payload", "Failed to decrypt payload: %+v", err)
	}
	payload := &BackupContentPayload{}
	if err = json.Unmarshal([]byte(*payloadString), payload); err != nil {
		return interfaces.NewHTTPShadowError(http.StatusBadRequest, "Failed to parse payload. This could be due to an incorrect password", "Failed to decrypt payload, possible incorrect password: %+v", err)
	}

	// Insert/Update the endpoints and tokens
	cnsiRepo, err := cnsis.NewPostgresCNSIRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, endpoint := range payload.Endpoints {
		e := deSerializeEndpoint(endpoint)
		if err := cnsiRepo.SaveOrUpdate(e, ctb.encryptionKey); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite endpoints", "Failed to overwrite endpoint: %+v", e.Name)
		}
	}

	tokenRepo, err := tokens.NewPgsqlTokenRepository(ctb.databaseConnectionPool)
	if err != nil {
		return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to connect to db", "Failed to connect to db: %+v", err)
	}

	for _, tr := range payload.Tokens {
		if err := tokenRepo.SaveCNSIToken(tr.EndpointGUID, tr.UserGUID, tr.TokenRecord, ctb.encryptionKey); err != nil {
			return interfaces.NewHTTPShadowError(http.StatusInternalServerError, "Failed to overwrite token", "Failed to overwrite token: %+v", tr.TokenRecord.TokenGUID)
		}
	}

	return nil
}

// Work around the omission of the client secret when serialising the cnsi record
func serializeEndpoint(endpoint *interfaces.CNSIRecord) map[string]interface{} {
	// Convert struct to generic map
	m, _ := json.Marshal(endpoint)
	var a interface{}
	json.Unmarshal(m, &a)
	newEndpoint := a.(map[string]interface{})

	// Apply the correct client secret
	newEndpoint["client_secret"] = endpoint.ClientSecret

	return newEndpoint
}

// Work around the omission of the client secret when serialising the cnsi record
func deSerializeEndpoint(endpoint map[string]interface{}) interfaces.CNSIRecord {
	// Convert struct to endpoint
	m, _ := json.Marshal(endpoint)
	var cnsi interfaces.CNSIRecord
	json.Unmarshal(m, &cnsi)

	// Apply the correct client secret
	cnsi.ClientSecret = fmt.Sprintf("%v", endpoint["client_secret"])
	return cnsi
}

func encryptPayload(payload *BackupContentPayload, password string) ([]byte, error) {
	// First ensure the password is an ok length
	secret, err := createHash(password)
	if err != nil {
		log.Warningf("Could not create hash: %+v", err)
		return nil, fmt.Errorf("Could not create hash")
	}

	// Create the text that will be encrypted
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("Could not marshal payload: %+v", err)
	}

	// Encrypt
	payloadEncrypted, err := crypto.EncryptToken(secret, string(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("Could not encrypt payload: %+v", err)
	}

	return payloadEncrypted, nil
}

func decryptPayload(payloadEncrypted []byte, password string) (*string, error) {
	// First ensure the password is an ok length
	secret, err := createHash(password)
	if err != nil {
		log.Warningf("Could not create hash: %+v", err)
		return nil, fmt.Errorf("Could not create hash")
	}

	payloadUnencrypted, err := crypto.DecryptToken(secret, payloadEncrypted)
	if err != nil {
		return nil, fmt.Errorf("Failed to decrypt payload: %+v", err)
	}

	return &payloadUnencrypted, nil
}

// createHash - Ensure the token used by crypto is at an acceptable length
func createHash(password string) ([]byte, error) {
	// Create a hash long enough to ensure with use AES-256
	hasher := sha256.New()
	if _, err := hasher.Write([]byte(password)); err != nil {
		return nil, fmt.Errorf("Failed to write password to hash")
	}
	return hasher.Sum(nil), nil
}
