package vcstokens

import (
	"testing"
	"errors"
	"database/sql"

	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

const (
	mockGuid = "foo-guid"
	mockUserGuid = "foo-bar"
	mockVcsGuid = "foo-bar"
	mockVcsTokenName = "myToken"
	mockToken = "mock-foohub-token"
	mockUrl = "https://foohub.com"
	findVcsTokenQuery = "SELECT guid, user_guid, vcs_guid, name, token FROM vcs_tokens"
	saveVcsTokenQuery = "INSERT INTO vcs_tokens "
	renameVcsTokenQuery = "UPDATE vcs_tokens"
	deleteVcsTokenQuery = "DELETE FROM vcs_tokens"
	listVcsTokensByUserQuery = "SELECT t.guid, t.user_guid, t.vcs_guid, t.name, t.token, v.guid, v.label, v.type, v.browse_url, v.api_url, v.skip_ssl_validation FROM vcs v, vcs_tokens t"
)

var tokenRecord = VcsTokenRecord{
	Guid: mockGuid,
	UserGuid: mockUserGuid,
	VcsGuid: mockVcsGuid,
	Name: mockVcsTokenName,
	Token: mockToken,
}

var mockEncryptionKey = make([]byte, 32)

func initialiseRepo(t *testing.T) (*sql.DB, sqlmock.Sqlmock, Repository) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
	}
	repository, _ := NewPgsqlVcsTokenRepository(db)
	return db, mock, repository
}

func TestSaveVcsTokens(t *testing.T) {

	Convey("SaveVcsTokens Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to find token with an invalid user GUID", func() {
			tokenRecord.UserGuid = ""
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an invalid GUID", func() {
			tokenRecord.Guid = ""
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an VCS GUID", func() {
			tokenRecord.VcsGuid = ""
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an invalid VCS token name", func() {
			tokenRecord.Name = ""
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an invalid VCS token value", func() {
			tokenRecord.Token = ""
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when a token with the same name already exists", func() {

			row := sqlmock.NewRows([]string{"guid", "user_guid", "vcs_guid", "name", "token"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken)

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnRows(row)
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should fail to decrypt with invalid encryptionKey", func() {

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnError(errors.New("failed to find token"))
			err := repository.SaveVcsToken(&tokenRecord, nil)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Success case", func() {
			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnError(errors.New("failed to find token"))
			mock.ExpectExec(saveVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))
			err := repository.SaveVcsToken(&tokenRecord, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			tokenRecord = VcsTokenRecord{
				Guid: mockGuid,
				UserGuid: mockUserGuid,
				VcsGuid: mockVcsGuid,
				Name: mockVcsTokenName,
				Token: mockToken,
			}
			db.Close()
		})

	})

}

func TestFindVcsToken(t *testing.T) {

	Convey("FindVcsToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to find token with an invalid user GUID", func() {
			_, err := repository.FindVcsToken("", tokenRecord.Guid, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an invalid token GUID", func() {
			_, err := repository.FindVcsToken(tokenRecord.UserGuid, "", mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when finding a non-existent token", func() {
			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.FindVcsToken(tokenRecord.UserGuid, tokenRecord.Guid, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {
			row := sqlmock.NewRows([]string{"guid", "user_guid", "vcs_guid", "name", "token"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken)

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnRows(row)
			tk, err := repository.FindVcsToken(tokenRecord.UserGuid, tokenRecord.Guid, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(tk, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestFindMatchingVcsToken(t *testing.T) {

	Convey("FindMatchingVcsToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to find token with an invalid user GUID", func() {
			tokenRecord.UserGuid = ""
			_, err := repository.FindMatchingVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an invalid GUID", func() {
			tokenRecord.Guid = ""
			_, err := repository.FindMatchingVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to find token with an VCS token name", func() {
			tokenRecord.Name = ""
			_, err := repository.FindMatchingVcsToken(&tokenRecord, mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when finding a non-existent token", func() {
			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.FindMatchingVcsToken(&tokenRecord, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {
			row := sqlmock.NewRows([]string{"guid", "user_guid", "vcs_guid", "name", "token"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken)

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnRows(row)
			tk, err := repository.FindMatchingVcsToken(&tokenRecord, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(tk, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			tokenRecord = VcsTokenRecord{
				Guid: mockGuid,
				UserGuid: mockUserGuid,
				VcsGuid: mockVcsGuid,
				Name: mockVcsTokenName,
				Token: mockToken,
			}
			db.Close()
		})
	})

}

func TestRenameVcsToken(t *testing.T) {

	Convey("RenameVcsToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception when attemping to rename a non-existent token", func() {
			mock.ExpectExec(renameVcsTokenQuery).
				WillReturnError(errors.New("doesnt exist"))
			err := repository.RenameVcsToken(mockUserGuid, mockGuid, mockVcsTokenName)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should throw an exception if number of modified rows is less than 1", func() {
			mock.ExpectExec(renameVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 0))
			err := repository.RenameVcsToken(mockUserGuid, mockGuid, mockVcsTokenName)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {
			mock.ExpectExec(renameVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))
			err := repository.RenameVcsToken(mockUserGuid, mockGuid, mockVcsTokenName)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}
func TestDeleteVcsToken(t *testing.T) {

	Convey("DeleteVcsToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception when attemping to delete a non-existent token", func() {
			mock.ExpectExec(deleteVcsTokenQuery).
				WillReturnError(errors.New("doesnt exist"))
			err := repository.DeleteVcsToken(mockUserGuid, mockGuid)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should throw an exception if number of modified rows is less than 1", func() {
			mock.ExpectExec(deleteVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 0))
			err := repository.DeleteVcsToken(mockUserGuid, mockGuid)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {
			mock.ExpectExec(deleteVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))
			err := repository.DeleteVcsToken(mockUserGuid, mockGuid)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}

func TestListVcsTokenByUser(t *testing.T) {

	Convey("ListVcsTokenByUser Tests", t, func() {

		row := sqlmock.NewRows([]string{"t.guid", "t.user_guid",
			"t.vcs_guid", "t.name", "t.token", "v.guid", "v.label",
			"v.type", "v.browse_url", "v.api_url", "v.skip_ssl_validation"}).
			AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken,
			mockGuid, mockVcsTokenName, "github", mockUrl, mockUrl, true)


		db, mock, repository := initialiseRepo(t)

		Convey("should throw exception when no tokens exist for user", func() {
			mock.ExpectQuery(listVcsTokensByUserQuery).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.ListVcsTokenByUser(mockUserGuid, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should fail to decrypt with invalid encryptionKey", func() {

			mock.ExpectQuery(listVcsTokensByUserQuery).
				WillReturnRows(row)
			_, err := repository.ListVcsTokenByUser(mockUserGuid, nil)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("success case", func() {
			row := sqlmock.NewRows([]string{"t.guid", "t.user_guid",
				"t.vcs_guid", "t.name", "t.token", "v.guid", "v.label",
				"v.type", "v.browse_url", "v.api_url", "v.skip_ssl_validation"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken,
				mockGuid, mockVcsTokenName, "github", mockUrl, mockUrl, true)

			mock.ExpectQuery(listVcsTokensByUserQuery).
				WillReturnRows(row)
			rs, err := repository.ListVcsTokenByUser(mockUserGuid, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(rs, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}
