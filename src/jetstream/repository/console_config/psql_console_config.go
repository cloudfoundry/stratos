package console_config

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

// Legacy
var getConsoleConfig = `SELECT auth_endpoint_type, uaa_endpoint, auth_endpoint, console_admin_scope, console_client, console_client_secret, skip_ssl_validation, use_sso FROM console_config`

var deleteConsoleConfig = `DELETE FROM console_config`

// New Config Tale schema

var getConfigValue = `SELECT name, value, last_updated FROM config WHERE groupName = $1 AND name = $2`

var insertConfigValue = `INSERT INTO config (groupName, name, value) VALUES ($1, $2, $3)`

var updateConfigValue = `UPDATE config SET value=$1 WHERE groupName=$2 AND name=$3`

var deleteConfigValue = `DELETE FROM config WHERE groupName=$1 AND name=$2`

var getAllConfigValues = `SELECT name, value, last_updated FROM config WHERE groupName = $1`

// PostgresCNSIRepository is a PostgreSQL-backed ConsoleConfig repository
type ConsoleConfigRepository struct {
	db *sql.DB
}

// NewPostgresConsoleConfigRepository will create a new instance of the PostgresConsoleConfigRepository
func NewPostgresConsoleConfigRepository(dcp *sql.DB) (Repository, error) {
	return &ConsoleConfigRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	getConsoleConfig = datastore.ModifySQLStatement(getConsoleConfig, databaseProvider)
	deleteConsoleConfig = datastore.ModifySQLStatement(deleteConsoleConfig, databaseProvider)

	getConfigValue = datastore.ModifySQLStatement(getConfigValue, databaseProvider)
	insertConfigValue = datastore.ModifySQLStatement(insertConfigValue, databaseProvider)
	updateConfigValue = datastore.ModifySQLStatement(updateConfigValue, databaseProvider)
	deleteConfigValue = datastore.ModifySQLStatement(deleteConfigValue, databaseProvider)
	getAllConfigValues = datastore.ModifySQLStatement(getAllConfigValues, databaseProvider)
}

// GetValue will try and get the config value for the specified key
func (c *ConsoleConfigRepository) GetValue(group, key string) (string, bool, error) {

	var (
		name        string
		value       string
		lastUpdated string
	)

	err := c.db.QueryRow(getConfigValue, group, key).Scan(&name, &value, &lastUpdated)

	switch {
	case err == sql.ErrNoRows:
		// No matching value
		return "", false, nil
	case err != nil:
		return "", false, err
	default:
		// do nothing
	}

	return value, true, nil
}

func (c *ConsoleConfigRepository) SetValue(group, name, value string) error {

	log.Debug("Config SetValue")

	_, ok, err := c.GetValue(group, name)
	if err != nil {
		return err
	}

	if !ok {
		if _, err := c.db.Exec(insertConfigValue, group, name, value); err != nil {
			msg := "Unable to INSERT config value: %v"
			log.Debugf(msg, err)
			return fmt.Errorf(msg, err)
		}
	} else {
		if _, err := c.db.Exec(updateConfigValue, value, group, name); err != nil {
			msg := "Unable to UPDATE config value: %v"
			log.Debugf(msg, err)
			return fmt.Errorf(msg, err)
		}
	}

	return nil
}

// DeleteValue deletes a value from the config table
func (c *ConsoleConfigRepository) DeleteValue(group, key string) error {
	log.Debug("Config Delete")
	if _, err := c.db.Exec(deleteConfigValue, group, key); err != nil {
		return fmt.Errorf("Unable to delete config value: %v", err)
	}

	return nil
}

// GetValues returns all values from the config table as a map
func (c *ConsoleConfigRepository) GetValues(group string) (map[string]string, error) {

	log.Debug("Config GetValues")
	rows, err := c.db.Query(getAllConfigValues, group)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve config records: %v", err)
	}
	defer rows.Close()

	var values = make(map[string]string)

	for rows.Next() {
		var (
			name        string
			value       string
			lastUpdated string
		)

		err := rows.Scan(&name, &value, &lastUpdated)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan config records: %v", err)
		}

		values[name] = value
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to get config records: %v", err)
	}

	return values, nil
}

func (c *ConsoleConfigRepository) GetConsoleConfig() (*api.ConsoleConfig, error) {
	log.Debug("Get ConsoleConfig")
	rows, err := c.db.Query(getConsoleConfig)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve console config record: %v", err)
	}
	defer rows.Close()

	rowCount := 0

	var consoleConfig *api.ConsoleConfig
	for rows.Next() {
		var (
			uaaEndpoint      string
			authEndpoint     sql.NullString
			authEndpointType sql.NullString
		)
		rowCount++
		if rowCount > 1 {
			return nil, errors.New("Multiple configuration data detected")
		}

		consoleConfig = new(api.ConsoleConfig)
		err := rows.Scan(&authEndpointType, &uaaEndpoint, &authEndpoint, &consoleConfig.ConsoleAdminScope, &consoleConfig.ConsoleClient,
			&consoleConfig.ConsoleClientSecret, &consoleConfig.SkipSSLValidation, &consoleConfig.UseSSO)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan config record: %v", err)
		}

		if consoleConfig.UAAEndpoint, err = url.Parse(uaaEndpoint); err != nil {
			return nil, fmt.Errorf("Unable to parse UAA Endpoint: %v", err)
		}

		// Might be null if database was upgraded
		if authEndpoint.Valid {
			if consoleConfig.AuthorizationEndpoint, err = url.Parse(authEndpoint.String); err != nil {
				return nil, fmt.Errorf("Unable to parse Authorization Endpoint: %v", err)
			}
		}

		if authEndpointType.Valid {
			consoleConfig.AuthEndpointType = authEndpointType.String
		} else {
			consoleConfig.AuthEndpointType = "remote"
		}
	}

	return consoleConfig, nil
}

// DeleteConsoleConfig will delete all row(s) from the legacy config_config table
func (c *ConsoleConfigRepository) DeleteConsoleConfig() error {
	log.Debug("DeleteConsoleConfig")
	if _, err := c.db.Exec(deleteConsoleConfig); err != nil {
		return fmt.Errorf("Unable to delete all data from console_config: %v", err)
	}

	return nil
}
