package datastore

import (
	"bufio"
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"

	log "github.com/Sirupsen/logrus"
	"github.com/kat-co/vala"
	// SQL Lite 3
	_ "github.com/mattn/go-sqlite3"
)

// DatabaseConfig represents the connection configuration parameters
type DatabaseConfig struct {
	DatabaseProvider        string `configName:"DATABASE_PROVIDER"`
	Username                string `configName:"PGSQL_USER"`
	Password                string `configName:"PGSQL_PASSWORD"`
	Database                string `configName:"PGSQL_DATABASE"`
	Host                    string `configName:"PGSQL_HOST"`
	Port                    int    `configName:"PGSQL_PORT"`
	SSLMode                 string `configName:"PGSQL_SSL_MODE"`
	ConnectionTimeoutInSecs int    `configName:"PGSQL_CONNECT_TIMEOUT_IN_SECS"`
	SSLCertificate          string `configName:"PGSQL_CERT"`
	SSLKey                  string `configName:"PGSQL_CERT_KEY"`
	SSLRootCertificate      string `configName:"PGSQL_ROOT_CERT"`
}

// SSLValidationMode is the PostgreSQL driver SSL validation modes
type SSLValidationMode string

const (
	// SSLDisabled means no checking of SSL
	SSLDisabled SSLValidationMode = "disable"
	// SSLRequired requires SSL without validation
	SSLRequired SSLValidationMode = "require"
	// SSLVerifyCA verifies the CA certificate
	SSLVerifyCA SSLValidationMode = "verify-ca"
	// SSLVerifyFull verifies the certificate and hostname and the CA
	SSLVerifyFull SSLValidationMode = "verify-full"
	// SQLiteSchemaFile - SQLite schema file
	SQLiteSchemaFile = "./deploy/db/sqlite_schema.sql"
	// SQLiteDatabaseFile - SQLite database file
	SQLiteDatabaseFile = "./console-database.db"
	// Default database provider when not specified
	DefaultDatabaseProvider = "pgsql"
)

const (
	// UniqueConstraintViolation is the error code for a unique constraint violation
	UniqueConstraintViolation = 23505

	// DefaultConnectionTimeout is the default to timeout on connections
	DefaultConnectionTimeout = 10
)

// NewDatabaseConnectionParametersFromConfig setup database connection parameters based on contents of config struct
func NewDatabaseConnectionParametersFromConfig(dc DatabaseConfig) (DatabaseConfig, error) {
	log.Println("NewDatabaseConnectionParametersFromConfig")

	if len(dc.DatabaseProvider) == 0 {
		dc.DatabaseProvider = DefaultDatabaseProvider
	}

	// set default for connection timeout if necessary
	if dc.ConnectionTimeoutInSecs <= 0 {
		dc.ConnectionTimeoutInSecs = DefaultConnectionTimeout
	}

	// No configuration needed for SQLite
	if dc.DatabaseProvider == "sqlite" {
		return dc, nil
	}

	// Database Config validation - check requried values and the SSL Mode

	err := validateRequiredDatabaseParams(dc.Username, dc.Password, dc.Database, dc.Host, dc.Port)
	if err != nil {
		return dc, err
	}

	if dc.SSLMode == string(SSLDisabled) || dc.SSLMode == string(SSLRequired) ||
		dc.SSLMode == string(SSLVerifyCA) || dc.SSLMode == string(SSLVerifyFull) {
		return dc, nil
	}

	return dc, fmt.Errorf("Invalid SSL mode: %v", dc.SSLMode)
}

func validateRequiredDatabaseParams(username, password, database, host string, port int) (err error) {
	log.Println("validateRequiredDatabaseParams")

	err = vala.BeginValidation().Validate(
		vala.IsNotNil(username, "username"),
		vala.IsNotNil(password, "password"),
		vala.IsNotNil(database, "database"),
		vala.IsNotNil(host, "host"),
		vala.GreaterThan(port, 0, "port"),
		vala.Not(vala.GreaterThan(port, 65535, "port")),
	).Check()

	if err != nil {
		return err
	}
	return nil
}

// GetConnection returns a database connection to either PostgreSQL or SQLite
func GetConnection(dc DatabaseConfig) (*sql.DB, error) {
	log.Debug("GetConnection")

	if dc.DatabaseProvider == "pgsql" {
		return sql.Open("postgres", buildConnectionString(dc))
	}

	// SQL Lite
	return GetSQLLiteConnection()
}

func GetSQLLiteConnection() (*sql.DB, error) {

	if !config.IsSet("SQLITE_KEEP_DB") {
		os.Remove(SQLiteDatabaseFile)
	}

	db, err := sql.Open("sqlite3", SQLiteDatabaseFile)
	if err != nil {
		return db, err
	}

	// Need to initialize the schema of the SQLite Database
	file, err := os.Open(SQLiteSchemaFile)
	if err != nil {
		log.Warn("Can not find the schema file for database initialization")
		return db, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var statement = ""
	var counter = 1
	for scanner.Scan() {
		line := scanner.Text()
		line = strings.TrimSpace(line)

		if strings.Index(line, "--") != 0 && len(line) > 0 {
			// not a comment or an empty line
			statement += line
			if strings.HasSuffix(line, ";") {
				// This is the end of the statement
				_, err = db.Exec(statement)
				if err != nil {
					log.Errorf("Failed to execute statement #%d: %s", counter, err)
					return db, err
				}
				statement = ""
				counter++
			}
		}
	}

	err = scanner.Err()
	if err == nil {
		log.Info("Created database schema for SQLite database")
	}
	return db, err
}

func buildConnectionString(dc DatabaseConfig) string {
	log.Println("buildConnectionString")
	escapeStr := func(in string) string {
		return strings.Replace(in, `'`, `\'`, -1)
	}

	connStr := fmt.Sprintf("user='%s' password='%s' dbname='%s' host='%s' port=%d connect_timeout=%d",
		escapeStr(dc.Username),
		escapeStr(dc.Password),
		escapeStr(dc.Database),
		dc.Host,
		dc.Port,
		dc.ConnectionTimeoutInSecs)

	if dc.SSLMode != "" {
		connStr = connStr + fmt.Sprintf(" sslmode='%s'", dc.SSLMode)
	}

	if dc.SSLCertificate != "" {
		connStr = connStr + fmt.Sprintf(" sslcert='%s'", escapeStr(dc.SSLCertificate))
	}

	if dc.SSLKey != "" {
		connStr = connStr + fmt.Sprintf(" sslkey='%s'", escapeStr(dc.SSLKey))
	}

	if dc.SSLRootCertificate != "" {
		connStr = connStr + fmt.Sprintf(" sslrootcert='%s'", escapeStr(dc.SSLRootCertificate))
	}

	log.Printf("DB Connection string: dbname='%s' host='%s' port=%d connect_timeout=%d",
		escapeStr(dc.Database),
		dc.Host,
		dc.Port,
		dc.ConnectionTimeoutInSecs)

	return connStr
}

// Ping - ping the database to ensure the connection/pool works.
func Ping(db *sql.DB) error {
	log.Debug("Ping database")
	err := db.Ping()
	if err != nil {
		return fmt.Errorf("Unable to ping the database: %+v", err)
	}

	return nil
}

// ModifySQLStatement - Modify the given DB statement for the specified provider, as appropraite
// e.g Postgres uses $1, $2 etc
// SQLite uses ?
func ModifySQLStatement(sql string, databaseProvider string) string {

	if databaseProvider == "sqlite" {
		sqlParamReplace := regexp.MustCompile("\\$[0-9]")
		return sqlParamReplace.ReplaceAllString(sql, "?")
	}

	// Default is to return the SQL provided directly
	return sql
}
