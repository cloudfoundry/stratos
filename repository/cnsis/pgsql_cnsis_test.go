package cnsis

import (
	"errors"
	"fmt"
	"net/url"
	"testing"
	"time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	. "github.com/smartystreets/goconvey/convey"
)

func TestPgSQLCNSIs(t *testing.T) {

	var (
		mockHCFGUID         = "some-hcf-guid-1234"
		mockHCEGUID         = "some-hce-guid-1234"
		mockAPIEndpoint     = "https://api.127.0.0.1"
		mockAuthEndpoint    = "https://login.127.0.0.1"
		mockDopplerEndpoint = "https://doppler.127.0.0.1"
		unknownDBError      = "Unknown Database Error"

		selectAnyFromCNSIs           = `SELECT (.+) FROM cnsis`
		selectFromCNSIsWhere         = `SELECT (.+) FROM cnsis WHERE (.+)`
		selectFromCNSIandTokensWhere = `SELECT (.+) FROM cnsis c, tokens t WHERE (.+)`
		insertIntoCNSIs              = `INSERT INTO cnsis`
		deleteFromCNSIs              = `DELETE FROM cnsis WHERE (.+)`
		rowFieldsForCNSI             = []string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint",
			"token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation"}
	)

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
			expectedList []*CNSIRecord
		)

		// general setup
		expectedList = make([]*CNSIRecord, 0)

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
				results, _ := repository.List()
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List()
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List()
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if two records exist in the database", func() {

			var (
				mockHCFAndHCERows sqlmock.Rows
			)

			// general setup
			u, _ := url.Parse(mockAPIEndpoint)
			r1 := &CNSIRecord{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true}
			r2 := &CNSIRecord{GUID: mockHCEGUID, Name: "Some fancy HCE Cluster", CNSIType: CNSIType("hce"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: "", SkipSSLValidation: true}
			expectedList = append(expectedList, r1, r2)

			mockHCFAndHCERows = sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true).
				AddRow(mockHCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, "", true)
			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(mockHCFAndHCERows)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List()
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should match the expected list of CNSIs", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List()
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List()
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
				results, _ := repository.List()
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List()
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs for a user", t, func() {

		var (
			rowFieldsForCluster = []string{"guid", "name", "cnsi_type", "api_endpoint", "account", "token_expiry", "skip_ssl_validation"}
			expectedList        []*RegisteredCluster
			mockAccount         = "asd-gjfg-bob"
		)

		expectedList = make([]*RegisteredCluster, 0)

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
			r1 := &RegisteredCluster{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, Account: mockAccount, TokenExpiry: mockTokenExpiry, SkipSSLValidation: true}
			r2 := &RegisteredCluster{GUID: mockHCEGUID, Name: "Some fancy HCE Cluster", CNSIType: CNSIType("hce"), APIEndpoint: u, Account: mockAccount, TokenExpiry: mockTokenExpiry, SkipSSLValidation: true}
			expectedList = append(expectedList, r1, r2)

			mockClusterList = sqlmock.NewRows(rowFieldsForCluster).
				AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAccount, mockTokenExpiry, true).
				AddRow(mockHCEGUID, "Some fancy HCE Cluster", "hce", mockAPIEndpoint, mockAccount, mockTokenExpiry, true)
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

	Convey("Given a request to find a specific CNSI by GUID", t, func() {

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if the specified CNSI is in the database", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			expectedCNSIRecord := CNSIRecord{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true}

			rs := sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockHCFGUID)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockHCFGUID)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the specified CNSI isn't in the database", func() {

			// General setup
			expectedCNSIRecord := CNSIRecord{}

			rs := sqlmock.NewRows(rowFieldsForCNSI)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockHCFGUID)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockHCFGUID)
				So(err, ShouldResemble, errors.New("No match for that GUID"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the Find() method throws an error", func() {

			// General setup
			expectedCNSIRecord := CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(mockHCFGUID)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(mockHCFGUID)
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
			expectedCNSIRecord := CNSIRecord{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true}

			rs := sqlmock.NewRows(rowFieldsForCNSI).
				AddRow(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if the specified endpoint isn't in the database", func() {

			// General setup
			expectedCNSIRecord := CNSIRecord{}

			rs := sqlmock.NewRows(rowFieldsForCNSI)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint)
				So(err, ShouldResemble, errors.New("No match for that API Endpoint"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the find by endpoint method throws an error", func() {

			// General setup
			expectedCNSIRecord := CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(mockAPIEndpoint)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(mockAPIEndpoint)
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
			cnsi := CNSIRecord{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true}

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true).
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(mockHCFGUID, cnsi)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {

			// General setup
			u, _ := url.Parse(mockAPIEndpoint)
			cnsi := CNSIRecord{GUID: mockHCFGUID, Name: "Some fancy HCF Cluster", CNSIType: CNSIType("hcf"), APIEndpoint: u, AuthorizationEndpoint: mockAuthEndpoint, TokenEndpoint: mockAuthEndpoint, DopplerLoggingEndpoint: mockDopplerEndpoint, SkipSSLValidation: true}
			expectedErrorMessage := fmt.Sprintf("Unable to Save CNSI record: %s", unknownDBError)

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(mockHCFGUID, "Some fancy HCF Cluster", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockAuthEndpoint, mockDopplerEndpoint, true).
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(mockHCFGUID, cnsi)
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
				WithArgs(mockHCFGUID).
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(mockHCFGUID)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to Delete CNSI record: %s", unknownDBError)

			mock.ExpectExec(deleteFromCNSIs).
				WithArgs(mockHCFGUID).
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(mockHCFGUID)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request to convert a string into a CNSI type", t, func() {

		Convey("when the string is 'hcf'", func() {
			cnsiType := "hcf"
			Convey("the correct type could be returned", func() {
				result, _ := GetCNSIType(cnsiType)
				So(result, ShouldHaveSameTypeAs, CNSIHCF)
			})
			Convey("an error should not be returned", func() {
				_, err := GetCNSIType(cnsiType)
				So(err, ShouldBeNil)
			})
		})

		Convey("when the string is 'hce'", func() {
			cnsiType := "hce"
			Convey("the correct type could be returned", func() {
				result, _ := GetCNSIType(cnsiType)
				So(result, ShouldHaveSameTypeAs, CNSIHCE)
			})
			Convey("an error should not be returned", func() {
				_, err := GetCNSIType(cnsiType)
				So(err, ShouldBeNil)
			})
		})

		Convey("when the string is anything else", func() {
			expectedErrorMessage := "Invalid string passed to GetCNSIType."
			cnsiType := "wekdfwejfewjfh"

			Convey("an error shoud be returned", func() {
				_, err := GetCNSIType(cnsiType)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))
			})
		})
	})
}
