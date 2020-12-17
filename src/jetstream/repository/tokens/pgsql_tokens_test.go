package tokens

import (
	"database/sql"
	"errors"
	"log"
	"testing"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

const (
	mockUAAToken        = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`
	mockCNSIToken       = mockUAAToken
	mockTokenGUID       = "mock-token-guid"
	mockUserGuid        = "foo-bar"
	mockCNSIGuid        = "foo-bar"
	countTokensSql      = `SELECT COUNT`
	insertTokenSql      = `INSERT INTO tokens`
	updateUAATokenSql   = `UPDATE tokens`
	findTokenSql        = `SELECT token_guid, auth_token, refresh_token, token_expiry, disconnected, auth_type, meta_data, user_guid, linked_token, enabled FROM tokens .*`
	findUAATokenSql     = `SELECT token_guid, auth_token, refresh_token, token_expiry, auth_type, meta_data, enabled FROM tokens WHERE token_type = 'uaa' AND .*`
	deleteFromTokensSql = `DELETE FROM tokens`
)

var mockTokenExpiry = time.Now().AddDate(0, 0, 1).Unix()
var mockEncryptionKey = make([]byte, 32)
var tokenRecord = interfaces.TokenRecord{
	AuthToken:    mockUAAToken,
	RefreshToken: mockUAAToken,
	TokenExpiry:  mockTokenExpiry,
}

func initialiseRepo(t *testing.T) (*sql.DB, sqlmock.Sqlmock, interfaces.TokenRepository) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Errorf("an error '%s' was not expected when opening a stub database connection", err)
	}
	repository, _ := NewPgsqlTokenRepository(db)
	return db, mock, repository
}

func TestSaveUAATokens(t *testing.T) {

	Convey("SaveUAATokens Tests", t, func() {

		Convey("Test expected failures", func() {

			db, _, repository := initialiseRepo(t)

			Convey("should fail to save token with an invalid user GUID", func() {
				var userGuid string = ""
				err := repository.SaveAuthToken(userGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)

			})

			Convey("should fail to save token with an invalid AuthToken", func() {
				tokenRecord.AuthToken = ""
				err := repository.SaveAuthToken(mockUserGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to save token with an invalid RefreshToken", func() {
				tokenRecord.RefreshToken = ""
				err := repository.SaveAuthToken(mockUserGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to encrypt with an invalid encryptionKey", func() {
				err := repository.SaveAuthToken(mockUserGuid, tokenRecord, nil)
				So(err, ShouldNotBeNil)
			})

			Reset(func() {
				tokenRecord = interfaces.TokenRecord{
					AuthToken:    mockUAAToken,
					RefreshToken: mockUAAToken,
					TokenExpiry:  mockTokenExpiry,
				}
				db.Close()
			})

		})

		Convey("Test Insert/Update of token", func() {

			Convey("Insertion of token", func() {

				db, mock, repository := initialiseRepo(t)

				Convey("Should fail to insert due to DB exception", func() {

					mock.ExpectQuery(countTokensSql).
						WillReturnError(errors.New("random error"))

					err := repository.SaveAuthToken(mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldNotBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Convey("Should suceed to insert", func() {

					mock.ExpectQuery(countTokensSql).
						WillReturnRows(sqlmock.NewRows([]string{"0"}))

					mock.ExpectExec(insertTokenSql).
						WithArgs(sqlmock.AnyArg(), mockUserGuid, "uaa", sqlmock.AnyArg(), sqlmock.AnyArg(), tokenRecord.TokenExpiry).
						WillReturnResult(sqlmock.NewResult(1, 1))

					err := repository.SaveAuthToken(mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Reset(func() {
					db.Close()
				})

			})

			Convey("Update of token", func() {

				db, mock, repository := initialiseRepo(t)

				Convey("Should fail to update due to DB exception", func() {

					mock.ExpectQuery(countTokensSql).
						WillReturnError(errors.New("random error"))

					err := repository.SaveAuthToken(mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldNotBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Reset(func() {
					db.Close()
				})

			})

		})

	})

}

func TestSaveCNSITokens(t *testing.T) {

	Convey("SaveCNSIToken Tests", t, func() {

		Convey("Test expected failures", func() {

			db, _, repository := initialiseRepo(t)

			Convey("should fail to save token with an invalid CNSI GUID", func() {
				err := repository.SaveCNSIToken("", mockUserGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to save token with an invalid user GUID", func() {
				err := repository.SaveCNSIToken(mockCNSIGuid, "", tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to save token with an invalid AuthToken", func() {
				tokenRecord.AuthToken = ""
				err := repository.SaveCNSIToken(mockCNSIGuid, mockUserGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to save token with an invalid RefreshToken", func() {
				tokenRecord.RefreshToken = ""
				err := repository.SaveCNSIToken(mockCNSIGuid, mockUserGuid, tokenRecord, mockEncryptionKey)
				So(err, ShouldNotBeNil)
			})

			Convey("should fail to encrypt with an invalid encryptionKey", func() {
				err := repository.SaveCNSIToken(mockCNSIGuid, mockUserGuid, tokenRecord, nil)
				So(err, ShouldNotBeNil)
			})

			Reset(func() {
				tokenRecord = interfaces.TokenRecord{
					AuthToken:    mockUAAToken,
					RefreshToken: mockUAAToken,
					TokenExpiry:  mockTokenExpiry,
				}

				db.Close()
			})

		})

		Convey("Test Insert/Update of token", func() {

			Convey("Insertion of token", func() {

				db, mock, repository := initialiseRepo(t)

				Convey("Should fail to insert due to DB exception", func() {

					mock.ExpectQuery(countTokensSql).
						WillReturnError(errors.New("random error"))

					err := repository.SaveCNSIToken(mockCNSIGuid, mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldNotBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Convey("Should suceed to insert", func() {

					rs := sqlmock.NewRows([]string{"COUNT"}).AddRow("value")
					mock.ExpectQuery(countTokensSql).
						WillReturnRows(rs)

					mock.ExpectExec(insertTokenSql).
						WithArgs(sqlmock.AnyArg(), mockCNSIGuid, mockUserGuid, "cnsi", sqlmock.AnyArg(), sqlmock.AnyArg(), tokenRecord.TokenExpiry, false, "", "", sqlmock.AnyArg()).
						WillReturnResult(sqlmock.NewResult(1, 1))

					err := repository.SaveCNSIToken(mockCNSIGuid, mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Reset(func() {
					db.Close()
				})

			})

			Convey("Update of token", func() {

				db, mock, repository := initialiseRepo(t)

				Convey("Should fail to update due to DB exception", func() {

					mock.ExpectQuery(countTokensSql).
						WillReturnError(errors.New("random error"))

					err := repository.SaveCNSIToken(mockCNSIToken, mockUserGuid, tokenRecord, mockEncryptionKey)
					So(err, ShouldNotBeNil)
					So(mock.ExpectationsWereMet(), ShouldBeNil)
				})

				Reset(func() {
					db.Close()
				})

			})

		})

	})

}

func TestFindUAATokens(t *testing.T) {

	Convey("FindAuthToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to find token with an invalid user GUID", func() {

			_, err := repository.FindAuthToken("", mockEncryptionKey)
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when finding a non-existent token", func() {
			mock.ExpectQuery(findUAATokenSql).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.FindAuthToken(mockUserGuid, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should fail to decrypt with invalid encryptionKey", func() {
			rs := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected"}).
				AddRow(mockUAAToken, mockUAAToken, mockTokenExpiry, false)

			mock.ExpectQuery(findUAATokenSql).
				WillReturnRows(rs)
			_, err := repository.FindAuthToken(mockUserGuid, nil)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Success case", func() {

			rs := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "auth_type", "meta_data", "enabled"}).
				AddRow(mockTokenGUID, mockUAAToken, mockUAAToken, mockTokenExpiry, "oauth", "", true)

			mock.ExpectQuery(findUAATokenSql).
				WillReturnRows(rs)
			tr, err := repository.FindAuthToken(mockUserGuid, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(tr.AuthToken, ShouldNotBeNil)
			So(tr.RefreshToken, ShouldNotBeNil)
			So(tr.TokenExpiry, ShouldEqual, mockTokenExpiry)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}
func TestFindCNSITokens(t *testing.T) {

	Convey("FindAuthToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to find token with an invalid CNSI GUID", func() {

			_, err := repository.FindCNSIToken("", mockUserGuid, mockEncryptionKey)
			log.Print("findUAA returned ", err)

			So(err, ShouldNotBeNil)
		})
		Convey("should fail to find token with an invalid user GUID", func() {

			_, err := repository.FindCNSIToken(mockCNSIToken, "", mockEncryptionKey)
			log.Print("findUAA returned ", err)

			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when finding a non-existent token", func() {
			mock.ExpectQuery(findTokenSql).
				WillReturnError(errors.New("doesnt exist"))
			_, err := repository.FindCNSIToken(mockCNSIToken, mockUserGuid, mockEncryptionKey)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should fail to decrypt with invalid encryptionKey", func() {
			rs := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid"}).
				AddRow(mockUAAToken, mockUAAToken, mockTokenExpiry, false, "oauth", "", mockUserGuid)

			mock.ExpectQuery(findTokenSql).
				WillReturnRows(rs)
			_, err := repository.FindCNSIToken(mockCNSIToken, mockUserGuid, nil)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Success case", func() {
			rs := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token", "enabled"}).
				AddRow(mockTokenGUID, mockUAAToken, mockUAAToken, mockTokenExpiry, false, "oauth", "", mockUserGuid, nil, true)

			mock.ExpectQuery(findTokenSql).
				WillReturnRows(rs)
			tr, err := repository.FindCNSIToken(mockCNSIToken, mockUserGuid, mockEncryptionKey)

			So(err, ShouldBeNil)
			So(tr.AuthToken, ShouldNotBeNil)
			So(tr.RefreshToken, ShouldNotBeNil)
			So(tr.TokenExpiry, ShouldEqual, mockTokenExpiry)
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})

}
func TestDeleteCNSIToken(t *testing.T) {

	Convey("DeleteCNSIToken Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to delete token with an invalid CNSI GUID", func() {
			var cnsiGuid string = ""
			err := repository.DeleteCNSIToken(cnsiGuid, mockUserGuid)
			So(err, ShouldNotBeNil)
		})

		Convey("should fail to delete token with an invalid user GUID", func() {
			err := repository.DeleteCNSIToken(mockCNSIToken, "")
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when encountering DB error", func() {
			mock.ExpectExec(deleteFromTokensSql).
				WillReturnError(errors.New("doesn't exist"))
			err := repository.DeleteCNSIToken(mockCNSIToken, mockUserGuid)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)

		})

		Convey("Test successful path", func() {
			mock.ExpectExec(deleteFromTokensSql).
				WillReturnResult(sqlmock.NewResult(1, 1))
			err := repository.DeleteCNSIToken(mockCNSIToken, mockUserGuid)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)

		})

		Reset(func() {
			db.Close()
		})

	})

}

func TestDeleteCNSITokens(t *testing.T) {

	Convey("DeleteCNSITokens Tests", t, func() {

		db, mock, repository := initialiseRepo(t)

		Convey("should fail to delete token with an invalid CNSI GUID", func() {
			var cnsiGuid string = ""
			err := repository.DeleteCNSITokens(cnsiGuid)
			So(err, ShouldNotBeNil)
		})

		Convey("should throw exception when encountering DB error", func() {
			mock.ExpectExec(deleteFromTokensSql).
				WillReturnError(errors.New("doesn't exist"))
			err := repository.DeleteCNSITokens(mockCNSIToken)

			So(err, ShouldNotBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)

		})

		Convey("Test successful path", func() {
			mock.ExpectExec(deleteFromTokensSql).
				WillReturnResult(sqlmock.NewResult(1, 1))
			err := repository.DeleteCNSITokens(mockCNSIToken)

			So(err, ShouldBeNil)
			So(mock.ExpectationsWereMet(), ShouldBeNil)

		})

		Reset(func() {
			db.Close()
		})

	})

}
