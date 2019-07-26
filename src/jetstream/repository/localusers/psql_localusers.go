package localusers

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
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
	updateLastLoginTime = datastore.ModifySQLStatement(updateLastLoginTime, databaseProvider)
	findLastLoginTime = datastore.ModifySQLStatement(findLastLoginTime, databaseProvider)
}

// FindPasswordHash returns the password hash from the datastore, for the given user
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

	// Get the password hash from the db
	row := p.db.QueryRow(findPasswordHash, userGUID)
	err := row.Scan(&passwordHash)
	if err != nil {
		msg := "Unable to Find password hash: %v"
		log.Debugf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}
	return passwordHash, nil
}

// FindUserGUID returns the user GUID from the datastore for the given username.
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

//FindUserScope selects the user_scope field from the local_users table in the db, for the given user.
func (p *PgsqlLocalUsersRepository) FindUserScope(userGUID string) (string, error) {
	log.Debug("FindUserScope")
	if userGUID == "" {
		msg := "Unable to find user scope without a valid user GUID."
		log.Debug(msg)
		return "", errors.New(msg)
	}

	// temp var to retrieve user scope from db select
	var (
		userScope string
	)

	// Select the user scope from the db
	err := p.db.QueryRow(findUserScope, userGUID).Scan(&userScope)
	if err != nil {
		msg := "Unable to Find user scope: %v"
		return "", fmt.Errorf(msg, err)
	}

	return userScope, nil
}

//UpdateLastLoginTime called when a local user logs in.
//It updates the last_login timestamp field in the local_users table for the given user.
func (p *PgsqlLocalUsersRepository) UpdateLastLoginTime(userGUID string, loginTime time.Time) error {
	log.Debug("UpdateLastLoginTime")

	if loginTime.IsZero() || userGUID == "" {
		msg := "Unable to update last local user login time without a valid time or user GUID."
		return errors.New(msg)
	}

	var result sql.Result
	var err error
	if result, err = p.db.Exec(updateLastLoginTime, userGUID, loginTime); err != nil {
		msg := "Unable to update last local user login time: %v"
		return fmt.Errorf(msg, err)
	}

	rowsUpdates, err := result.RowsAffected()

	if err != nil {
		err = errors.New("unable to update last local user login time: could not determine the number of rows updated")
	} else if rowsUpdates < 1 {
		err = errors.New("unable to update last local user login time: no rows were updated")
	} else if rowsUpdates > 1 {
		log.Warn("unable to update last local user login time: More than 1 row was updated (expected only 1)")
	}

	return err
}

//FindLastLoginTime selects the last_login field from the local_users table in the db, for the given user.
func (p *PgsqlLocalUsersRepository) FindLastLoginTime(userGUID string) (time.Time, error) {
	log.Debug("FindLastLoginTime")

	if userGUID == "" {
		msg := "unable to find last login time without a valid user GUID"
		log.Debug(msg)
		return time.Unix(0, 0), errors.New(msg)
	}

	// temp vars to retrieve db data
	var (
		loginTime time.Time
	)

	// Get the user scope from the db
	err := p.db.QueryRow(findLastLoginTime, userGUID).Scan(&loginTime)
	if err != nil {
		msg := "unable to Find last login time: %v"
		log.Debug(msg)
		return loginTime, fmt.Errorf(msg, err)
	}
	return loginTime, nil
}

// AddLocalUser - Add a new local user to the datastore.
// Email is optional
func (p *PgsqlLocalUsersRepository) AddLocalUser(user interfaces.LocalUser) error {

	log.Debug("AddLocalUser")

	//Validate args
	var err error
	if user.UserGUID == "" {
		msg := "unable to add new local user without a valid User GUID"
		log.Debug(msg)
		err = errors.New(msg)
	} else if len(user.PasswordHash) == 0 {
		msg := "unable to add new local user without a valid password hash"
		log.Debug(msg)
		err = errors.New(msg)
	} else if user.Username == "" {
		msg := "unable to add new local user without a valid User name"
		log.Debug(msg)
		err = errors.New(msg)
	} else if user.Scope == "" {
		msg := "unable to add new local user without a valid user scope"
		log.Debug(msg)
		err = errors.New(msg)
	}
	if err != nil {
		return err
	}

	// Add the new local user to the DB
	var result sql.Result
	if result, err = p.db.Exec(insertLocalUser, user.UserGUID, user.PasswordHash, user.Username, user.Email, user.Scope); err != nil {
		msg := "unable to INSERT local user: %v"
		log.Debugf(msg)
		err = fmt.Errorf(msg, err)
	}

	if err == nil {
		//Validate that 1 row has been updated
		rowsUpdates, err := result.RowsAffected()
		if err != nil {
			err = errors.New("unable to INSERT local user: could not determine number of rows that were updated")
		} else if rowsUpdates < 1 {
			err = errors.New("unable to INSERT local user: no rows were updated")
		} else if rowsUpdates > 1 {
			log.Warn("INSERT local user: More than 1 row was updated (expected only 1)")
		}
	}

	return err
}
