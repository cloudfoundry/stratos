package apikeys

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestNewPgsqlAPIKeysRepository(t *testing.T) {
	Convey("Given a request for a new reference to a API keys Repository", t, func() {
		db, _, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, err := NewPgsqlAPIKeysRepository(db)

		Convey("no error should be returned", func() {
			So(err, ShouldBeNil)
		})

		Convey("result should be of valid type", func() {
			So(repository, ShouldHaveSameTypeAs, &PgsqlAPIKeysRepository{})
		})
	})
}

func TestAddAPIKey(t *testing.T) {
	var (
		userID            = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
		insertIntoAPIKeys = `INSERT INTO api_keys`
	)

	Convey("Given a request to add an API key", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, _ := NewPgsqlAPIKeysRepository(db)

		_ = mock

		Convey("when the comment exceeds maximal length", func() {
			_, err := repository.AddAPIKey(userID, strings.Repeat("a", 256))

			Convey("there should be no error returned", func() {
				So(err, ShouldResemble, errors.New("comment maximum length is 255 characters"))
			})
		})

		Convey("when the comment is not empty", func() {
			comment := "test"

			mock.ExpectExec(insertIntoAPIKeys).
				WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), userID, comment).
				WillReturnResult(sqlmock.NewResult(1, 1))

			apiKey, err := repository.AddAPIKey(userID, comment)

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})

			Convey("should return an API key", func() {
				So(apiKey, ShouldHaveSameTypeAs, &interfaces.APIKey{})
			})

			Convey("API key secret should not be empty", func() {
				So(len(apiKey.Secret), ShouldBeGreaterThan, 0)
			})
		})
	})
}

func TestListAPIKeys(t *testing.T) {
	var (
		userID            = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
		rowFields         = []string{"guid", "user_guid", "comment", "last_used"}
		selectUserAPIKeys = `SELECT (.+) FROM api_keys WHERE user_guid = (.+)`
	)

	Convey("Given a request to list API keys", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, err := NewPgsqlAPIKeysRepository(db)

		Convey("if no records exist in the DB", func() {
			rs := sqlmock.NewRows(rowFields)
			mock.ExpectQuery(selectUserAPIKeys).WillReturnRows(rs)
			results, err := repository.ListAPIKeys(userID)

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})

			Convey("result should be empty", func() {
				So(len(results), ShouldEqual, 0)
			})

			Convey("result should be of correct type", func() {
				expectedList := make([]interfaces.APIKey, 0)
				So(results, ShouldResemble, expectedList)
			})
		})

		Convey("if records exist in the DB", func() {
			t := time.Now()
			r1 := &interfaces.APIKey{GUID: "00000000-0000-0000-0000-000000000000", Secret: "", UserGUID: userID, Comment: "First key", LastUsed: &t}
			r2 := &interfaces.APIKey{GUID: "11111111-1111-1111-1111-111111111111", Secret: "", UserGUID: userID, Comment: "Second key", LastUsed: nil}

			expectedList := []interfaces.APIKey{*r1, *r2}

			mockRows := sqlmock.NewRows(rowFields).
				AddRow(r1.GUID, r1.UserGUID, r1.Comment, r1.LastUsed).
				AddRow(r2.GUID, r2.UserGUID, r2.Comment, r2.LastUsed)

			mock.ExpectQuery(selectUserAPIKeys).WillReturnRows(mockRows)

			results, err := repository.ListAPIKeys(userID)

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})

			Convey("2 API keys should be returned", func() {
				So(len(results), ShouldEqual, 2)
			})

			Convey("result should be of correct type", func() {
				So(results, ShouldResemble, expectedList)
			})
		})
	})
}
