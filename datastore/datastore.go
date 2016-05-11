package datastore

import (
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"strings"

	"database/sql"
)

// MysqlConnectionParameters -
type MysqlConnectionParameters struct {
	Username string
	Password string
	Protocol string
	Address  string
	Port     int
	Database string
}

const (
	// MYSQLUsername - The environment variable with the MySQL username
	MYSQLUsername = "MYSQL_USERNAME"
	// MYSQLPasswordFile - The environment variable with the MySQL password
	MYSQLPasswordFile = "MYSQL_PASSWORDFILE"
	// MYSQLProtocol - The environment variable with the MySQL protocol
	MYSQLProtocol = "MYSQL_PROTOCOL"
	// MYSQLAddress - The environment variable with the MySQL IP address or URL
	MYSQLAddress = "MYSQL_ADDRESS"
	// MYSQLPort - The environment variable with the MySQL port (3306)
	MYSQLPort = "MYSQL_PORT"
	// MYSQLDatabase - The environment variable with the MySQL database name
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

// NewMySQLConnectionParametersFromEnvironment -
// 		discovers MySQL connection parameters from environment variables
func NewMySQLConnectionParametersFromEnvironment() (MysqlConnectionParameters, error) {
	exists := func(filename string) bool {
		_, err := os.Lstat(filename)
		if err != nil {
			return false
		}

		return true
	}

	var result MysqlConnectionParameters
	var err error

	username := strings.TrimSpace(os.Getenv(MYSQLUsername))
	passwordFile := strings.TrimSpace(os.Getenv(MYSQLPasswordFile))
	protocol := strings.TrimSpace(os.Getenv(MYSQLProtocol))
	address := strings.TrimSpace(os.Getenv(MYSQLAddress))
	port := strings.TrimSpace(os.Getenv(MYSQLPort))
	database := strings.TrimSpace(os.Getenv(MYSQLDatabase))

	// validateConnectionVariables(username, passwordFile, protocol, address, port, database)

	if !exists(passwordFile) {
		return result, &BadEnvVarError{EnvVar: MYSQLPasswordFile, Reason: "File does not exist or is not accessible"}
	}

	result.Username = username

	pwd, err := ioutil.ReadFile(passwordFile)
	if err != nil {
		return result, &BadEnvVarError{EnvVar: MYSQLPasswordFile, Reason: "File is not readable"}
	}
	result.Password = strings.TrimSpace(string(pwd))

	result.Protocol = protocol
	result.Address = address

	result.Port, err = strconv.Atoi(port)
	if err != nil {
		return result, &BadEnvVarError{EnvVar: MYSQLPort, Reason: "Not a valid integer"}
	}
	if result.Port > 65535 || result.Port < 1 {
		return result, &BadEnvVarError{EnvVar: MYSQLPort, Reason: "Must be between 1 and 65535"}
	}

	result.Database = database

	return result, nil
}

// func validateConnectionVariables(username, passwordFile, protcol, address, port, database string) (err error) {
// 	defer func() { recover() }
// 	BeginValidation().Validate(
// 		IsNotNil(username, "Missing env variable MYSQL_USERNAME"),
// 		IsNotNil(passwordFile, "Missing env variable MYSQL_PASSWORDFILE"),
// 		IsNotNil(protocol, "Missing env variable MYSQL_PROTOCOL"),
// 		IsNotNil(address, "Missing env variable MYSQL_ADDRESS"),
// 		IsNotNil(port, "Missing env variable MYSQL_PORT"),
// 		IsNotNil(database, "Missing env variable MYSQL_DATABASE"),
// 	).CheckSetErrorAndPanic(&err) // Return error will get set, and the function will return.
// }

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
