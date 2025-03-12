package apikeys

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
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
		comment           = "test"
	)

	Convey("Given a request to add an API key", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, _ := NewPgsqlAPIKeysRepository(db)

		Convey("when the comment exceeds maximal length", func() {
			_, err := repository.AddAPIKey(userID, strings.Repeat("a", 256))

			Convey("an error should be returned", func() {
				So(err, ShouldResemble, errors.New("comment maximum length is 255 characters"))
			})
		})

		Convey("when a key can't be inserted", func() {
			mock.ExpectExec(insertIntoAPIKeys).
				WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), userID, comment).
				WillReturnResult(sqlmock.NewResult(0, 0))

			apiKey, err := repository.AddAPIKey(userID, comment)

			Convey("an error should be returned", func() {
				So(err, ShouldResemble, errors.New("AddAPIKey: no rows were updated"))
			})

			Convey("should return nil", func() {
				So(apiKey, ShouldBeNil)
			})
		})

		Convey("when the comment is not empty", func() {
			mock.ExpectExec(insertIntoAPIKeys).
				WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), userID, comment).
				WillReturnResult(sqlmock.NewResult(1, 1))

			apiKey, err := repository.AddAPIKey(userID, comment)

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})

			Convey("should return an API key", func() {
				So(apiKey, ShouldHaveSameTypeAs, &api.APIKey{})
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
				expectedList := make([]api.APIKey, 0)
				So(results, ShouldResemble, expectedList)
			})
		})

		Convey("if records exist in the DB", func() {
			t := time.Now()

			r1 := &api.APIKey{
				GUID:     "00000000-0000-0000-0000-000000000000",
				Secret:   "",
				UserGUID: userID,
				Comment:  "First key",
				LastUsed: &t,
			}

			r2 := &api.APIKey{
				GUID:     "11111111-1111-1111-1111-111111111111",
				Secret:   "",
				UserGUID: userID,
				Comment:  "Second key",
				LastUsed: nil,
			}

			expectedList := []api.APIKey{*r1, *r2}

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

func TestGetAPIKeyBySecret(t *testing.T) {
	var (
		rowFields            = []string{"guid", "user_guid", "comment", "last_used"}
		selectAPIKeyBySecret = `SELECT (.+) FROM api_keys WHERE secret = (.+)`
	)

	Convey("Given a request to get an API key by its secret", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, err := NewPgsqlAPIKeysRepository(db)

		Convey("if no matching record exists in the DB", func() {
			rs := sqlmock.NewRows(rowFields)
			mock.ExpectQuery(selectAPIKeyBySecret).WillReturnRows(rs)
			results, err := repository.GetAPIKeyBySecret("test")

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("an error should be returned", func() {
				So(err, ShouldResemble, errors.New("sql: no rows in result set"))
			})

			Convey("result should be nil", func() {
				So(results, ShouldBeNil)
			})
		})

		Convey("if records exist in the DB", func() {
			t := time.Now()

			r := &api.APIKey{
				GUID:     "00000000-0000-0000-0000-000000000000",
				Secret:   "",
				UserGUID: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				Comment:  "First key",
				LastUsed: &t,
			}

			mockRows := sqlmock.NewRows(rowFields).
				AddRow(r.GUID, r.UserGUID, r.Comment, r.LastUsed)

			mock.ExpectQuery(selectAPIKeyBySecret).WillReturnRows(mockRows)

			results, err := repository.GetAPIKeyBySecret("test")

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})

			Convey("result should be of correct type", func() {
				So(results, ShouldResemble, r)
			})
		})
	})
}

func TestDeleteAPIKey(t *testing.T) {
	var (
		userID            = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
		keyID             = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
		deleteFromAPIKeys = `DELETE FROM api_keys WHERE user_guid = (.+) AND guid = (.+)`
	)

	Convey("Given a request to add an API key", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, _ := NewPgsqlAPIKeysRepository(db)

		Convey("when a matching key doesn't exist", func() {
			mock.ExpectExec(deleteFromAPIKeys).
				WithArgs(userID, keyID).
				WillReturnResult(sqlmock.NewResult(0, 0))

			err := repository.DeleteAPIKey(userID, keyID)

			Convey("an error should be returned", func() {
				So(err, ShouldResemble, errors.New("DeleteAPIKey: no rows were updated"))
			})
		})

		Convey("when a matching key exists", func() {
			mock.ExpectExec(deleteFromAPIKeys).
				WithArgs(userID, keyID).
				WillReturnResult(sqlmock.NewResult(1, 1))

			err := repository.DeleteAPIKey(userID, keyID)

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})
		})
	})
}

func TestUpdateAPIKeyLastUsed(t *testing.T) {
	var (
		keyID          = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
		updateLastUsed = `UPDATE api_keys SET last_used = (.+) WHERE guid = (.+)`
	)

	Convey("Given a request to update API key last used", t, func() {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		repository, _ := NewPgsqlAPIKeysRepository(db)

		Convey("when a matching key doesn't exist", func() {
			mock.ExpectExec(updateLastUsed).
				WithArgs(sqlmock.AnyArg(), keyID).
				WillReturnResult(sqlmock.NewResult(0, 0))

			err := repository.UpdateAPIKeyLastUsed(keyID)

			Convey("an error should be returned", func() {
				So(err, ShouldResemble, errors.New("UpdateAPIKeyLastUsed: no rows were updated"))
			})
		})

		Convey("when a matching key exists", func() {
			mock.ExpectExec(updateLastUsed).
				WithArgs(sqlmock.AnyArg(), keyID).
				WillReturnResult(sqlmock.NewResult(1, 1))

			err := repository.UpdateAPIKeyLastUsed(keyID)

			Convey("DB query expectations should be met", func() {
				So(mock.ExpectationsWereMet(), ShouldBeNil)
			})

			Convey("there should be no error returned", func() {
				So(err, ShouldBeNil)
			})
		})
	})
}
