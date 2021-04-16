package cnsis

import (
	"errors"
	"fmt"
	"net/url"
	"testing"
	"time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	. "github.com/smartystreets/goconvey/convey"
)

func TestPgSQLCNSIs(t *testing.T) {

	var (
		mockCFGUID          = "some-cf-guid-1234"
		mockCEGUID          = "some-hce-guid-1234"
		mockAPIEndpoint     = "https://api.127.0.0.1"
		mockAuthEndpoint    = "https://login.127.0.0.1"
		mockDopplerEndpoint = "https://doppler.127.0.0.1"
		mockClientId        = "stratos_clientid"
		mockClientSecret    = "stratos_secret"
		unknownDBError      = "Unknown Database Error"

		selectAnyFromCNSIs           = `SELECT (.+) FROM cnsis`
		selectFromCNSIsWhere         = `SELECT (.+) FROM cnsis WHERE (.+)`
		selectFromCNSIandTokensWhere = `SELECT (.+) FROM cnsis c, tokens t WHERE (.+) AND t.disconnected = '0'`
		insertIntoCNSIs              = `INSERT INTO cnsis`
		deleteFromCNSIs              = `DELETE FROM cnsis WHERE (.+)`
		rowFieldsForCNSI             = []string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint",
			"token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "sso_allowed", "sub_type", "meta_data", "creator"}
		mockEncryptionKey = make([]byte, 32)
	)
	cipherClientSecret, _ := crypto.EncryptToken(mockEncryptionKey, mockClientSecret)

	Convey("Given a request for a new reference to a CNSI Repository", t, func() {
		db, _, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("A valid CNSI Repository should be returned without error.", func() {
			repository, err := NewPostgresCNSIRepository(db)
			So(repository, ShouldHaveSameTypeAs, &PostgresCNSIRepository{})
			So(err, ShouldBeNil)
		})
	})

	Convey("Given a request for a list of CNSIs", t, func() {

		var (
			expectedList []*interfaces.CNSIRecord
		)

		// general setup
		expectedList = make([]*interfaces.CNSIRecord, 0)

		// sqlmock setup
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		// Expectations
		Convey("if no records exist in the database", func() {

			rs := sqlmock.NewRows(rowFieldsForCNSI)
			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(rs)

			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(mockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if two records exist in the database", func() {

			var (
				mockCFAndCERows sqlmock.Rows
			)

			// general setup
			u, _ := url.Parse(mockAPIEndpoint)
			r1 := &interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: ""}
			r2 := &interfaces.CNSIRecord{GUID: mockCEGUID, Name: "Some fancy HCE Cluster", CNSIType: "hce", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: "", SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: ""}
			expectedList = append(expectedList, r1, r2)

			mockCFAndCERows = sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, cipherClientSecret, false, "", "", "").
				AddRow(mockCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "", true, mockClientId, cipherClientSecret, false, "", "", "")
			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(mockCFAndCERows)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(mockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should match the expected list of CNSIs", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("If the database call fails for some reason", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to retrieve CNSI records: %s", unknownDBError)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned value should be nil", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(mockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs for a user", t, func() {

		var (
			//SELECT c.guid, c.name, c.cnsi_type, c.api_endpoint, c.doppler_logging_endpoint, t.user_guid, t.token_expiry, c.skip_ssl_validation, t.disconnected, t.meta_data
			//rowFieldsForCluster = []string{"guid", "name", "cnsi_type", "api_endpoint", "account", "token_expiry", "skip_ssl_validation"}
			rowFieldsForCluster = []string{"guid", "name", "cnsi_type", "api_endpoint", "doppler_logging_endpoint", "account", "token_expiry", "skip_ssl_validation", "disconnected", "meta_data", "sub_type", "endpoint_metadata", "creator"}
			expectedList        []*interfaces.ConnectedEndpoint
			mockAccount         = "asd-gjfg-bob"
		)

		expectedList = make([]*interfaces.ConnectedEndpoint, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if no records exist in the database", func() {

			rs := sqlmock.NewRows(rowFieldsForCluster)
			mock.ExpectQuery(selectFromCNSIandTokensWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(mockAccount)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(mockAccount)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(mockAccount)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 cluster records exist in the database", func() {

			var (
				mockTokenExpiry = time.Now().AddDate(0, 0, 1).Unix()
				mockClusterList sqlmock.Rows
			)

			// general setup
			u, _ := url.Parse(mockAPIEndpoint)
			r1 := &interfaces.ConnectedEndpoint{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, DopplerLoggingEndpoint: mockDopplerEndpoint, Account: mockAccount, TokenExpiry: mockTokenExpiry, SkipSSLValidation: true, Creator: ""}
			r2 := &interfaces.ConnectedEndpoint{GUID: mockCEGUID, Name: "Some fancy HCE Cluster", CNSIType: "hce", APIEndpoint: u, DopplerLoggingEndpoint: mockDopplerEndpoint, Account: mockAccount, TokenExpiry: mockTokenExpiry, SkipSSLValidation: true, Creator: ""}
			expectedList = append(expectedList, r1, r2)

			mockClusterList = sqlmock.NewRows(rowFieldsForCluster).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockDopplerEndpoint, mockAccount, mockTokenExpiry, true, false, "", "", "", "").
				AddRow(mockCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockDopplerEndpoint, mockAccount, mockTokenExpiry, true, false, "", "", "", "")
			mock.ExpectQuery(selectFromCNSIandTokensWhere).
				WillReturnRows(mockClusterList)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(mockAccount)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the cluster list returned should match the expected cluster list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(mockAccount)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(mockAccount)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("If the database call fails for some reason", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to retrieve CNSI records: %s", unknownDBError)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned value should be nil", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(mockAccount)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(mockAccount)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs from a creator", t, func() {

		var (
			rowFieldsForCluster = []string{"guid", "name", "cnsi_type", "api_endpoint", "doppler_logging_endpoint", "account", "token_expiry", "skip_ssl_validation", "disconnected", "meta_data", "sub_type", "endpoint_metadata", "creator"}
			expectedList        []*interfaces.CNSIRecord
			mockAccount         = "asd-gjfg-bob"
		)

		// general setup
		expectedList = make([]*interfaces.CNSIRecord, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()
		Convey("if no records exist in the database", func() {

			rs := sqlmock.NewRows(rowFieldsForCluster)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 records exist in the database", func() {

			var (
				mockClusterList sqlmock.Rows
			)

			// general setup
			u, _ := url.Parse(mockAPIEndpoint)
			r1 := &interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: mockAccount}
			r2 := &interfaces.CNSIRecord{GUID: mockCEGUID, Name: "Some fancy HCE Cluster", CNSIType: "hce", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: "", SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: mockAccount}
			expectedList = append(expectedList, r1, r2)

			mockClusterList = sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, cipherClientSecret, false, "", "", mockAccount).
				AddRow(mockCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "", true, mockClientId, cipherClientSecret, false, "", "", mockAccount)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(mockClusterList)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list returned should match the expected list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("If the database call fails for some reason", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to retrieve CNSI records: %s", unknownDBError)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned value should be nil", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(mockAccount, mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs with a given APIEndpoint string", t, func() {

		var (
			rowFieldsForCluster = []string{"guid", "name", "cnsi_type", "api_endpoint", "doppler_logging_endpoint", "account", "token_expiry", "skip_ssl_validation", "disconnected", "meta_data", "sub_type", "endpoint_metadata", "creator"}
			expectedList        []*interfaces.CNSIRecord
		)

		// general setup
		expectedList = make([]*interfaces.CNSIRecord, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()
		Convey("if no records exist in the database", func() {

			rs := sqlmock.NewRows(rowFieldsForCluster)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 records exist in the database", func() {

			var (
				mockClusterList sqlmock.Rows
			)

			// general setup
			u, _ := url.Parse(mockAPIEndpoint)
			r1 := &interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: ""}
			r2 := &interfaces.CNSIRecord{GUID: mockCEGUID, Name: "Some fancy HCE Cluster", CNSIType: "hce", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: "", SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: ""}
			expectedList = append(expectedList, r1, r2)

			mockClusterList = sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, cipherClientSecret, false, "", "", "").
				AddRow(mockCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "", true, mockClientId, cipherClientSecret, false, "", "", "")
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(mockClusterList)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list returned should match the expected list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("If the database call fails for some reason", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to retrieve CNSI records: %s", unknownDBError)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned value should be nil", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request to find a specific CNSI by GUID", t, func() {

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if the specified CNSI is in the database", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			expectedCNSIRecord := interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: false, Creator: ""}

			rs := sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, cipherClientSecret, false, "", "", "")
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockCFGUID, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockCFGUID, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the specified CNSI isn't in the database", func() {

			// General setup
			expectedCNSIRecord := interfaces.CNSIRecord{}

			rs := sqlmock.NewRows(rowFieldsForCNSI)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockCFGUID, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockCFGUID, mockEncryptionKey)
				So(err, ShouldResemble, errors.New("No match for that Endpoint"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the Find() method throws an error", func() {

			// General setup
			expectedCNSIRecord := interfaces.CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockCFGUID, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockCFGUID, mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request to find a specific CNSI by endpoint string", t, func() {

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if the specified endpoint is in the database", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			expectedCNSIRecord := interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: true, Creator: ""}

			rs := sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, cipherClientSecret, true, "", "", "")
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if the specified endpoint isn't in the database", func() {

			// General setup
			expectedCNSIRecord := interfaces.CNSIRecord{}

			rs := sqlmock.NewRows(rowFieldsForCNSI)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldResemble, errors.New("No match for that Endpoint"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the find by endpoint method throws an error", func() {

			// General setup
			expectedCNSIRecord := interfaces.CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint, mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request to save a specific CNSI", t, func() {

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if successful", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			cnsi := interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: true, Creator: ""}

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, sqlmock.AnyArg(), true, sqlmock.AnyArg(), sqlmock.AnyArg(), "").
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(mockCFGUID, cnsi, mockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			cnsi := interfaces.CNSIRecord{GUID: mockCFGUID, Name: "Some fancy CF Cluster", CNSIType: "cf", APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true, ClientId: mockClientId, ClientSecret: mockClientSecret, SSOAllowed: true, Creator: ""}
			expectedErrorMessage := fmt.Sprintf("Unable to Save CNSI record: %s", unknownDBError)

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(mockCFGUID, "Some fancy CF Cluster", "cf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true, mockClientId, sqlmock.AnyArg(), true, sqlmock.AnyArg(), sqlmock.AnyArg(), "").
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(mockCFGUID, cnsi, mockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

	})

	Convey("Given a request to delete a specific CNSI", t, func() {

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if successful", func() {

			mock.ExpectExec(deleteFromCNSIs).
				WithArgs(mockCFGUID).
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(mockCFGUID)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to Delete CNSI record: %s", unknownDBError)

			mock.ExpectExec(deleteFromCNSIs).
				WithArgs(mockCFGUID).
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(mockCFGUID)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

}
