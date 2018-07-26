package datastore

import (
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/SUSE/stratos-ui/config"

	log "github.com/Sirupsen/logrus"
	// Mysql driver
	_ "github.com/go-sql-driver/mysql"
	"github.com/kat-co/vala"
	// Sqlite driver
	_ "github.com/mattn/go-sqlite3"

	"bitbucket.org/liamstask/goose/lib/goose"
)

const (
	// SQLite DB Provider
	SQLITE string = "sqlite"
	// PGSQL DB Provider
	PGSQL = "pgsql"
	// MYSQL DB Provider
	MYSQL = "mysql"
)

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

	// Database Config validation - check requried values and the SSL Mode

	err := validateRequiredDatabaseParams(dc.Username, dc.Password, dc.Database, dc.Host, dc.Port)
	if err != nil {
		return dc, err
	}

	if dc.DatabaseProvider == PGSQL {
		if dc.SSLMode == string(SSLDisabled) || dc.SSLMode == string(SSLRequired) ||
			dc.SSLMode == string(SSLVerifyCA) || dc.SSLMode == string(SSLVerifyFull) {
			return dc, nil
		} else {
			// Invalid SSL mode
			return dc, fmt.Errorf("Invalid SSL mode: %s", dc.SSLMode)
		}
	} else if dc.DatabaseProvider == MYSQL {
		return dc, nil
	}
	return dc, fmt.Errorf("Invalid provider %v", dc)
}

func validateRequiredDatabaseParams(username, password, database, host string, port int) (err error) {
	log.Debug("validateRequiredDatabaseParams")

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

	if dc.DatabaseProvider == PGSQL {
		return sql.Open("postgres", buildConnectionString(dc))
	}

	if dc.DatabaseProvider == MYSQL {
		return sql.Open("mysql", buildConnectionStringForMysql(dc))

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
		return nil, err
	}

	// Create fake goose db conf object for SQLite
	d := goose.DBDriver{
		Name:    "sqlite3",
		Import:  "github.com/mattn/go-sqlite3",
		Dialect: &goose.Sqlite3Dialect{},
	}

	conf := &goose.DBConf{
		Driver: d,
	}

	err = ApplyMigrations(conf, db)
	if err != nil {
		return nil, err
	}

	return db, nil
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
	log.Debug("buildConnectionString")
	escapeStr := func(in string) string {
		return strings.Replace(in, `'`, `\'`, -1)
	}

	connStr := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true",
		escapeStr(dc.Username),
		escapeStr(dc.Password),
		dc.Host,
		dc.Port,
		escapeStr(dc.Database))

	log.Printf("DB Connection string: %s:*********@tcp(%s:%d)/%s?parseTime=true",
		escapeStr(dc.Username),
		dc.Host,
		dc.Port,
		escapeStr(dc.Database))

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
	if databaseProvider == SQLITE || databaseProvider == MYSQL {
		sqlParamReplace := regexp.MustCompile("\\$[0-9]+")
		return sqlParamReplace.ReplaceAllString(sql, "?")
	}

	// Default is to return the SQL provided directly
	return sql
}
