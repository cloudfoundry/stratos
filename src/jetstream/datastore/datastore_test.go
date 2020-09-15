package datastore

import (
	"errors"
	"fmt"
	// "net/url"
	"testing"
	// "time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	. "github.com/smartystreets/goconvey/convey"
)

func TestDatastore(t *testing.T) {

	var (
		mockDatabaseProvider   = "pgsql"
		mockUsername           = "user1"
		mockPassword           = "foobar"
		mockDatabase           = "mydb"
		mockHost               = "localhost"
		mockPort               = 5432
		mockSSLModeDisable     = "disable"
		mockSSLModeRequire     = "require"
		mockConnTimeout        = 5
		mockSSLCertificate     = "ssl-certificate-related-stuff"
		mockSSLKey             = "ssl-key-related-stuff"
		mockSSLRootCertificate = "ssl-root-certificate-related-stuff"
	)

	Convey("Given the requirement for a non-TLS database connection", t, func() {

		var mockDatabaseConfigNoSSL = DatabaseConfig{
			DatabaseProvider:        mockDatabaseProvider,
			Username:                mockUsername,
			Password:                mockPassword,
			Database:                mockDatabase,
			Host:                    mockHost,
			Port:                    mockPort,
			SSLMode:                 mockSSLModeDisable,
			ConnectionTimeoutInSecs: mockConnTimeout,
		}

		db, _, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("when the database config is valid", func() {

			Convey("err will be nil", func() {
				_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
				So(err, ShouldBeNil)
			})

			Convey("a valid non-TLS DatabaseConfig will be returned", func() {
				dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
				So(dc, ShouldResemble, mockDatabaseConfigNoSSL)
			})

			Convey("database config can be used to build a connection string", func() {
				expectedConnString := `user='user1' password='foobar' dbname='mydb' host='localhost' port=5432 connect_timeout=5 sslmode='disable'`

				dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
				connStr := buildConnectionString(dc)
				So(connStr, ShouldEqual, expectedConnString)
			})

			Convey("connection string will not contain anything SSL related", func() {
				dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
				connStr := buildConnectionString(dc)
				So(connStr, ShouldNotContainSubstring, "sslcert")
				So(connStr, ShouldNotContainSubstring, "sslkey")
				So(connStr, ShouldNotContainSubstring, "sslrootcert")
			})

			Convey("when the connection timeout is less than zero", func() {

				expectedDefaultTimeout := 10
				mockDatabaseConfigNoSSL.ConnectionTimeoutInSecs = -1

				Convey("the default connection timeout will be set", func() {
					dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(dc.ConnectionTimeoutInSecs, ShouldEqual, expectedDefaultTimeout)
				})

				Convey("no error will be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldBeNil)
				})

				Convey("database config can be used to build a connection string", func() {
					expectedConnString := `user='user1' password='foobar' dbname='mydb' host='localhost' port=5432 connect_timeout=10 sslmode='disable'`

					dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					connStr := buildConnectionString(dc)
					So(connStr, ShouldEqual, expectedConnString)
				})

			})

			Convey("when the connection timeout is zero", func() {

				expectedDefaultTimeout := 10
				mockDatabaseConfigNoSSL.ConnectionTimeoutInSecs = 0

				Convey("the default connection timeout will be set", func() {
					dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(dc.ConnectionTimeoutInSecs, ShouldEqual, expectedDefaultTimeout)
				})

				Convey("no error will be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldBeNil)
				})
			})
		})

		Convey("when the database config is invalid", func() {

			Convey("when username is missing", func() {

				mockDatabaseConfigNoSSL.Username = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: username"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when password is missing", func() {

				mockDatabaseConfigNoSSL.Password = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: password"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when database is missing", func() {

				mockDatabaseConfigNoSSL.Database = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: database name"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when host is missing", func() {

				mockDatabaseConfigNoSSL.Host = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: host/hostname"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is 0", func() {

				mockDatabaseConfigNoSSL.Port = 0
				expectedErrorMessage := "parameter validation failed: Parameter's length was not greater than:  port(0) < 0"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is < 0", func() {

				mockDatabaseConfigNoSSL.Port = -1
				expectedErrorMessage := "parameter validation failed: Parameter's length was not greater than:  port(-1) < 0"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is > 65535", func() {

				mockDatabaseConfigNoSSL.Port = 65536
				expectedErrorMessage := "parameter validation failed: Not()"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when connection timeout is zero", func() {

				mockDatabaseConfigNoSSL.Port = 65536
				expectedErrorMessage := "parameter validation failed: Not()"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when missing ssl mode", func() {

				mockDatabaseConfigNoSSL.SSLMode = ""
				expectedErrorMessage := fmt.Sprintf("Invalid SSL mode: %s", mockDatabaseConfigNoSSL.SSLMode)

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when invalid ssl mode", func() {

				mockDatabaseConfigNoSSL.SSLMode = "ekhewjhfjk"
				expectedErrorMessage := fmt.Sprintf("Invalid SSL mode: %s", mockDatabaseConfigNoSSL.SSLMode)

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigNoSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})
		})
	})

	Convey("Given the requirement for a TLS database connection", t, func() {

		var mockDatabaseConfigSSL = DatabaseConfig{
			DatabaseProvider:        mockDatabaseProvider,
			Username:                mockUsername,
			Password:                mockPassword,
			Database:                mockDatabase,
			Host:                    mockHost,
			Port:                    mockPort,
			SSLMode:                 mockSSLModeRequire,
			ConnectionTimeoutInSecs: mockConnTimeout,
			SSLCertificate:          mockSSLCertificate,
			SSLKey:                  mockSSLKey,
			SSLRootCertificate:      mockSSLRootCertificate,
		}

		db, _, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("when the database config is valid", func() {

			Convey("err will be nil", func() {
				_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
				So(err, ShouldBeNil)
			})

			Convey("a valid non-TLS DatabaseConfig will be returned", func() {
				connStr, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
				So(connStr, ShouldResemble, mockDatabaseConfigSSL)
			})

			Convey("database config can be used to build a connection string", func() {
				expectedConnString := `user='user1' password='foobar' dbname='mydb' host='localhost' port=5432 connect_timeout=5 sslmode='require' sslcert='ssl-certificate-related-stuff' sslkey='ssl-key-related-stuff' sslrootcert='ssl-root-certificate-related-stuff'`

				dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
				connStr := buildConnectionString(dc)
				So(connStr, ShouldEqual, expectedConnString)
			})

			Convey("when the connection timeout is less than zero", func() {

				expectedDefaultTimeout := 10
				mockDatabaseConfigSSL.ConnectionTimeoutInSecs = -1

				Convey("the default connection timeout will be set", func() {
					dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(dc.ConnectionTimeoutInSecs, ShouldEqual, expectedDefaultTimeout)
				})

				Convey("no error will be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldBeNil)
				})
			})

			Convey("when the connection timeout is zero", func() {

				expectedDefaultTimeout := 10
				mockDatabaseConfigSSL.ConnectionTimeoutInSecs = 0

				Convey("the default connection timeout will be set", func() {
					dc, _ := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(dc.ConnectionTimeoutInSecs, ShouldEqual, expectedDefaultTimeout)
				})

				Convey("no error will be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldBeNil)
				})
			})

		})

		Convey("when the database config is invalid", func() {

			Convey("when username is missing", func() {

				mockDatabaseConfigSSL.Username = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: username"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when password is missing", func() {

				mockDatabaseConfigSSL.Password = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: password"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when database is missing", func() {

				mockDatabaseConfigSSL.Database = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: database name"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when host is missing", func() {

				mockDatabaseConfigSSL.Host = ""
				expectedErrorMessage := "parameter validation failed: Parameter was nil: host/hostname"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is 0", func() {

				mockDatabaseConfigSSL.Port = 0
				expectedErrorMessage := "parameter validation failed: Parameter's length was not greater than:  port(0) < 0"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is < 0", func() {

				mockDatabaseConfigSSL.Port = -1
				expectedErrorMessage := "parameter validation failed: Parameter's length was not greater than:  port(-1) < 0"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when port is > 65535", func() {

				mockDatabaseConfigSSL.Port = 65536
				expectedErrorMessage := "parameter validation failed: Not()"

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when missing ssl mode", func() {

				mockDatabaseConfigSSL.SSLMode = ""
				expectedErrorMessage := fmt.Sprintf("Invalid SSL mode: %s", mockDatabaseConfigSSL.SSLMode)

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})

			Convey("when invalid ssl mode", func() {

				mockDatabaseConfigSSL.SSLMode = "jhfewhjfejwhgfj"
				expectedErrorMessage := fmt.Sprintf("Invalid SSL mode: %s", mockDatabaseConfigSSL.SSLMode)

				Convey("an error should be returned", func() {
					_, err := NewDatabaseConnectionParametersFromConfig(mockDatabaseConfigSSL)
					So(err, ShouldResemble, errors.New(expectedErrorMessage))
				})
			})
		})
	})
}
