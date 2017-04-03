package main

import (
	"testing"
	"errors"

	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
	"encoding/json"
	"github.com/hpcloud/portal-proxy/repository/vcs"
	"github.com/hpcloud/portal-proxy/repository/vcstokens"
)

const (
	mockGuid = "fooGuid"
	mockLabel = "fooLabel"
	mockType = "github"
	mockUrl = "https://foo.bar"
	mockUserGuid = "mockUser"
	mockVcsGuid = "mockVcs"
	mockVcsTokenName = "mockVcsToken"
	mockToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3YyIsInN1YiI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsInNjb3BlIjpbIm9wZW5pZCIsInNjaW0ucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIuYWRtaW4iLCJ1YWEudXNlciIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwicm91dGluZy5yb3V0ZXJfZ3JvdXBzLnJlYWQiLCJjbG91ZF9jb250cm9sbGVyLndyaXRlIiwiZG9wcGxlci5maXJlaG9zZSIsInNjaW0ud3JpdGUiXSwiY2xpZW50X2lkIjoiY2YiLCJjaWQiOiJjZiIsImF6cCI6ImNmIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9pZCI6Ijg4YmNlYWE1LWJkY2UtNDdiOC04MmYzLTRhZmMxNGYyNjZmOSIsIm9yaWdpbiI6InVhYSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbiIsImF1dGhfdGltZSI6MTQ2Nzc2OTgxNiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiaWF0IjoxNDY3NzY5ODE2LCJleHAiOjE0Njc3NzA0MTYsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.q2u0JX42Qiwr0ZsBU5Y6bF74_0URWmmBYTLf8l7of_6huFoMkyqvirEYcbYbATt6Hz2zcN6xlXcInALxQ6nt6Jk01kZHRNYfuu6QziLHHw2o_dJWk9iipiermUze7BvSGtU_JXx45BSBNVFxvRxG9Yv54Lwa9FvyhMSmK3CI5S8NtVDchzrsH3sMsIjlTAb-L7sch-OOQ7ncWH1JoGMtw8sTbiaHvfNJQclSq8Ro11NUtRHiWeGFFxYIerzKO-TrSpDojFJrYVuK1m0YPmBDa_dY3cneRuppagRIn8oI0VFHF8BckrIqNCHvOMoVz6uzHebo9LK7H5z5SluxJ2vYUgPiHE_Tyo-7gELnNSy8qL4Bk9yTxNseeGiq13TSTGOtNnbrv1eq4ZeW7eafseLceKIZH2QZlXVzwd_aWbuKRv9ApDwy4AcSbpM0XtU89IjUEDoOf3IDWV2YZTZkEaXZ52Mhztb1O_IVpHyyks88P67RoANFt83MnCai9U3stCX45LEsg9oz2djrVnfHDzRNQVlg9hKJYbxsa2R5tpnftjhz-hfpsoPRxBkJDKM2islyd-gLqHtsERiZEoifu93VRE0Jvk6vaCNdStw7y4mq73Co6ykNUYA78SlT9lCwDJRQHTJiDWg33EeKpXne8joZbElwrKNcv93X1qxxvmp1wXQ bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImxlZ2FjeS10b2tlbi1rZXkiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiI2ZGIyYTI5NGYyYWE0OGNlYjI1NDgzMDk4ZDNjY2Q3Yy1yIiwic3ViIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5Iiwic2NvcGUiOlsib3BlbmlkIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIiwiY2xvdWRfY29udHJvbGxlci5yZWFkIiwicGFzc3dvcmQud3JpdGUiLCJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIud3JpdGUiLCJkb3BwbGVyLmZpcmVob3NlIiwic2NpbS53cml0ZSJdLCJpYXQiOjE0Njc3Njk4MTYsImV4cCI6MTQ3MDM2MTgxNiwiY2lkIjoiY2YiLCJjbGllbnRfaWQiOiJjZiIsImlzcyI6Imh0dHBzOi8vdWFhLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiemlkIjoidWFhIiwiZ3JhbnRfdHlwZSI6InBhc3N3b3JkIiwidXNlcl9uYW1lIjoiYWRtaW4iLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX2lkIjoiODhiY2VhYTUtYmRjZS00N2I4LTgyZjMtNGFmYzE0ZjI2NmY5IiwicmV2X3NpZyI6IjE0MGUwMjZiIiwiYXVkIjpbImNmIiwib3BlbmlkIiwic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJ1YWEiLCJwYXNzd29yZCIsInJvdXRpbmcucm91dGVyX2dyb3VwcyIsImRvcHBsZXIiXX0.K5M_isGkEBAN_MaXqkVvJfHG86rGIUkDgsHaFnoKOA1x5FNC4APDvhImWJZ8zbFHhXT3PYHTyeSf_HQaFDFUHFvGZUhSSry2ID4kdU5kRyZ-y3ydkv2mq32BlUQBSC9ap0r5vFTv7BY1yf2EcDaKGe4v4ODMhTm2SIkdTyk2ZcLXHIucS0xgSZdjgxNqh3pnKtmcFkw72-CyREW4_2Nbvn_7U2UNUCb2SeAuWmYaNAOkuGveB8jAhg9ftTrxn5GNtNe1sdVycm51X1O0dGPt_rLbwkRDCdNpm0La_xzLqZEl60_YUqwo33eOChFgqXB5y_0Pzs9gD__uExrIXYIgMsltFELXryyRUDKTTHZEEw1bnLTbQfF-GAnS0E0CaTU_kcDVqDYcqfh0TCcr7nGCEozExMPm3J0OGUSP3FQAD5mDICsKKcSIi_kIjggkJ87tuNAY6QOW1WzBoRizXJVS4jb3QOnrii2LmH786qBYJMX0nH__JRYEU-HWLi_OGXVTo03Pe9QcB8qJvbu2DGRfQdBfjhvgt2AItY4voJnZcjwT29q144C5wvJ2_W8cUzNY-Xw_tN_fWK4LWCu6KRNLVLO2MNbl0aOfkvb1U5NZJUpUUC2jG3cZM2c8232YNFKVjdjbf-Mlx17OxOYQ5XtG5BiSEj7BA6s5hWftUXEUchg`
	listVcsClientsQuery = "SELECT guid, label, type, browse_url, api_url, skip_ssl_validation FROM vcs"
	deleteVcsQuery = "DELETE FROM vcs"
	listVcsTokensByUserQuery = "SELECT t.guid, t.user_guid, t.vcs_guid, t.name, t.token, v.guid, v.label, v.type, v.browse_url, v.api_url, v.skip_ssl_validation FROM vcs v, vcs_tokens t"
	findVcsTokenQuery = "SELECT guid, user_guid, vcs_guid, name, token FROM vcs_tokens"
	renameVcsTokenQuery = "UPDATE vcs_tokens"
	deleteVcsTokenQuery = "DELETE FROM vcs_tokens"

)

// Test helpers

func TestListVcsClients(t *testing.T) {

	Convey("listVcsClients tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",

		})
		res, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectQuery(listVcsClientsQuery).
				WillReturnError(errors.New("unable to list"))

			err := pp.listVCSClients(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			r := sqlmock.NewRows([]string{"guid", "label", "type", "browse_url",
				"api_url", "skip_ssl_validation"}).
				AddRow(mockGuid, mockLabel, mockType, mockUrl, mockUrl, true)

			mock.ExpectQuery(listVcsClientsQuery).
				WillReturnRows(r)

			err := pp.listVCSClients(ctx)

			vs := make([]vcs.VcsRecord, 0)
			json.Unmarshal(res.Body.Bytes(), &vs )

			So(err, ShouldBeNil)
			So(vs, ShouldHaveLength, 1)
			So(vs[0].Guid, ShouldResemble, mockGuid)
		})

		Reset(func() {
			db.Close()
		})
	})
}

func TestDeleteVcsClients(t *testing.T) {

	Convey("listVcsClients tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectExec(deleteVcsQuery).
				WillReturnError(errors.New("unable to delete"))

			err := pp.deleteVCSClient(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			mock.ExpectExec(deleteVcsQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))

			err := pp.deleteVCSClient(ctx)

			So(err, ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})
}

func TestListVcsTokens(t *testing.T) {

	Convey("listVcsTokens tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		res, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectQuery(listVcsTokensByUserQuery).
				WillReturnError(errors.New("unable to delete"))

			ctx.Set("user_id", "user")
			err := pp.listVcsTokens(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			row := sqlmock.NewRows([]string{"t.guid", "t.user_guid",
				"t.vcs_guid", "t.name", "t.token", "v.guid", "v.label",
				"v.type", "v.browse_url", "v.api_url", "v.skip_ssl_validation"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken,
				mockGuid, mockVcsTokenName, "github", mockUrl, mockUrl, true)

			mock.ExpectQuery(listVcsTokensByUserQuery).
				WillReturnRows(row)

			ctx.Set("user_id", "user")
			err := pp.listVcsTokens(ctx)

			vs := make([]vcstokens.VcsTokenRecord, 0)
			json.Unmarshal(res.Body.Bytes(), &vs)

			So(err, ShouldBeNil)
			So(vs, ShouldHaveLength, 1)
		})

		Reset(func() {
			db.Close()
		})
	})
}
func TestGetVcsToken(t *testing.T) {

	Convey("getVcsToken tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception because required header is missing", func() {

			ctx.Set("user_id", "user")
			_, err := pp.getVcsToken(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnError(errors.New("unable to delete"))

			ctx.Set("user_id", "user")
			ctx.Request().Header().Set(TOKEN_GUID_HEADER, "some-value")
			_, err := pp.getVcsToken(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			row := sqlmock.NewRows([]string{"guid", "user_guid", "vcs_guid", "name", "token"}).
				AddRow(mockGuid, mockUserGuid, mockVcsGuid, mockVcsTokenName, mockToken)

			mock.ExpectQuery(findVcsTokenQuery).
				WillReturnRows(row)
			ctx.Request().Header().Set(TOKEN_GUID_HEADER, "some-value")
			ctx.Set("user_id", "user")
			vt, err := pp.getVcsToken(ctx)

			So(err, ShouldBeNil)
			So(vt.Guid, ShouldEqual, mockGuid)
			So(vt.Name, ShouldEqual, mockVcsTokenName)
		})

		Reset(func() {
			db.Close()
		})
	})
}
// Test got GetVCS
func TestRenameVcsToken(t *testing.T) {

	Convey("renameVcsToken tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectExec(renameVcsTokenQuery).
				WillReturnError(errors.New("unable to delete"))

			ctx.Set("user_id", "user")
			err := pp.renameVcsToken(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			mock.ExpectExec(renameVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))
			ctx.Set("user_id", "user")
			err := pp.renameVcsToken(ctx)

			So(err, ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})
}

func TestDeleteVcsToken(t *testing.T) {

	Convey("deleteVcsToken tests", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)

		Convey("Should throw an exception if a DB error occurrs", func() {

			mock.ExpectExec(deleteVcsTokenQuery).
				WillReturnError(errors.New("unable to delete"))

			ctx.Set("user_id", "user")
			err := pp.deleteVcsToken(ctx)

			So(err, ShouldNotBeNil)
		})

		Convey("Should succeed", func() {

			mock.ExpectExec(deleteVcsTokenQuery).
				WillReturnResult(sqlmock.NewResult(1, 1))
			ctx.Set("user_id", "user")
			err := pp.deleteVcsToken(ctx)

			So(err, ShouldBeNil)
		})

		Reset(func() {
			db.Close()
		})
	})
}