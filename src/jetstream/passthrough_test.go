package main

import (
	"errors"
	"net/http"
	"net/url"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/testutils"
)

func TestPassthroughDoRequest(t *testing.T) {
	t.Parallel()

	Convey("Passthrough request tests", t, func() {
		mockCFServer := setupMockServer(t,
			msRoute("/v2/info"),
			msMethod("GET"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockV2InfoResponse)))
		defer mockCFServer.Close()

		uri, err := url.Parse(mockCFServer.URL + "/v2/info")
		So(err, ShouldBeNil)

		mockCNSIRequest := api.CNSIRequest{
			GUID:     mockCFGUID,
			UserGUID: mockUserGUID,
			Method:   "GET",
			URL:      uri,
		}

		var mockTokenRecord = api.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  mockTokenExpiry,
		}
		// pp.CNSIs[mockCNSIGuid] = mockCNSI

		// setup mocks
		req := setupMockReq("POST", "", map[string]string{})
		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCFGUID, mockUserGUID).
			WillReturnRows(testutils.ExpectNoRows())

		// set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectExec(insertIntoTokens).
			//	WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		err = pp.setCNSITokenRecord(mockCFGUID, mockUserGUID, mockTokenRecord)

		Convey("Should be able to set CNSI token records", func() {
			So(err, ShouldBeNil)
		})

		Convey("should have all expectations met when savign token", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		// TODO(wchrisjohnson): document what is happening here for the sake of Golang newcomers
		done := make(chan *api.CNSIRequest)

		// Set up database expectation for pp.doOauthFlowRequest
		//  p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCFGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectEncryptedTokenRow(pp.Config.EncryptionKeyInBytes))

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCFGUID).
			WillReturnRows(expectCFRow())

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCFGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectEncryptedTokenRow(pp.Config.EncryptionKeyInBytes))

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCFGUID).
			WillReturnRows(expectCFRow())

		go pp.doRequest(&mockCNSIRequest, done)

		newCNSIRequest := <-done

		// verify expectations met
		Convey("should have all expectations met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("should not have a new CNSI Request error", func() {
			So(newCNSIRequest.Error, ShouldBeNil)
		})

		Convey("CNSI Request must be identical to expected response", func() {
			So(B2S(newCNSIRequest.Response), ShouldEqual, jsonMust(mockV2InfoResponse))
		})
	})
}

func B2S(bs []byte) string {
	return string(bs[:])
}

func TestPassthroughGetEchoURL(t *testing.T) {
	t.Parallel()
	Convey("should have correct URI", t, func() {

		req := setupMockReq("GET", "", nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()

		uri := getEchoURL(ctx)

		So(uri.String(), ShouldEqual, mockURLString)
	})

}

func TestPassthroughGetEchoHeaders(t *testing.T) {
	t.Parallel()

	Convey("Should have correct headers", t, func() {
		fakeHeaderKey := "Content-Type"
		fakeHeaderValue := "application/x-www-form-urlencoded"

		req := setupMockReq("GET", "", nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()

		req.Header.Set(fakeHeaderKey, fakeHeaderValue)

		header := getEchoHeaders(ctx)

		_, ok := header[fakeHeaderKey]

		So(ok, ShouldNotBeNil)

		So(header[fakeHeaderKey][0], ShouldEqual, fakeHeaderValue)
	})
}

func TestPassthroughMakeRequestURI(t *testing.T) {
	t.Parallel()

	Convey("Creation of request URI should succeed", t, func() {
		fakeURL := "http://localhost/v1/proxy/v2/info/"

		req := setupMockReq("GET", fakeURL, nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()

		uri := makeRequestURI(ctx)

		So(uri.String(), ShouldEqual, fakeURL)
	})
}

func TestPassthroughGetPortalUserGUID(t *testing.T) {
	t.Parallel()

	Convey("User ID from portal should be correct", t, func() {

		var fakeUserGUID = "fake-users-guid"

		req := setupMockReq("GET", "", nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()
		ctx.Set("user_id", fakeUserGUID)

		userGUID, err := getPortalUserGUID(ctx)
		So(err, ShouldBeNil)
		So(userGUID, ShouldEqual, fakeUserGUID)
	})
}

func TestPassthroughGetPortalUserGUIDWhenCorruptedSession(t *testing.T) {
	t.Parallel()

	Convey("should fail to get portal user Guid from invalid session", t, func() {
		req := setupMockReq("GET", "", nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()

		_, err := getPortalUserGUID(ctx)
		So(err, ShouldNotBeNil)
	})
}

func TestPassthroughGetRequestParts(t *testing.T) {
	t.Parallel()

	Convey("passthrough get request parts should not error", t, func() {
		req := setupMockReq("GET", "", nil)
		_, _, ctx, _, db, _ := setupHTTPTest(req)
		defer db.Close()

		_, _, err := getRequestParts(ctx)

		So(err, ShouldBeNil)
	})
}

func TestPassthroughBuildCNSIRequest(t *testing.T) {
	t.Parallel()

	Convey("Passthrough request should succeed", t, func() {
		expectedCNSIRequest := api.CNSIRequest{
			GUID:     mockCFGUID,
			UserGUID: "user1",
			Method:   "GET",
			Body:     nil,
			Header:   nil,
		}

		var cr api.CNSIRequest

		req := setupMockReq("GET", "", nil)
		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()
		r := ctx.Request()

		var ur *url.URL
		ur, _ = url.Parse(mockAPIEndpoint)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCFGUID).
			WillReturnRows(expectCFRow())

		cr, err := pp.buildCNSIRequest(expectedCNSIRequest.GUID, expectedCNSIRequest.UserGUID, r.Method, ur, expectedCNSIRequest.Body, expectedCNSIRequest.Header)

		So(err, ShouldBeNil)

		Convey("All expectations should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Request GUID should equal expected GUID", func() {
			So(cr.GUID, ShouldEqual, expectedCNSIRequest.GUID)
		})

		Convey("Request Method should equal expected Method", func() {
			So(cr.Method, ShouldEqual, expectedCNSIRequest.Method)
		})

		Convey("Request UserGUID should equal expected UserGUID", func() {
			So(cr.UserGUID, ShouldEqual, expectedCNSIRequest.UserGUID)
		})
	})
}

func TestValidateCNSIListWithValidGUID(t *testing.T) {
	t.Parallel()

	Convey("should succeed with valid CNSI Guid", t, func() {

		var cnsiGUIDList []string
		cnsiGUIDList = append(cnsiGUIDList, "valid-guid-abc123")

		req := setupMockReq("GET", "", nil)
		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "allow_sso", "sub_type", "meta_data", "", "ca_cert"}).
			AddRow("valid-guid-abc123", "mock-name", "cf", "http://localhost", "http://localhost", "http://localhost", mockDopplerEndpoint, true, mockClientId, cipherClientSecret, true, "", "", "", "")
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs("valid-guid-abc123").
			WillReturnRows(expectedCNSIRecordRow)
		So(pp.validateCNSIList(cnsiGUIDList), ShouldBeNil)
		Convey("should have all expectations met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})
	})

}

func TestValidateCNSIListWithInvalidGUID(t *testing.T) {
	t.Parallel()

	Convey("should fail with invalid CNSI Guid", t, func() {
		var cnsiGUIDList []string
		cnsiGUIDList = append(cnsiGUIDList, "fake-guid-abc123")

		req := setupMockReq("GET", "", nil)
		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// Mock a database error
		mock.ExpectQuery(selectAnyFromCNSIs).
			WillReturnError(errors.New("Unknown Database Error"))
		So(pp.validateCNSIList(cnsiGUIDList), ShouldNotBeNil)

		Convey("should have all expectations met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

	})

}
