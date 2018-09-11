package console_config

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

var getConsoleConfig = `SELECT uaa_endpoint, console_admin_scope, console_client, console_client_secret, skip_ssl_validation, use_sso
							FROM console_config`

var saveConsoleConfig = `INSERT INTO console_config (uaa_endpoint, console_admin_scope, console_client, console_client_secret, skip_ssl_validation, is_setup_complete, use_sso)
						VALUES ($1, $2, $3, $4, $5, $6, $7)`

var updateConsoleConfig = `UPDATE console_config SET console_admin_scope = $1, is_setup_complete = '1'`

var getTableCount = `SELECT count(uaa_endpoint) FROM console_config`

var hasSetupCompleted = `SELECT is_setup_complete FROM console_config`

var deleteConsoleConfig = ` DELETE FROM console_config`

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
	saveConsoleConfig = datastore.ModifySQLStatement(saveConsoleConfig, databaseProvider)
	getTableCount = datastore.ModifySQLStatement(getTableCount, databaseProvider)
	hasSetupCompleted = datastore.ModifySQLStatement(hasSetupCompleted, databaseProvider)
	updateConsoleConfig = datastore.ModifySQLStatement(updateConsoleConfig, databaseProvider)
	deleteConsoleConfig = datastore.ModifySQLStatement(deleteConsoleConfig, databaseProvider)
}

// ListByUser - Returns a list of CNSIs registered by a user
func (c *ConsoleConfigRepository) GetConsoleConfig() (*interfaces.ConsoleConfig, error) {
	log.Debug("Get ConsoleConfig")
	rows, err := c.db.Query(getConsoleConfig)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve console config record: %v", err)
	}
	defer rows.Close()

	rowCount := 0

	var consoleConfig *interfaces.ConsoleConfig
	for rows.Next() {
		var (
			authEndpoint string
		)
		rowCount++
		if rowCount > 1 {
			return nil, errors.New("Multiple configuration data detected!")
		}

		consoleConfig = new(interfaces.ConsoleConfig)
		err := rows.Scan(&authEndpoint, &consoleConfig.ConsoleAdminScope, &consoleConfig.ConsoleClient,
			&consoleConfig.ConsoleClientSecret, &consoleConfig.SkipSSLValidation, &consoleConfig.UseSSO)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan config record: %v", err)
		}

		if consoleConfig.UAAEndpoint, err = url.Parse(authEndpoint); err != nil {
			return nil, fmt.Errorf("Unable to parse UAA Endpoint: %v", err)
		}
	}

	return consoleConfig, nil
}

// Save - Persist a Console setup to a datastore
func (c *ConsoleConfigRepository) SaveConsoleConfig(config *interfaces.ConsoleConfig) error {
	log.Debug("Saving ConsoleConfig: %+v", config)

	// First wipe any values that may exist in the table
	err := c.deleteConsoleConfig()
	if err != nil {
		return fmt.Errorf("Unable to truncate Console Config table: %v", err)
	}
	isComplete := config.ConsoleAdminScope != ""

	if _, err := c.db.Exec(saveConsoleConfig, fmt.Sprintf("%s", config.UAAEndpoint),
		config.ConsoleAdminScope, config.ConsoleClient, config.ConsoleClientSecret, config.SkipSSLValidation, isComplete, config.UseSSO); err != nil {
		return fmt.Errorf("Unable to Save Console Config record: %v", err)
	}

	return nil
}

func (c *ConsoleConfigRepository) UpdateConsoleConfig(config *interfaces.ConsoleConfig) error {
	log.Debug("Saving ConsoleConfig: %+v", config)
	if _, err := c.db.Exec(updateConsoleConfig, config.ConsoleAdminScope); err != nil {
		return fmt.Errorf("Unable to Save Console Config record: %v", err)
	}

	return nil
}

func (c *ConsoleConfigRepository) deleteConsoleConfig() error {
	if _, err := c.db.Exec(deleteConsoleConfig); err != nil {
		return fmt.Errorf("Unable to delete Console Config record: %v", err)
	}

	return nil
}

func (c *ConsoleConfigRepository) IsInitialised() (bool, error) {

	rowCount, err := c.getTableCount()
	if err != nil {
		for strings.Contains(err.Error(), "does not exist") || strings.Contains(err.Error(), "doesn't exist") {
			// Schema isn't initialised yet. Wait a few secs and retry
			log.Warnf("It appears schema isn't initialised yet, sleeping and trying again %s", err)
			time.Sleep(1 * time.Second)
			rowCount, err = c.getTableCount()
			if err == nil {
				break
			}
		}
		if err != nil {
			return false, err
		}

	}

	if rowCount == 0 {
		return false, nil
	}

	// A row exists, check if is_setup_complete is set
	isSetupComplete, err := c.isSetupComplete()
	if err != nil {
		return false, err
	}

	return isSetupComplete, nil
}

func (c *ConsoleConfigRepository) isSetupComplete() (bool, error) {
	rows, err := c.db.Query(hasSetupCompleted)

	if err != nil {
		return false, fmt.Errorf("Exception occurred when fetching row: %v", err)
	}
	defer rows.Close()

	isSetupComplete := false
	for rows.Next() {

		err := rows.Scan(&isSetupComplete)
		if err != nil {
			return false, fmt.Errorf("Unable to scan config record: %v", err)
		}
	}

	return isSetupComplete, nil
}

func (c *ConsoleConfigRepository) getCount(sqlStatement string) (int, error) {
	rows, err := c.db.Query(sqlStatement)

	if err != nil {
		if strings.Contains(err.Error(), "does not exist") {
			// Schema isn't initialised yet. Wait a few secs and retry
			log.Warnf("It appears schema isn't initialised yet, sleeping and trying again %s", err)
			time.Sleep(1 * time.Second)
			c.getTableCount()
		}
		return 0, fmt.Errorf("Exception occurred when fetching row count: %v", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {

		err := rows.Scan(&count)
		if err != nil {
			return 0, fmt.Errorf("Unable to scan config record: %v", err)
		}
	}

	return count, nil
}

func (c *ConsoleConfigRepository) getTableCount() (int, error) {
	return c.getCount(getTableCount)
}
