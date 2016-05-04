package mysql

import (
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"strings"

	"database/sql"
  _ "github.com/go-sql-driver/mysql"
)

type MysqlConnectionParameters struct {
  Username            string
	Password            string
  Protocol            string
  Address             string
	Port								int
  Database						string
}

const (
	// The environment variable with the MySQL username
	MYSQLUsername = "MYSQL_USERNAME"
	// The environment variable with the MySQL password
	MYSQLPasswordFile = "MYSQL_PASSWORDFILE"
	// The environment variable with the MySQL protocol
	MYSQLProtocol = "MYSQL_PROTOCOL"
	// The environment variable with the MySQL IP address or URL
	MYSQLAddress = "MYSQL_ADDRESS"
	// The environment variable with the MySQL port (3306)
	MYSQLPort = "MYSQL_PORT"
	// The environment variable with the MySQL database name
	MYSQLDatabase = "MYSQL_DATABASE"
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

// NewMysqlConnectionParametersFromEnvironment discovers MySQL connection parameters from environment variables
func NewMySQLConnectionParametersFromEnvironment() (MysqlConnectionParameters, error) {
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

	result := MysqlConnectionParameters{}
	var err error

	username := strings.TrimSpace(os.Getenv(MYSQLUsername))
	passwordFile := strings.TrimSpace(os.Getenv(MYSQLPasswordFile))
	protocol := strings.TrimSpace(os.Getenv(MYSQLProtocol))
	address := strings.TrimSpace(os.Getenv(MYSQLAddress))
	port := strings.TrimSpace(os.Getenv(MYSQLPort))
	database := strings.TrimSpace(os.Getenv(MYSQLDatabase))

	if username == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLUsername}
	}

	if passwordFile == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLPasswordFile}
	}
	if !exists(passwordFile) {
		return MysqlConnectionParameters{}, &BadEnvVarError{EnvVar: MYSQLPasswordFile, Reason: "File does not exist or is not accessible"}
	}

	if protocol == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLProtocol}
	}

	if address == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLAddress}
	}

	if port == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLPort}
	}

	if database == "" {
		return MysqlConnectionParameters{}, &MissingEnvVarError{EnvVar: MYSQLDatabase}
	}

	result.Username = username
	result.Password, err = readFile(passwordFile)
	if err != nil {
		return MysqlConnectionParameters{}, &BadEnvVarError{EnvVar: MYSQLPasswordFile, Reason: "File is not readable"}
	}

	result.Protocol = protocol
	result.Address = address

	result.Port, err = strconv.Atoi(port)
	if err != nil {
		return MysqlConnectionParameters{}, &BadEnvVarError{EnvVar: MYSQLPort, Reason: "Not a valid integer"}
	}
	if result.Port > 65535 || result.Port < 1 {
		return MysqlConnectionParameters{}, &BadEnvVarError{EnvVar: MYSQLPort, Reason: "Must be between 1 and 65535"}
	}

	result.Database = database

	return result, nil
}


// GetConnection returns a database connection to MySQL
func GetConnection(connParams MysqlConnectionParameters) (*sql.DB, error) {
	return sql.Open("mysql", buildConnectionString(connParams))
}

// Format of the connection string for mysql:
// [username[:password]@][protocol[(address)]]/dbname[?param1=value1&...&paramN=valueN]
func buildConnectionString(connParams MysqlConnectionParameters) string {
	connStr := fmt.Sprintf("%s:%s@%s(%s:%d)/%s",
		connParams.Username,
		connParams.Password,
		connParams.Protocol,
		connParams.Address,
		connParams.Port,
		connParams.Database)

	return connStr
}
