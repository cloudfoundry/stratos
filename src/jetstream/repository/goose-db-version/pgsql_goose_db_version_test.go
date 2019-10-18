package goosedbversion

import (
	"errors"
	"fmt"
	"testing"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	. "github.com/smartystreets/goconvey/convey"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

func TestPgSQLGooseDB(t *testing.T) {

	Convey("Given a request for a new reference to the Goose PG Repository", t, func() {

		db, _, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		Convey("A valid CNSI Repository should be returned without error.", func() {
			repository, err := NewPostgresGooseDBVersionRepository(db)
			So(repository, ShouldHaveSameTypeAs, &PostgresGooseDBVersionRepository{})
			So(err, ShouldBeNil)
		})
	})

	Convey("Given a request for the current Goose database version", t, func() {

		var (
			selectFromDBVersionWhere       = `SELECT (.+) FROM goose_db_version WHERE (.+)`
			rowFieldsForVersionID          = []string{"version_id"}
			mockVersionID            int64 = 1
		)

		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		// General setup
		expectedVersionRecord := api.GooseDBVersionRecord{VersionID: mockVersionID}

		Convey("if one exists", func() {

			// Database setup
			rs := sqlmock.NewRows(rowFieldsForVersionID).AddRow(mockVersionID)
			mock.ExpectQuery(selectFromDBVersionWhere).WillReturnRows(rs)

			Convey("it should be returned", func() {
				repository, _ := NewPostgresGooseDBVersionRepository(db)
				result, _ := repository.GetCurrentVersion()
				So(result, ShouldHaveSameTypeAs, expectedVersionRecord)

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if one doesn't exist", func() {

			expectedErrorMessage := "No database versions found"

			// Database setup
			rs := sqlmock.NewRows(rowFieldsForVersionID)
			mock.ExpectQuery(selectFromDBVersionWhere).
				WillReturnRows(rs)

			Convey("there should be an error", func() {
				repository, _ := NewPostgresGooseDBVersionRepository(db)
				_, err := repository.GetCurrentVersion()
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})

		Convey("if there is a problem talking to the database", func() {

			expectedErrorMessage := fmt.Sprintf("Error trying to get current database version: %s", "error")

			// Database setup
			mock.ExpectQuery(selectFromDBVersionWhere).
				WillReturnError(errors.New("error"))

			Convey("there should be an error", func() {
				repository, _ := NewPostgresGooseDBVersionRepository(db)
				_, err := repository.GetCurrentVersion()
				So(err, ShouldResemble, errors.New(expectedErrorMessage))

				dberr := mock.ExpectationsWereMet()
				So(dberr, ShouldBeNil)
			})
		})
	})
}
