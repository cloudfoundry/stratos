package cnsis

import (
	"errors"
	"fmt"
	"testing"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/testutils"
	. "github.com/smartystreets/goconvey/convey"
)

func TestPgSQLCNSIs(t *testing.T) {

	var (
		unknownDBError = "Unknown Database Error"

		selectAnyFromCNSIs           = `SELECT (.+) FROM cnsis`
		selectFromCNSIsWhere         = `SELECT (.+) FROM cnsis WHERE (.+)`
		selectFromCNSIandTokensWhere = `SELECT (.+) FROM cnsis c, tokens t WHERE (.+) AND t.disconnected = '0'`
		insertIntoCNSIs              = `INSERT INTO cnsis`
		deleteFromCNSIs              = `DELETE FROM cnsis WHERE (.+)`
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
			expectedList []*api.CNSIRecord
		)

		// general setup
		expectedList = make([]*api.CNSIRecord, 0)

		// sqlmock setup
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		// Expectations
		Convey("if no records exist in the database", func() {

			rs := testutils.GetEmptyCNSIRows()
			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(rs)

			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if two records exist in the database", func() {
			// general setup
			r1 := testutils.GetTestCNSIRecord()
			r2 := testutils.GetTestCNSIRecord()
			r2.Name = testutils.MockHCEName
			r2.GUID = testutils.MockHCEGUID
			r2.CNSIType = "hce"

			expectedList = append(expectedList, r1, r2)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(testutils.GetCNSIRows(r1, r2))

			// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should match the expected list of CNSIs", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.List(testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(testutils.MockEncryptionKey)
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
				results, _ := repository.List(testutils.MockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.List(testutils.MockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs for a user", t, func() {

		var (
			expectedList []*api.ConnectedEndpoint
		)

		expectedList = make([]*api.ConnectedEndpoint, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("if no records exist in the database", func() {

			rs := testutils.GetEmptyCNSIRows()
			mock.ExpectQuery(selectFromCNSIandTokensWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(testutils.MockAccount)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(testutils.MockAccount)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(testutils.MockAccount)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 cluster records exist in the database", func() {
			// general setup
			r1 := testutils.GetTestConnectedEndpoint()
			r2 := testutils.GetTestConnectedEndpoint()
			r2.Name = testutils.MockHCEName
			r2.GUID = testutils.MockHCEGUID
			r2.CNSIType = "hce"

			expectedList = append(expectedList, r1, r2)

			mockClusterList := testutils.GetConnectedEndpointsRows(r1, r2)
			mock.ExpectQuery(selectFromCNSIandTokensWhere).
				WillReturnRows(mockClusterList)

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(testutils.MockAccount)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the cluster list returned should match the expected cluster list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByUser(testutils.MockAccount)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(testutils.MockAccount)
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
				results, _ := repository.ListByUser(testutils.MockAccount)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByUser(testutils.MockAccount)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs from a creator", t, func() {

		var (
			expectedList []*api.CNSIRecord
		)

		// general setup
		expectedList = make([]*api.CNSIRecord, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()
		Convey("if no records exist in the database", func() {

			rs := testutils.GetEmptyCNSIRows()
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 records exist in the database", func() {
			// general setup
			r1 := testutils.GetTestCNSIRecord()
			r2 := testutils.GetTestCNSIRecord()
			r2.Name = testutils.MockHCEName
			r2.GUID = testutils.MockHCEGUID
			r2.CNSIType = "hce"

			expectedList = append(expectedList, r1, r2)

			mock.ExpectQuery(selectAnyFromCNSIs).
				WillReturnRows(testutils.GetCNSIRows(r1, r2))

				// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list returned should match the expected list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
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
				results, _ := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByCreator(testutils.MockAccount, testutils.MockEncryptionKey)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

	Convey("Given a request for a list of CNSIs with a given APIEndpoint string", t, func() {

		var (
			expectedList []*api.CNSIRecord
		)

		// general setup
		expectedList = make([]*api.CNSIRecord, 0)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()
		Convey("if no records exist in the database", func() {

			rs := testutils.GetEmptyConnectedEndpointsRows()
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("No CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 0)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list of returned CNSIs should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if 2 records exist in the database", func() {
			// general setup
			r1 := testutils.GetTestCNSIRecord()
			r2 := testutils.GetTestCNSIRecord()
			r2.Name = testutils.MockHCEName
			r2.GUID = testutils.MockHCEGUID
			r2.CNSIType = "hce"

			expectedList = append(expectedList, r1, r2)

			mockClusterList := testutils.GetCNSIRows(r1, r2)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(mockClusterList)

			// Expectations
			Convey("2 CNSIs should be returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(len(results), ShouldEqual, 2)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("the list returned should match the expected list", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				results, _ := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(results, ShouldResemble, expectedList)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
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
				results, _ := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(results, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.ListByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
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
			// general setup
			expectedCNSIRecord := testutils.GetTestCNSIRecord()

			rs := testutils.GetCNSIRows(expectedCNSIRecord)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, *expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the specified CNSI isn't in the database", func() {

			// General setup
			expectedCNSIRecord := api.CNSIRecord{}

			rs := testutils.GetEmptyCNSIRows()
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

				// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
				So(err, ShouldResemble, errors.New("No match for that Endpoint"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the Find() method throws an error", func() {

			// General setup
			expectedCNSIRecord := api.CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.Find(testutils.MockCFGUID, testutils.MockEncryptionKey)
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
			// general setup
			expectedCNSIRecord := testutils.GetTestCNSIRecord()

			rs := testutils.GetCNSIRows(expectedCNSIRecord)
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI should match the expected CNSI", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, *expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

		})

		Convey("if the specified endpoint isn't in the database", func() {

			// General setup
			expectedCNSIRecord := api.CNSIRecord{}

			rs := testutils.GetEmptyCNSIRows()
			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnRows(rs)

			// Expectations
			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(err, ShouldResemble, errors.New("No match for that Endpoint"))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if the find by endpoint method throws an error", func() {

			// General setup
			expectedCNSIRecord := api.CNSIRecord{}
			expectedErrorMessage := fmt.Sprintf("Error trying to Find CNSI record: %s", unknownDBError)

			mock.ExpectQuery(selectFromCNSIsWhere).
				WillReturnError(errors.New(unknownDBError))

			Convey("the returned CNSI record should be empty", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				cnsi, _ := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
				So(cnsi, ShouldResemble, expectedCNSIRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})

			Convey("there should be a 'not found' error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				_, err := repository.FindByAPIEndpoint(testutils.MockAPIEndpoint, testutils.MockEncryptionKey)
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

			// general setup
			cnsi := *testutils.GetTestCNSIRecord()
			cnsi.SSOAllowed = true

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(testutils.MockCNSIGUID, testutils.MockCNSIName, "cf", testutils.MockAPIEndpoint, testutils.MockAuthEndpoint, testutils.MockAuthEndpoint, testutils.MockDopplerEndpoint, true, testutils.MockClientId, sqlmock.AnyArg(), true, sqlmock.AnyArg(), sqlmock.AnyArg(), "", sqlmock.AnyArg()).
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(testutils.MockCNSIGUID, cnsi, testutils.MockEncryptionKey)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {
			// General setup
			cnsi := *testutils.GetTestCNSIRecord()
			cnsi.SSOAllowed = true
			expectedErrorMessage := fmt.Sprintf("Unable to Save CNSI record: %s", unknownDBError)

			mock.ExpectExec(insertIntoCNSIs).
				WithArgs(testutils.MockCNSIGUID, testutils.MockCNSIName, "cf", testutils.MockAPIEndpoint, testutils.MockAuthEndpoint, testutils.MockAuthEndpoint, testutils.MockDopplerEndpoint, true, testutils.MockClientId, sqlmock.AnyArg(), true, sqlmock.AnyArg(), sqlmock.AnyArg(), "", sqlmock.AnyArg()).
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Save(testutils.MockCNSIGUID, cnsi, testutils.MockEncryptionKey)
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
				WithArgs(testutils.MockCFGUID).
				WillReturnResult(sqlmock.NewResult(1, 1))

			Convey("there should be no error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(testutils.MockCFGUID)
				So(err, ShouldBeNil)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if unsuccessful", func() {

			expectedErrorMessage := fmt.Sprintf("Unable to Delete CNSI record: %s", unknownDBError)

			mock.ExpectExec(deleteFromCNSIs).
				WithArgs(testutils.MockCFGUID).
				WillReturnError(errors.New(unknownDBError))

			Convey("there should be an error returned", func() {
				repository, _ := NewPostgresCNSIRepository(db)
				err := repository.Delete(testutils.MockCFGUID)
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})

}
