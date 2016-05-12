package datastore

import (
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"strings"

	"database/sql"

	_ "github.com/lib/pq"
)

// SSLValidationMode is the PostgreSQL driver SSL validation modes
type SSLValidationMode string

// PostgresConnectionParameters represents the connection configuration parameters
type PostgresConnectionParameters struct {
	Username             string
	Password             string
	Database             string
	Host                 string
	Port                 int
	SSLMode              SSLValidationMode
	ConnectionTimeoutSec int
	SSLCertificate       string
	SSLKey               string
	SSLRootCertificate   string
}

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
	// PGSQLUser is the environment variable with the PostgreSQL username
	PGSQLUser = "PGSQL_USER"
	// PGSQLPasswordFile is the environment variable with the filename of PostgreSQL password
	PGSQLPasswordFile = "PGSQL_PASSWORD_FILE"
	// PGSQLDatabase is the environment variable with the PostgreSQL database name
	PGSQLDatabase = "PGSQL_DATABASE"
	// PGSQLHost is the environment variable with the PostgreSQL hostname
	PGSQLHost = "PGSQL_HOST"
	// PGSQLPort is the environment variable with the PostgreSQL port number
	PGSQLPort = "PGSQL_PORT"
	// PGSQLSSLMode is the environment variable with the PostgreSQL SSL mode to enforce
	PGSQLSSLMode = "PGSQL_SSL_MODE"
	// PGSQLCertificateFile is the environment variable with the PostgreSQL public certificate file
	PGSQLCertificateFile = "PGSQL_CERTIFICATE_FILE"
	// PGSQLKeyFile is the environment variable with the PostgreSQL private key file
	PGSQLKeyFile = "PGSQL_KEY_FILE"
	// PGSQLRootCertificateFile is the environment variable with the PostgreSQL public root CA certificate file
	PGSQLRootCertificateFile = "PGSQL_ROOT_CERTIFICATE_FILE"
	// PGSQLConnectionTimeout max time in seconds to wait
	PGSQLConnectionTimeout = "PGSQL_CONNECTION_TIMEOUT"

	// UniqueConstraintViolation is the error code for a unique constraint violation
	UniqueConstraintViolation = "23505"

	// DefaultConnectionTimeout is the default to timeout on connections
	DefaultConnectionTimeout = "10"
)

// MissingEnvVarError represents a missing environment variable
type MissingEnvVarError struct {
	EnvVar string
}

// Error returns a string explaining the missing variable
func (m *MissingEnvVarError) Error() string {
	return fmt.Sprintf("Environment variable %s required but not provided", m.EnvVar)
}

// BadEnvVarError represents a bad environment variable
type BadEnvVarError struct {
	EnvVar string
	Reason string
}

// Error returns a string explaining the bad variable
func (b *BadEnvVarError) Error() string {
	return fmt.Sprintf("Environment variable %s value cannot be used, reason: %s", b.EnvVar, b.Reason)
}

// NewPostgresConnectionParametersFromEnvironment discovers PostgreSQL connection parameters from environment variables
func NewPostgresConnectionParametersFromEnvironment(prefix string) (PostgresConnectionParameters, error) {
	exists := func(filename string) bool {
		_, err := os.Lstat(filename)
		if err != nil {
			return false
		}

		return true
	}

	readFile := func(filename string) (string, error) {
		b, err := ioutil.ReadFile(filename)
		if err != nil {
			return "", err
		}

		return strings.TrimSpace(string(b)), nil
	}

	result := PostgresConnectionParameters{}
	var err error

	username := strings.TrimSpace(os.Getenv(prefix + PGSQLUser))
	passwordFile := strings.TrimSpace(os.Getenv(prefix + PGSQLPasswordFile))
	database := strings.TrimSpace(os.Getenv(prefix + PGSQLDatabase))
	host := strings.TrimSpace(os.Getenv(prefix + PGSQLHost))
	port := strings.TrimSpace(os.Getenv(prefix + PGSQLPort))
	sslMode := strings.TrimSpace(os.Getenv(prefix + PGSQLSSLMode))
	sslCert := strings.TrimSpace(os.Getenv(prefix + PGSQLCertificateFile))
	sslKey := strings.TrimSpace(os.Getenv(prefix + PGSQLKeyFile))
	sslRootCert := strings.TrimSpace(os.Getenv(prefix + PGSQLRootCertificateFile))
	connectionTimeout := strings.TrimSpace(os.Getenv(prefix + PGSQLConnectionTimeout))

	if username == "" {
		return PostgresConnectionParameters{}, &MissingEnvVarError{EnvVar: prefix + PGSQLUser}
	}

	if passwordFile == "" {
		return PostgresConnectionParameters{}, &MissingEnvVarError{EnvVar: prefix + PGSQLPasswordFile}
	}

	if !exists(passwordFile) {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLPasswordFile, Reason: "File does not exist or is not accessible"}
	}

	if database == "" {
		return PostgresConnectionParameters{}, &MissingEnvVarError{EnvVar: prefix + PGSQLDatabase}
	}

	if host == "" {
		return PostgresConnectionParameters{}, &MissingEnvVarError{EnvVar: prefix + PGSQLHost}
	}

	if port == "" {
		return PostgresConnectionParameters{}, &MissingEnvVarError{EnvVar: prefix + PGSQLPort}
	}

	if connectionTimeout == "" {
		connectionTimeout = DefaultConnectionTimeout
	}

	result.Username = username
	result.Database = database
	result.Password, err = readFile(passwordFile)
	if err != nil {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLPasswordFile, Reason: "File is not readable"}
	}

	result.Host = host
	result.Port, err = strconv.Atoi(port)
	if err != nil {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLPort, Reason: "Not a valid integer"}
	}

	if result.Port > 65535 || result.Port < 1 {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLPort, Reason: "Must be between 1 and 65535"}
	}

	result.ConnectionTimeoutSec, err = strconv.Atoi(connectionTimeout)
	if err != nil {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLConnectionTimeout, Reason: "Not a valid integer"}
	}

	if result.ConnectionTimeoutSec < 0 {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLConnectionTimeout, Reason: "Must be >= 0"}
	}

	if sslMode == string(SSLDisabled) || sslMode == string(SSLRequired) || sslMode == string(SSLVerifyCA) || sslMode == string(SSLVerifyFull) {
		result.SSLMode = SSLValidationMode(sslMode)
		if sslMode != string(SSLDisabled) {
			if sslCert != "" && !exists(sslCert) {
				return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLCertificateFile, Reason: "File does not exist or is not accessible"}
			}

			if sslKey != "" && !exists(sslKey) {
				return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLKeyFile, Reason: "File does not exist or is not accessible"}
			}

			if sslRootCert != "" && !exists(sslRootCert) {
				return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLRootCertificateFile, Reason: "File does not exist or is not accessible"}
			}

			result.SSLCertificate = sslCert
			result.SSLKey = sslKey
			result.SSLRootCertificate = sslRootCert
		}
	} else if sslMode != "" {
		return PostgresConnectionParameters{}, &BadEnvVarError{EnvVar: prefix + PGSQLSSLMode, Reason: "Invalid SSL mode"}
	}

	return result, nil
}

// GetConnection returns a database connection to PostgreSQL
func GetConnection(connParams PostgresConnectionParameters) (*sql.DB, error) {
	return sql.Open("postgres", buildConnectionString(connParams))
}

func buildConnectionString(connParams PostgresConnectionParameters) string {
	escapeStr := func(in string) string {
		return strings.Replace(in, `'`, `\'`, -1)
	}

	connStr := fmt.Sprintf("user='%s' password='%s' dbname='%s' host=%s port=%d connect_timeout=%d",
		escapeStr(connParams.Username),
		escapeStr(connParams.Password),
		escapeStr(connParams.Database),
		connParams.Host,
		connParams.Port,
		connParams.ConnectionTimeoutSec)

	if connParams.SSLMode != "" {
		connStr = connStr + fmt.Sprintf(" sslmode=%s", connParams.SSLMode)
	}

	if connParams.SSLCertificate != "" {
		connStr = connStr + fmt.Sprintf(" sslcert='%s'", escapeStr(connParams.SSLCertificate))
	}

	if connParams.SSLKey != "" {
		connStr = connStr + fmt.Sprintf(" sslkey='%s'", escapeStr(connParams.SSLKey))
	}

	if connParams.SSLRootCertificate != "" {
		connStr = connStr + fmt.Sprintf(" sslrootcert='%s'", escapeStr(connParams.SSLRootCertificate))
	}

	return connStr
}
