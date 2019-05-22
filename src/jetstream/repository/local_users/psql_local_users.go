package local_users

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

var findPasswordHash = `SELECT password_hash
									FROM local_users
									WHERE user_guid = $1`
var insertLocalUser = `INSERT INTO local_users (user_guid, password_hash, user_name, user_email, last_login, last_updated) VALUES ($1, $2, $3, $4, $5, $6)`

// PgsqlTokenRepository is a PostgreSQL-backed token repository
type PgsqlLocalUsersRepository struct {
	db *sql.DB
}

// NewPgsqlLocalUsersRepository - get a reference to the local users data source
func NewPgsqlLocalUsersRepository(dcp *sql.DB) (Repository, error) {
	log.Debug("NewPgsqlLocalUsersRepository")
	return &PgsqlLocalUsersRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	findPasswordHash = datastore.ModifySQLStatement(findPasswordHash, databaseProvider)
}

// FindPasswordHash - return the password hash from the datastore
func (p *PgsqlTokenRepository) FindPasswordHash(userGUID string) (hash []byte, error) {
	log.Debug("FindPasswordHash")
	if userGUID == "" {
		msg := "Unable to find password hash without a valid User GUID."
		log.Debug(msg)
		return nil, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		passwordHash              []byte
	)

	// Get the password hash from the db
	err := p.db.QueryRow(findPasswordHash, userGUID).Scan(&passwordHash)
	if err != nil {
		msg := "Unable to Find password hash: %v"
		log.Debugf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	return passwordHash, nil
}

// AddLocalUser - Add a new local user to the datastore
func (p *PgsqlTokenRepository) AddLocalUser(userGUID string, passwordHash []byte, string, name string, email string) error {

	log.Debug("AddLocalUser")

	if userGUID == "" {
		msg := "Unable to add new local user without a valid User GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	if len(passwordHash) == 0 {
		msg := "Unable to add new local user without a valid password hash."
		log.Debug(msg)
		return errors.New(msg)
	}

	if name == "" {
		msg := "Unable to add new local user without a valid User name."
		log.Debug(msg)
		return errors.New(msg)
	}

	// Add the new local user to the DB
	var lastLogin, lastUpdated = nil
	result, err := p.db.Exec(insertLocalUser, userGUID, passwordHash, name, email, lastLogin, lastUpdated)
	if err != nil {
		msg := "Unable to INSERT local user: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("Unable to INSERT local user: could not determine number of rows that were updated")
	}

	if rowsUpdates < 1 {
		return errors.New("Unable to INSERT local user: no rows were updated")
	}

	if rowsUpdates > 1 {
		log.Warn("INSERT local user: More than 1 row was updated (expected only 1)")
	}

	log.Debug("Local user INSERT complete")

	return nil
}