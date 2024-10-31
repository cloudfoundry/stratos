package datastore

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/custom_errors"
	"github.com/samber/lo"

	goosedbversion "github.com/cloudfoundry/stratos/src/jetstream/repository/goose-db-version"
	"github.com/govau/cf-common/env"
	log "github.com/sirupsen/logrus"

	// Mysql driver
	_ "github.com/go-sql-driver/mysql"
	"github.com/kat-co/vala"

	// Sqlite driver
	_ "github.com/mattn/go-sqlite3"

	"github.com/pressly/goose"
)

const (
	// SQLite DB Provider
	SQLITE string = "sqlite"
	// PGSQL DB Provider
	PGSQL = "pgsql"
	// MYSQL DB Provider
	MYSQL = "mysql"

	// TimeoutBoundary is the max time in minutes to wait for the DB Schema to be initialized
	TimeoutBoundary = 10
)

var (
	columnNamesForCNSIsBase              = []string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "allow_sso", "sub_type", "meta_data", "creator", "ca_cert"}
	columnNamesForTokensBase             = []string{"token_guid", "auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token", "enabled"}
	columnNamesForConnectedEndpointsBase = append(append(GetColumnNamesForCSNIs("meta_data"), []string{"account", "endpoint_metadata"}...), columnNamesForTokensBase...)
	columnNamesForVersionsBase           = []string{"version_id"}
)

func GetColumnNamesForCSNIs(exclude ...string) []string {
	return lo.Without(columnNamesForCNSIsBase, exclude...)
}

func GetColumnNamesForTokens(exclude ...string) []string {
	return lo.Without(columnNamesForTokensBase, exclude...)
}

func GetColumnNamesForConnectedEndpoints(exclude ...string) []string {
	return lo.Without(columnNamesForConnectedEndpointsBase, exclude...)
}

func GetColumnNamesForVersions(exclude ...string) []string {
	return lo.Without(columnNamesForVersionsBase, exclude...)
}

func GetColumnNames(databaseName string, exclude ...string) []string {
	switch databaseName {
	case "cnsis":
		return lo.Without(columnNamesForCNSIsBase, exclude...)
	case "tokens":
		return lo.Without(columnNamesForTokensBase, exclude...)
	case "versions":
		return lo.Without(columnNamesForVersionsBase, exclude...)
	default:
		panic("Unknown database name")
	}
}

// DatabaseConfig represents the connection configuration parameters
type DatabaseConfig struct {
	DatabaseProvider        string `configName:"DATABASE_PROVIDER"`
	Username                string `configName:"DB_USER"`
	Password                string `configName:"DB_PASSWORD"`
	Database                string `configName:"DB_DATABASE_NAME"`
	Host                    string `configName:"DB_HOST"`
	Port                    int    `configName:"DB_PORT"`
	SSLMode                 string `configName:"DB_SSL_MODE"`
	ConnectionTimeoutInSecs int    `configName:"DB_CONNECT_TIMEOUT_IN_SECS"`
	SSLCertificate          string `configName:"DB_CERT"`
	SSLKey                  string `configName:"DB_CERT_KEY"`
	SSLRootCertificate      string `configName:"DB_ROOT_CERT"`
}

// SSLValidationMode is the PostgreSQL driver SSL validation modes
type SSLValidationMode string

const (
	// PGSQL SSL Modes
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
	SQLiteDatabaseFile = "console-database.db"
	// DefaultDatabaseProvider is the efault database provider when not specified
	DefaultDatabaseProvider = MYSQL
)

const (
	// UniqueConstraintViolation is the error code for a unique constraint violation
	UniqueConstraintViolation = 23505

	// DefaultConnectionTimeout is the default to timeout on connections
	DefaultConnectionTimeout = 10
)

// NewDatabaseConnectionParametersFromConfig setup database connection parameters based on contents of config struct
func NewDatabaseConnectionParametersFromConfig(dc DatabaseConfig) (DatabaseConfig, error) {

	if len(dc.DatabaseProvider) == 0 {
		dc.DatabaseProvider = DefaultDatabaseProvider
	}

	// set default for connection timeout if necessary
	if dc.ConnectionTimeoutInSecs <= 0 {
		dc.ConnectionTimeoutInSecs = DefaultConnectionTimeout
	}

	// No configuration needed for SQLite
	if dc.DatabaseProvider == SQLITE {
		return dc, nil
	}

	// Database Config validation - check required values and the SSL Mode
	err := validateRequiredDatabaseParams(dc.Username, dc.Password, dc.Database, dc.Host, dc.Port)
	if err != nil {
		return dc, err
	}

	if dc.DatabaseProvider == PGSQL {
		if dc.SSLMode == string(SSLDisabled) || dc.SSLMode == string(SSLRequired) ||
			dc.SSLMode == string(SSLVerifyCA) || dc.SSLMode == string(SSLVerifyFull) {
			return dc, nil
		}
		// Invalid SSL mode
		return dc, fmt.Errorf("invalid SSL mode: %s", dc.SSLMode)
	} else if dc.DatabaseProvider == MYSQL {
		// Map default of disabled to false for MySQL
		if dc.SSLMode == "disable" {
			dc.SSLMode = "false"
		}
		if dc.SSLMode == "true" || dc.SSLMode == "false" || dc.SSLMode == "skip-verify" || dc.SSLMode == "preferred" {
			return dc, nil
		}
		// Invalid SSL mode
		return dc, fmt.Errorf("invalid SSL mode: %s", dc.SSLMode)
	}
	return dc, fmt.Errorf("invalid provider %v", dc)
}

func validateRequiredDatabaseParams(username, password, database, host string, port int) (err error) {
	log.Debug("validateRequiredDatabaseParams")

	err = vala.BeginValidation().Validate(
		vala.IsNotNil(username, "username"),
		vala.IsNotNil(password, "password"),
		vala.IsNotNil(database, "database name"),
		vala.IsNotNil(host, "host/hostname"),
		vala.GreaterThan(port, 0, "port"),
		vala.Not(vala.GreaterThan(port, 65535, "port")),
	).Check()

	if err != nil {
		return err
	}
	return nil
}

// GetConnection returns a database connection to either MySQL, PostgreSQL or SQLite
func GetConnection(dc DatabaseConfig, env *env.VarSet) (*sql.DB, error) {
	log.Debug("GetConnection")
	db, err := NewGooseDBConf(dc, env)

	return db, err
}

// GetInMemorySQLLiteConnection returns an SQLite DB Connection
func GetInMemorySQLLiteConnection() (*sql.DB, error) {

	databaseFile := "file::memory:?cache=shared"
	log.Info("Using In Memory Database file")
	db, err := sql.Open("sqlite3", databaseFile)
	if err != nil {
		return nil, err
	}

	goose.SetDialect("sqlite3")

	err = ApplyMigrations(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}

// NewGooseDBConf creates a new Goose config for database migrations
func NewGooseDBConf(dc DatabaseConfig, env *env.VarSet) (*sql.DB, error) {

	var openStr, name string

	if dc.DatabaseProvider == PGSQL {
		name = "postgres"
		openStr = buildConnectionString(dc)
	} else if dc.DatabaseProvider == MYSQL {
		name = "mysql"
		openStr = buildConnectionStringForMysql(dc)
	} else {
		name = "sqlite3"
		sqlDbDir := env.String("SQLITE_DB_DIR", ".")
		openStr = path.Join(sqlDbDir, SQLiteDatabaseFile)
		sqliteKeepDB := env.MustBool("SQLITE_KEEP_DB")
		log.Infof("SQLite Database file: %s", openStr)

		if !sqliteKeepDB {
			os.Remove(openStr)
		}
	}

	goose.SetDialect(name)
	db, err := sql.Open(name, openStr)

	return db, err
}

func buildConnectionString(dc DatabaseConfig) string {
	log.Debug("buildConnectionString")
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

func buildConnectionStringForMysql(dc DatabaseConfig) string {
	log.Debug("buildConnectionStringForMysql")
	escapeStr := func(in string) string {
		return strings.Replace(in, `'`, `\'`, -1)
	}

	connStr := fmt.Sprintf("%s:%%s@tcp(%s:%d)/%s?parseTime=true",
		escapeStr(dc.Username),
		dc.Host,
		dc.Port,
		escapeStr(dc.Database))

	if len(dc.SSLMode) > 0 {
		log.Infof("Setting SSL Mode for mysql: %s", dc.SSLMode)
		connStr = fmt.Sprintf("%s&tls=%s", connStr, dc.SSLMode)
	}
	log.Infof(connStr, "*********")
	return fmt.Sprintf(connStr, escapeStr(dc.Password))
}

// Ping - ping the database to ensure the connection/pool works.
func Ping(db *sql.DB) error {
	log.Debug("Ping database")
	err := db.Ping()
	if err != nil {
		return fmt.Errorf("unable to ping the database: %+v", err)
	}

	return nil
}

// ModifySQLStatement - Modify the given DB statement for the specified provider, as appropraite
// e.g Postgres uses $1, $2 etc
// SQLite uses ?
func ModifySQLStatement(sql string, databaseProvider string) string {
	if databaseProvider == SQLITE || databaseProvider == MYSQL {
		sqlParamReplace := regexp.MustCompile(`\$[0-9]+`)
		return sqlParamReplace.ReplaceAllString(sql, "?")
	}

	// Default is to return the SQL provided directly
	return sql
}

// WaitForMigrations will wait until all migrations have been applied
func WaitForMigrations(db *sql.DB) error {
	migrations, err := goose.CollectMigrations(".", minVersion, maxVersion)
	if err != nil {
		return err
	}

	targetVersion, err := migrations.Last()
	if err != nil {
		return err
	}

	// Timeout after which we will give up
	timeout := time.Now().Add(time.Minute * TimeoutBoundary)

	for {
		dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(db)
		databaseVersionRec, err := dbVersionRepo.GetCurrentVersion()
		if err != nil {
			var errorMsg = err.Error()
			if errors.Is(err, custom_errors.ErrNoSuchTable) {
				errorMsg = "Waiting for versions table to be created"
			} else if errors.Is(err, custom_errors.ErrNoDatabaseVersionsFound) {
				errorMsg = "Versions table is empty - waiting for migrations"
			}
			log.Infof("Database schema check: %s", errorMsg)
		} else if databaseVersionRec.VersionID == targetVersion.Version {
			log.Infof("Database schema is up to date (%d)", databaseVersionRec.VersionID)
			break
		} else {
			log.Info("Waiting for database schema to be initialized")
		}

		// If our timeout boundary has been exceeded, bail out
		if time.Until(timeout) < 0 {
			// If we timed out and the last request was a db error, show the error
			if err != nil {
				log.Error(err)
			}
			return fmt.Errorf("timed out waiting for database schema to be initialized")
		}

		time.Sleep(3 * time.Second)
	}

	return nil
}
