package sessiondata

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

var getSessionDataValues = `SELECT name, value FROM session_data WHERE expired=false AND session=$1 AND groupName = $1`

var insertSessionDataValue = `INSERT INTO session_data (session, groupName, name, value, keep_on_expire) VALUES ($1, $2, $3, $4, $5)`

var deleteSessionGroupData = `DELETE FROM session_data WHERE session=$1 AND groupName=$2`

// Expire data for sessions that no longer exist
var expireSessionData = `UPDATE session_data SET expired=true WHERE session NOT IN (SELECT id from sessions)`

// Delete data for sessions that no longer exist
var deleteSessionData = `DELETE FROM session_data WHERE expired=true AND keep_on_expire=false`

// Check if a session valid
var isValidSession = `SELECT id, expires_on from sessions WHERE id=$1`

// SessionDataRepository is a RDB-backed Session Data repository
type SessionDataRepository struct {
	db *sql.DB
}

// NewPostgresSessionDataRepository will create a new instance of the SessionDataRepository
func NewPostgresSessionDataRepository(dcp *sql.DB) (interfaces.SessionDataStore, error) {
	return &SessionDataRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getSessionDataValues = datastore.ModifySQLStatement(getSessionDataValues, databaseProvider)
	insertSessionDataValue = datastore.ModifySQLStatement(insertSessionDataValue, databaseProvider)
	deleteSessionGroupData = datastore.ModifySQLStatement(deleteSessionGroupData, databaseProvider)
	expireSessionData = datastore.ModifySQLStatement(expireSessionData, databaseProvider)
	deleteSessionData = datastore.ModifySQLStatement(deleteSessionData, databaseProvider)
	isValidSession = datastore.ModifySQLStatement(isValidSession, databaseProvider)
}

// GetValues returns all values from the config table as a map
func (c *SessionDataRepository) GetValues(session, group string) (map[string]string, error) {
	log.Debug("SessionDataRepository GetValues")
	rows, err := c.db.Query(getSessionDataValues, session, group)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve session data records: %v", err)
	}
	defer rows.Close()

	var values = make(map[string]string)
	for rows.Next() {
		var (
			name  string
			value string
		)

		err := rows.Scan(&name, &value)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan session data records: %v", err)
		}

		values[name] = value
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to get session data records: %v", err)
	}

	return values, nil
}

// DeleteValues deletes all values for the session and group
func (c *SessionDataRepository) DeleteValues(session, group string) error {
	log.Debug("SessionDataRepository DeleteValue")
	if _, err := c.db.Exec(deleteSessionGroupData, session, group); err != nil {
		return fmt.Errorf("Unable to delete session data values: %v", err)
	}

	return nil
}

// SetValues replaces existing group values with those provided
func (c *SessionDataRepository) SetValues(session, group string, values map[string]string, autoExpire bool) error {
	err := c.DeleteValues(session, group)
	if err != nil {
		return fmt.Errorf("SetValues: Unable to clear existing values: %v", err)
	}

	for key, value := range values {
		if _, err := c.db.Exec(insertSessionDataValue, session, group, key, value, autoExpire); err != nil {
			msg := "Unable to INSERT session data value: %v"
			log.Debugf(msg, err)
			return fmt.Errorf(msg, err)
		}
	}

	return nil
}

// IsValidSession - Determines if the given session ID is still valid (has not expired)
func (c *SessionDataRepository) IsValidSession(session int) (bool, error) {
	var (
		id     string
		expiry time.Time
	)

	err := c.db.QueryRow(isValidSession, strconv.Itoa(session)).Scan(&id, &expiry)

	switch {
	case err == sql.ErrNoRows:
		// No record with this ID - session does not exist
		return false, nil
	case err != nil:
		return false, fmt.Errorf("Error trying to find Session record: %v", err)
	default:
		// do nothing
	}

	// Check if the session has expired
	now := time.Now()
	return expiry.After(now), nil
}
