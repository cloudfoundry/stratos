package local_users

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	log "github.com/sirupsen/logrus"
)

var findPasswordHash = `SELECT password_hash
									FROM local_users
									WHERE user_guid = $1`
var findUserGUID = `SELECT user_guid FROM local_users WHERE user_name = $1`
var findUserScope = `SELECT user_scope FROM local_users WHERE user_guid = $1`
var insertLocalUser = `INSERT INTO local_users (user_guid, password_hash, user_name, user_email, user_scope) VALUES ($1, $2, $3, $4, $5)`
var updateLastLoginTime = `UPDATE local_users (last_login) VALUES ($1) WHERE user_guid = $2`
var findLastLoginTime = `SELECT last_login FROM local_users WHERE user_guid = $1`
var getTableCount = `SELECT count(user_guid) FROM local_users`

// PgsqlLocalUsersRepository is a PostgreSQL-backed local users repository
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
	findUserGUID = datastore.ModifySQLStatement(findUserGUID, databaseProvider)
	findUserScope = datastore.ModifySQLStatement(findUserScope, databaseProvider)
	insertLocalUser = datastore.ModifySQLStatement(insertLocalUser, databaseProvider)
	getTableCount = datastore.ModifySQLStatement(getTableCount, databaseProvider)
	updateLastLoginTime = `UPDATE local_users (last_login) VALUES ($1) WHERE user_guid = $2`
	findLastLoginTime = `SELECT last_login FROM local_users WHERE user_guid = $1`
}

// FindPasswordHash - return the password hash from the datastore
func (p *PgsqlLocalUsersRepository) FindPasswordHash(userGUID string) ([]byte, error) {
	log.Debug("FindPasswordHash")
	if userGUID == "" {
		msg := "Unable to find password hash without a valid User GUID."
		log.Debug(msg)
		return nil, errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		passwordHash []byte
	)

	log.Infof("Querying hash for user GUID: %s", userGUID)
	// Get the password hash from the db
	row := p.db.QueryRow(findPasswordHash, userGUID)
	err := row.Scan(&passwordHash)
	log.Infof("Found password hash: %s", string(passwordHash))
	if err != nil {
		msg := "Unable to Find password hash: %s"
		log.Infof(msg, err)
		return nil, fmt.Errorf(msg, err)
	}
	return passwordHash, nil
}

// FindUserGUID - return the user GUID from the datastore
func (p *PgsqlLocalUsersRepository) FindUserGUID(username string) (string, error) {
	log.Debug("FinduserGUID")
	if username == "" {
		msg := "Unable to find user GUID without a valid username."
		log.Debug(msg)
		return "", errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		userGUID sql.NullString
	)

	// Get the password hash from the db
	err := p.db.QueryRow(findUserGUID, username).Scan(&userGUID)
	if err != nil {
		msg := "Unable to Find user GUID: %v"
		log.Debugf(msg, err)
		return "", fmt.Errorf(msg, err)
	}

	return userGUID.String, nil
}

func (p *PgsqlLocalUsersRepository) FindUserScope(userGUID string) (string, error) {
	log.Debug("FindUserScope")
	log.Debug("Finding user scope for GUID: %s", userGUID)
	if userGUID == "" {
		msg := "Unable to find user scope without a valid user GUID."
		log.Debug(msg)
		return "", errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		userScope string
	)

	// Get the user scope from the db
	err := p.db.QueryRow(findUserScope, userGUID).Scan(&userScope)
	if err != nil {
		msg := "Unable to Find user scope: %v"
		log.Debugf(msg, err)
		return "", fmt.Errorf(msg, err)
	}

	return userScope, nil
}

func (p *PgsqlLocalUsersRepository) UpdateLastLoginTime(userGUID string, loginTime time.Time) error {
	log.Debug("UpdateLastLoginTime")

	if loginTime.IsZero() {
		msg := "Unable to update last local user login time without a valid time."
		log.Debug(msg)
		return errors.New(msg)
	}

	if userGUID == "" {
		msg := "Unable to update last local user login time without a user GUID."
		log.Debug(msg)
		return errors.New(msg)
	}

	log.Infof("Updating last login time for GUID: %s  to: %s", userGUID, loginTime.Unix())
	result, err := p.db.Exec(updateLastLoginTime, userGUID, loginTime.Unix())

	if err != nil {
		msg := "Unable to update last local user login time: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}
	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("unable to update last local user login time: could not determine the number of rows updated")
	}

	if rowsUpdates < 1 {
		return errors.New("unable to update last local user login time: no rows were updated")
	}

	if rowsUpdates > 1 {
		log.Warn("unable to update last local user login time: More than 1 row was updated (expected only 1)")
	}

	log.Debug("Local user last login time UPDATE complete")

	return nil
}

// AddLocalUser - Add a new local user to the datastore
func (p *PgsqlLocalUsersRepository) AddLocalUser(userGUID string, passwordHash []byte, username string, email string, scope string) error {

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

	if username == "" {
		msg := "Unable to add new local user without a valid User name."
		log.Debug(msg)
		return errors.New(msg)
	}

	// Add the new local user to the DB
	log.Infof("Adding user: %s  %s  %s  %s  %s ", userGUID, passwordHash, username, email, scope)
	result, err := p.db.Exec(insertLocalUser, userGUID, passwordHash, username, email, scope)
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
