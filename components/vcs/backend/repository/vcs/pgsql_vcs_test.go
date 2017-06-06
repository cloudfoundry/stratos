package vcs

import (
	"testing"
	"errors"
	"database/sql"

	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

const (
	mockGuid = "foo-guid"
	mockLabel = "foo-bar"
	mockUser = "foo-bar"
	mockVcsType = "github"
	mockUrl = "https://foohub.com"
	listVcsQuery = "SELECT guid, label, type, browse_url, api_url, skip_ssl_validation FROM vcs"
	listVcsByUserQuery = "SELECT v.guid, v.label, v.type, v.browse_url, v.api_url, v.skip_ssl_validation FROM vcs v, vcs_tokens t"
	saveVcsQuery = "INSERT INTO vcs"
)

var mockVcsRecord = VcsRecord{
	Guid: mockGuid,
	Label: mockLabel,
	VcsType: mockVcsType,
	BrowseUrl: mockUrl,
	ApiUrl: mockUrl,
	SkipSslValidation: true,
}

func initialiseRepo(t *testing.T) (*sql.DB, sqlmock.Sqlmock, Repository) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
	}
	repository, _ := NewPostgresVcsRepository(db)
	return db, mock, repository
}

func TestList(t *testing.T) {

	Convey("List Tests", t, func() {

		row := sqlmock.NewRows([]string{"guid", "label",
			"type", "browse_url", "api_url", "skip_ssl_validation"}).
			AddRow(mockGuid, mockLabel, mockVcsType,mockUrl, mockUrl, true)

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception if a DB exception occurs", func() {
			mock.ExpectQuery(listVcsQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.List()

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {

			mock.ExpectQuery(listVcsQuery).
				WillReturnRows(row)
			rs, err := repository.List()

			So(err, ShouldBeNil)
			So(rs, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestListByUser(t *testing.T) {

	Convey("ListByUser Tests", t, func() {

		row := sqlmock.NewRows([]string{"v.guid", "v.label",
			"v.type", "v.browse_url", "v.api_url", "v.skip_ssl_validation"}).
			AddRow(mockGuid, mockLabel, mockVcsType,mockUrl, mockUrl, true)

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception if a DB exception occurs", func() {
			mock.ExpectQuery(listVcsByUserQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.ListByUser(mockUser)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {

			mock.ExpectQuery(listVcsByUserQuery).
				WillReturnRows(row)
			rs, err := repository.ListByUser(mockUser)

			So(err, ShouldBeNil)
			So(rs, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestFind(t *testing.T) {

	Convey("Find Tests", t, func() {

		row := sqlmock.NewRows([]string{"guid", "label",
			"type", "browse_url", "api_url", "skip_ssl_validation"}).
			AddRow(mockGuid, mockLabel, mockVcsType,mockUrl, mockUrl, true)

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception if a DB exception occurs", func() {
			mock.ExpectQuery(listVcsQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.Find(mockGuid)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {

			mock.ExpectQuery(listVcsQuery).
				WillReturnRows(row)
			rs, err := repository.Find(mockGuid)

			So(err, ShouldBeNil)
			So(rs, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestFindMatching(t *testing.T) {

	Convey("FindMatching Tests", t, func() {

		row := sqlmock.NewRows([]string{"guid", "label",
			"type", "browse_url", "api_url", "skip_ssl_validation"}).
			AddRow(mockGuid, mockLabel, mockVcsType,mockUrl, mockUrl, true)

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception when a DB exception occurs", func() {
			mock.ExpectQuery(listVcsQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.FindMatching(mockVcsRecord)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {

			mock.ExpectQuery(listVcsQuery).
				WillReturnRows(row)
			rs, err := repository.FindMatching(mockVcsRecord)

			So(err, ShouldBeNil)
			So(rs, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestSave(t *testing.T) {

	Convey("Save Tests", t, func() {


		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception when encoutering an unknown VCS type", func() {

			mockVcsRecord.VcsType = "FooHub"
			err := repository.Save(mockVcsRecord)

			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when record contains an invalid Browse URL", func() {

			mockVcsRecord.BrowseUrl = "Foo"
			err := repository.Save(mockVcsRecord)

			So(err, ShouldNotBeNil)
		})
		Convey("should throw exception when record contains an invalid API URL", func() {

			mockVcsRecord.ApiUrl = "Foo"
			err := repository.Save(mockVcsRecord)

			So(err, ShouldNotBeNil)
		})

		Convey("should throw an exception when a DB error occurs when saving", func() {

			mock.ExpectExec(saveVcsQuery).
				WillReturnError(errors.New("error"))
			err := repository.Save(mockVcsRecord)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {

			mock.ExpectExec(saveVcsQuery).
				WillReturnResult(sqlmock.NewResult(1,1))
			err := repository.Save(mockVcsRecord)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			mockVcsRecord = VcsRecord{
				Guid: mockGuid,
				Label: mockLabel,
				VcsType: mockVcsType,
				BrowseUrl: mockUrl,
				ApiUrl: mockUrl,
				SkipSslValidation: true,
			}
			db.Close()
		})
	})

}
