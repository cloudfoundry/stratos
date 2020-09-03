package apikeys

import (
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"reflect"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var sqlQueries = struct {
	InsertAPIKey         string
	GetAPIKeyBySecret    string
	ListAPIKeys          string
	DeleteAPIKey         string
	UpdateAPIKeyLastUsed string
}{
	InsertAPIKey:         `INSERT INTO api_keys (guid, secret, user_guid, comment) VALUES ($1, $2, $3, $4)`,
	GetAPIKeyBySecret:    `SELECT guid, user_guid, comment, last_used FROM api_keys WHERE secret = $1`,
	ListAPIKeys:          `SELECT guid, user_guid, comment, last_used FROM api_keys WHERE user_guid = $1`,
	DeleteAPIKey:         `DELETE FROM api_keys WHERE user_guid = $1 AND guid = $2`,
	UpdateAPIKeyLastUsed: `UPDATE api_keys SET last_used = $1 WHERE guid = $2`,
}

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
	// Iterating over the struct to ensure that all of the queries are updated
	v := reflect.ValueOf(sqlQueries)
	for i := 0; i < v.NumField(); i++ {
		q := v.Field(i).Interface().(string)

		reflect.
			ValueOf(&sqlQueries).
			Elem().
			FieldByIndex([]int{i}).
			SetString(
				datastore.ModifySQLStatement(q, databaseProvider),
			)
	}
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

	err = execQuery(p, sqlQueries.InsertAPIKey, keyGUID, keySecret, userID, comment)
	if err != nil {
		return nil, fmt.Errorf("AddAPIKey: %v", err)
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

	err := p.db.QueryRow(sqlQueries.GetAPIKeyBySecret, keySecret).Scan(
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

	rows, err := p.db.Query(sqlQueries.ListAPIKeys, userID)
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

	err := execQuery(p, sqlQueries.DeleteAPIKey, userGUID, keyGUID)
	if err != nil {
		return fmt.Errorf("DeleteAPIKey: %v", err)
	}

	return nil
}

// UpdateAPIKeyLastUsed - sets API key last_used field to current time
func (p *PgsqlAPIKeysRepository) UpdateAPIKeyLastUsed(keyGUID string) error {
	log.Debug("UpdateAPIKeyLastUsed")

	err := execQuery(p, sqlQueries.UpdateAPIKeyLastUsed, time.Now().UTC(), keyGUID)
	if err != nil {
		return fmt.Errorf("UpdateAPIKeyLastUsed: %v", err)
	}

	return nil
}

// A wrapper around db.Exec that validates that exactly 1 row has been inserted/deleted/updated
func execQuery(p *PgsqlAPIKeysRepository, query string, args ...interface{}) error {
	result, err := p.db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("could not determine number of rows that were updated")
	} else if rowsUpdates < 1 {
		return errors.New("no rows were updated")
	}

	return nil
}
