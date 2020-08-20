package apikeys

import (
	"database/sql"
	"encoding/base64"
	"errors"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var insertAPIKey = `INSERT INTO api_keys (guid, secret, user_guid, comment) VALUES ($1, $2, $3, $4)`
var getAPIKeyBySecret = `SELECT guid, user_guid, comment, last_used FROM api_keys WHERE secret = $1`
var listAPIKeys = `SELECT guid, user_guid, comment, last_used FROM api_keys WHERE user_guid = $1`
var deleteAPIKey = `DELETE FROM api_keys WHERE user_guid = $1 AND guid = $2`
var updateAPIKeyLastUsed = `UPDATE api_keys SET last_used = $1 WHERE guid = $2`

// UpdateAPIKeyLastUsed

// PgsqlAPIKeysRepository - Postgresql-backed API keys repository
type PgsqlAPIKeysRepository struct {
	db *sql.DB
}

// NewPgsqlAPIKeysRepository - get a reference to the API keys data source
func NewPgsqlAPIKeysRepository(dcp *sql.DB) (Repository, error) {
	log.Debug("NewPgsqlAPIKeysRepository")
	return &PgsqlAPIKeysRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	insertAPIKey = datastore.ModifySQLStatement(insertAPIKey, databaseProvider)
	getAPIKeyBySecret = datastore.ModifySQLStatement(getAPIKeyBySecret, databaseProvider)
	deleteAPIKey = datastore.ModifySQLStatement(deleteAPIKey, databaseProvider)
	listAPIKeys = datastore.ModifySQLStatement(listAPIKeys, databaseProvider)
	updateAPIKeyLastUsed = datastore.ModifySQLStatement(updateAPIKeyLastUsed, databaseProvider)
}

// AddAPIKey - Add a new API key to the datastore.
func (p *PgsqlAPIKeysRepository) AddAPIKey(userID string, comment string) (*interfaces.APIKey, error) {
	log.Debug("AddAPIKey")

	var err error

	// Validate args
	if len(comment) > 255 {
		msg := "comment maximum length is 255 characters"
		log.Debug(msg)
		err = errors.New(msg)
	}

	if err != nil {
		return nil, err
	}

	randomBytes, err := crypto.GenerateRandomBytes(48)
	if err != nil {
		return nil, err
	}

	keyGUID := uuid.NewV4().String()
	keySecret := base64.URLEncoding.EncodeToString(randomBytes)

	var result sql.Result
	if result, err = p.db.Exec(insertAPIKey, keyGUID, keySecret, userID, comment); err != nil {
		log.Errorf("unable to INSERT API key: %v", err)
		return nil, err
	}

	//Validate that 1 row has been updated
	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return nil, errors.New("unable to INSERT api key: could not determine number of rows that were updated")
	} else if rowsUpdates < 1 {
		return nil, errors.New("unable to INSERT api key: no rows were updated")
	}

	apiKey := &interfaces.APIKey{
		GUID:     keyGUID,
		Secret:   keySecret,
		UserGUID: userID,
		Comment:  comment,
	}

	return apiKey, err
}

// GetAPIKeyBySecret - gets user ID for an API key
func (p *PgsqlAPIKeysRepository) GetAPIKeyBySecret(keySecret string) (*interfaces.APIKey, error) {
	log.Debug("GetAPIKeyBySecret")

	var apiKey interfaces.APIKey

	err := p.db.QueryRow(getAPIKeyBySecret, keySecret).Scan(
		&apiKey.GUID,
		&apiKey.UserGUID,
		&apiKey.Comment,
		&apiKey.LastUsed,
	)

	if err != nil {
		return nil, err
	}

	return &apiKey, nil
}

// ListAPIKeys - list API keys for a given user GUID
func (p *PgsqlAPIKeysRepository) ListAPIKeys(userID string) ([]interfaces.APIKey, error) {
	log.Debug("ListAPIKeys")

	rows, err := p.db.Query(listAPIKeys, userID)
	if err != nil {
		log.Errorf("unable to list API keys: %v", err)
		return nil, err
	}

	result := []interfaces.APIKey{}
	for rows.Next() {
		var apiKey interfaces.APIKey
		err = rows.Scan(&apiKey.GUID, &apiKey.UserGUID, &apiKey.Comment, &apiKey.LastUsed)
		if err != nil {
			log.Errorf("Scan: %v", err)
			return nil, err
		}
		result = append(result, apiKey)
	}

	return result, nil
}

// DeleteAPIKey - delete an API key identified by its GUID
func (p *PgsqlAPIKeysRepository) DeleteAPIKey(userGUID string, keyGUID string) error {
	log.Debug("DeleteAPIKey")

	result, err := p.db.Exec(deleteAPIKey, userGUID, keyGUID)
	if err != nil {
		return err
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("unable to DELETE api key: could not determine number of rows that were updated")
	} else if rowsUpdates < 1 {
		return errors.New("unable to DELETE api key: no rows were updated")
	}

	return nil
}

// UpdateAPIKeyLastUsed - sets API key last_used field to current time
func (p *PgsqlAPIKeysRepository) UpdateAPIKeyLastUsed(keyGUID string) error {
	log.Debug("UpdateAPIKeyLastUsed")

	result, err := p.db.Exec(updateAPIKeyLastUsed, time.Now(), keyGUID)
	if err != nil {
		return err
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("unable to UPDATE api key: could not determine number of rows that were updated")
	} else if rowsUpdates < 1 {
		return errors.New("unable to UPDATE api key: no rows were updated")
	}

	return nil
}
