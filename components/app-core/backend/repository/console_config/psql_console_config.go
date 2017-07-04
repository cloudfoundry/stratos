package console_config

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	"github.com/SUSE/stratos-ui/components/app-core/backend/datastore"

	log "github.com/Sirupsen/logrus"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

var getConsoleConfig = `SELECT uaa_endpoint, console_admin_role, console_client, console_client_secret, skip_ssl_validation
							FROM console_config`

var saveConsoleConfig = `INSERT INTO console_config (uaa_endpoint, console_admin_role, console_client, console_client_secret, skip_ssl_validation)
						VALUES ($1, $2, $3, $4, $5)`

var getTableCount = `SELECT count(uaa_endpoint) FROM console_config`

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
}

// ListByUser - Returns a list of CNSIs registered by a user
func (c *ConsoleConfigRepository) GetConsoleConfig() (*interfaces.ConsoleConfig, error) {
	log.Println("Get ConsoleConfig")
	rows, err := c.db.Query(getConsoleConfig)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve console config record: %v", err)
	}
	defer rows.Close()

	rowCount := 0;

	var consoleConfig *interfaces.ConsoleConfig
	for rows.Next() {
		var (
			authEndpoint string
		)
		rowCount++;
		if rowCount > 1 {
			return nil, errors.New("Multiple configuration data detected!")
		}

		consoleConfig = new(interfaces.ConsoleConfig)
		err := rows.Scan(&authEndpoint, &consoleConfig.ConsoleAdminRole, &consoleConfig.ConsoleClient,
			&consoleConfig.ConsoleClientSecret, &consoleConfig.SkipSSLValidation)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan config record: %v", err)
		}

		if consoleConfig.UAAEndpoint, err = url.Parse(authEndpoint); err != nil {
			return nil, fmt.Errorf("Unable to parse UAA Endpoint: %v", err)
		}
	}

	return consoleConfig, nil
}
// Save - Persist a CNSI Record to a datastore
func (c *ConsoleConfigRepository) SaveConsoleConfig(config *interfaces.ConsoleConfig) error {
	log.Printf("Saving ConsoleConfig: %+v", config)
	if _, err := c.db.Exec(saveConsoleConfig, fmt.Sprintf("%s", config.UAAEndpoint),
		config.ConsoleAdminRole, config.ConsoleClient, config.ConsoleClientSecret, config.SkipSSLValidation); err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}

func (c *ConsoleConfigRepository) IsInitialised() (bool, error) {
	rows, err := c.db.Query(getTableCount)
	defer rows.Close()

	if err != nil {
		return false, fmt.Errorf("Exception occurred when fetching row count: %v", err)
	}

	count := 0
	for rows.Next() {

		err := rows.Scan(&count)
		if err != nil {
			return false, fmt.Errorf("Unable to scan config record: %v", err)
		}
	}

	return count == 1, nil
}

