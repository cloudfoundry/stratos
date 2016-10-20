package datastore

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"github.com/kat-co/vala"
)

// DatabaseConfig represents the connection configuration parameters
type DatabaseConfig struct {
	Username                string `ucp:"PGSQL_USER"`
	Password                string `ucp:"PGSQL_PASSWORD"`
	Database                string `ucp:"PGSQL_DATABASE"`
	Host                    string `ucp:"PGSQL_HOST"`
	Port                    int    `ucp:"PGSQL_PORT"`
	SSLMode                 string `ucp:"PGSQL_SSL_MODE"`
	ConnectionTimeoutInSecs int    `ucp:"PGSQL_CONNECT_TIMEOUT_IN_SECS"`
	SSLCertificate          string `ucp:"PGSQL_CERT"`
	SSLKey                  string `ucp:"PGSQL_CERT_KEY"`
	SSLRootCertificate      string `ucp:"PGSQL_ROOT_CERT"`
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
	err := validateRequiredDatabaseParams(dc.Username, dc.Password, dc.Database, dc.Host, dc.Port)
	if err != nil {
		return dc, err
	}

	// set default for connection timeout if necessary
	if dc.ConnectionTimeoutInSecs <= 0 {
		dc.ConnectionTimeoutInSecs = DefaultConnectionTimeout
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

// GetConnection returns a database connection to PostgreSQL
func GetConnection(dc DatabaseConfig) (*sql.DB, error) {
	log.Println("GetConnection")
	return sql.Open("postgres", buildConnectionString(dc))
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
	log.Println("Ping")
	err := db.Ping()
	if err != nil {
		return fmt.Errorf("Unable to ping the database: %+v\n", err)
	}

	return nil
}
