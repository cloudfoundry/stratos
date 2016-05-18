package datastore

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildConnStrNoSSL(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfigNoSSL = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
	}

	connParams, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
	assert.NoError(err)

	connStr := buildConnectionString(connParams)
	expected := `user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=5 sslmode=disable`
	assert.Equal(connStr, expected)

	sslCert := "sslcert"
	assert.NotContains(connStr, sslCert, fmt.Sprintf("Connection string does not contain '%v'", sslCert))
	sslCert = "sslkey"
	assert.NotContains(connStr, sslCert, fmt.Sprintf("Connection string does not contain '%v'", sslCert))
	sslCert = "sslrootcert"
	assert.NotContains(connStr, sslCert, fmt.Sprintf("Connection string does not contain '%v'", sslCert))
}

func TestBuildConnStrNoSSLDefaultTimeout(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfigNoSSL = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 0,
	}

	connParams, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
	assert.NoError(err)

	connStr := buildConnectionString(connParams)
	expected := `user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=10 sslmode=disable`

	assert.Equal(connStr, expected)
}

func TestBuildConnStrSSL(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfigSSL = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	connParams, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
	assert.NoError(err)

	connStr := buildConnectionString(connParams)
	expected := `user='user1' password='foobar' dbname='mydb' host=localhost port=5432 connect_timeout=5 sslmode=disable sslcert='ssl-certificate-related-stuff' sslkey='ssl-key-related-stuff' sslrootcert='ssl-root-certificate-related-stuff'`
	assert.Equal(connStr, expected)
}

func TestMissingUsername(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestMissingPassword(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "",
		Database:                "mydb",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestMissingDatabase(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "",
		Host:                    "localhost",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestMissingHost(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "",
		Port:                    5432,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestPortBelow1(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "myhost",
		Port:                    0,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestPortAbove65535(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "myhost",
		Port:                    65536,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: 5,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}

func TestConnectionTimeoutLessThanZero(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username:                "user1",
		Password:                "foobar",
		Database:                "mydb",
		Host:                    "myhost",
		Port:                    65535,
		SSLMode:                 "disable",
		ConnectionTimeoutInSecs: -1,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	dc, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.NoError(err)
	assert.Equal(dc.ConnectionTimeoutInSecs, 10)
}

func TestBadSSLMode(t *testing.T) {
	assert := assert.New(t)

	var mockDatabaseConfig = DatabaseConfig{
		Username: "user1",
		Password: "foobar",
		Database: "mydb",
		Host:     "myhost",
		Port:     65535,
		ConnectionTimeoutInSecs: 0,
		SSLCertificate:          "ssl-certificate-related-stuff",
		SSLKey:                  "ssl-key-related-stuff",
		SSLRootCertificate:      "ssl-root-certificate-related-stuff",
	}

	_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfig)
	assert.Error(err)
}
