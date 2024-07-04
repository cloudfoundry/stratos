package main

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/cloudfoundry-community/stratos/src/jetstream/testutils"
	. "github.com/smartystreets/goconvey/convey"
	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"
)

// TODO(wchrisjohnson): check that Authorization header starts with "bearer "

func TestDoOauthFlowRequestWithValidToken(t *testing.T) {
	t.Parallel()

	Convey("Test OAuth workflow with valid tokens", t, func() {

		var failFirst = false
		var tokenExpiration = time.Now().AddDate(0, 0, 1).Unix()

		// setup mock UAA server
		mockUAA := setupMockServer(
			t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		// setup mock CF server
		numReqs := 0
		mockCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if numReqs == 0 && failFirst {
				w.WriteHeader(http.StatusUnauthorized)
				numReqs++
				return
			}

			if "/v2/info" != r.URL.Path {
				t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
			}
			if "GET" != r.Method {
				t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
			}
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "hi")
			numReqs++
			return
		})) // end of mockCF

		defer mockCF.Close()

		// do a GET against the CF mock server
		req, _ := http.NewRequest("GET", mockCF.URL+"/v2/info", nil)

		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		var mockTokenRecord = api.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		// set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount).
			WillReturnRows(testutils.ExpectNoRows())

		mock.ExpectExec(insertIntoTokens).
			//WithArgs(testutils.MockCFGUID, testutils.MockAccount, "cnsi", encryptedToken, encryptedToken, mockTokenRecord.TokenExpiry). // TODO: figure out why tokens mismatch on this test when this line is called
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(testutils.MockCFGUID, testutils.MockAccount, mockTokenRecord)

		// Set up database expectation for pp.doOauthFlowRequest
		//  p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := testutils.GetTokenRows(pp.Config.EncryptionKeyInBytes)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)

		r1 := testutils.GetTestCNSIRecord()
		r1.SSOAllowed = true

		expectedCNSIRecordRow := testutils.GetCNSIRows(r1)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(testutils.MockCFGUID).
			WillReturnRows(expectedCNSIRecordRow)

		res, err := pp.DoOAuthFlowRequest(&api.CNSIRequest{
			GUID:     testutils.MockCFGUID,
			UserGUID: testutils.MockAccount,
		}, req)

		Convey("Oauth flow request failed", func() {
			So(err, ShouldBeNil)
		})

		Convey("Expectation should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Oauth flow request failed with invalid response or status", func() {
			So(res, ShouldNotBeNil)
			So(res.StatusCode, ShouldEqual, 200)
		})

		expectReqs := 1
		if failFirst {
			expectReqs = 2
		}

		Convey("Oauth flow request failed with invalid number of requests", func() {
			So(numReqs, ShouldEqual, expectReqs)
		})
	})

}

func TestDoOauthFlowRequestWithExpiredToken(t *testing.T) {
	t.Parallel()

	Convey("Test OAuth workflow with expired token", t, func() {

		var failFirst = false
		var tokenExpiration = time.Now().AddDate(0, 0, -1).Unix()

		// setup mock UAA server
		mockUAA := setupMockServer(
			t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		// setup mock CF server
		numReqs := 0
		mockCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if numReqs == 0 && failFirst {
				w.WriteHeader(http.StatusUnauthorized)
				numReqs++
				return
			}

			if "/v2/info" != r.URL.Path {
				t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
			}
			if "GET" != r.Method {
				t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
			}
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "hi")
			numReqs++
			return
		})) // end of mockCF

		// close this explicitly here so we can thread-safely check the bool
		defer mockCF.Close()

		// do a GET against the CF mock server
		req, _ := http.NewRequest("GET", mockCF.URL+"/v2/info", nil)

		// pp.CNSIs[testutils.MockCFGUID] = mockCNSI

		var mockTokenRecord = api.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCNSIGUID, testutils.MockAccount).
			WillReturnRows(testutils.ExpectNoRows())

		mock.ExpectExec(insertIntoTokens).
			//WithArgs(testutils.MockCFGUID, testutils.MockAccount, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(testutils.MockCNSIGUID, testutils.MockAccount, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := testutils.GetTokenRowsWithExpiredToken(pp.Config.EncryptionKeyInBytes)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCNSIGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		r1 := testutils.GetTestCNSIRecord()
		r1.AuthorizationEndpoint = mockUAA.URL
		r1.TokenEndpoint = mockUAA.URL
		r1.SSOAllowed = true

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := testutils.GetCNSIRows(r1)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(testutils.MockCNSIGUID).
			WillReturnRows(expectedCNSIRecordRow)

		expectedCNSITokenRecordRow := testutils.GetTokenRowsWithExpiredToken(pp.Config.EncryptionKeyInBytes)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCNSIGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRecordRow)

		// A token refresh attempt will be made - which is just an update
		mock.ExpectExec(updateTokens).
			WillReturnResult(sqlmock.NewResult(1, 1))

		//
		res, err := pp.DoOAuthFlowRequest(&api.CNSIRequest{
			GUID:     testutils.MockCNSIGUID,
			UserGUID: testutils.MockAccount,
		}, req)

		Convey("Oauth flow request failed", func() {
			So(err, ShouldBeNil)
		})

		Convey("Expectation should be met", func() {
			So(mock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("Oauth flow request failed with invalid response or status", func() {
			So(res, ShouldNotBeNil)
			So(res.StatusCode, ShouldEqual, 200)
		})

		expectReqs := 1
		if failFirst {
			expectReqs = 2
		}

		Convey("Oauth flow request failed with invalid number of requests", func() {
			So(numReqs, ShouldEqual, expectReqs)
		})

	})

}

func TestDoOauthFlowRequestWithFailedRefreshMethod(t *testing.T) {
	t.Parallel()

	Convey("Test Oauth Flow Request wieth failed refresh method", t, func() {

		var failFirst = false
		var tokenExpiration = time.Now().AddDate(0, 0, -1).Unix()

		// setup mock UAA server
		mockUAA := setupMockServer(
			t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		// setup mock CF server
		numReqs := 0
		mockCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if numReqs == 0 && failFirst {
				w.WriteHeader(http.StatusUnauthorized)
				numReqs++
				return
			}

			if "/v2/info" != r.URL.Path {
				t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
			}
			if "GET" != r.Method {
				t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
			}
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "hi")
			numReqs++
			return
		})) // end of mockCF

		// do a GET against the CF mock server
		req, _ := http.NewRequest("GET", mockCF.URL+"/v2/info", nil)

		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// pp.CNSIs[testutils.MockCFGUID] = mockCNSI

		var mockTokenRecord = api.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount).
			WillReturnRows(testutils.ExpectNoRows())

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectExec(insertIntoTokens).
			//WithArgs(testutils.MockCFGUID, testutils.MockAccount, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(testutils.MockCFGUID, testutils.MockAccount, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := testutils.GetTokenRowsWithExpiredToken(pp.Config.EncryptionKeyInBytes)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		r1 := testutils.GetTestCNSIRecord()
		r1.SSOAllowed = true

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := testutils.GetCNSIRows(r1)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(testutils.MockCFGUID).
			WillReturnRows(expectedCNSIRecordRow)

		mock.ExpectQuery(selectAnyFromTokens).
			WillReturnError(errors.New("Unknown Database Error"))

		//
		_, err := pp.DoOAuthFlowRequest(&api.CNSIRequest{
			GUID:     testutils.MockCFGUID,
			UserGUID: testutils.MockAccount,
		}, req)

		Convey("Oauth flow request erroneously succeeded", func() {
			So(err, ShouldNotBeNil)
		})

		mockCF.Close()

	})

}

func TestDoOauthFlowRequestWithValidTokenFailFirst(t *testing.T) {
	t.Skip("Skipping for now.")
	t.Parallel()

	// This method no longer exists due to use of sql-mock.
	// testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, 1).Unix())
}

func TestDoOauthFlowRequestWithExpiredTokenFailFirst(t *testing.T) {
	t.Skip("Skipping for now.")
	t.Parallel()

	// This method no longer exists due to use of sql-mock.
	// testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, -1).Unix())
}

func TestDoOauthFlowRequestWithMissingCNSITokenRecord(t *testing.T) {
	t.Skip("Skipping for now - need to verify whether still needed.")
	t.Parallel()

	req, _ := http.NewRequest("GET", "/v2/info", nil)
	pp := setupPortalProxy(nil)

	var mockTokenRecord = api.TokenRecord{
		AuthToken:   mockUAAToken,
		TokenExpiry: 0,
	}
	pp.setCNSITokenRecord("not-the-right-guid", testutils.MockAccount, mockTokenRecord)

	_, err := pp.DoOAuthFlowRequest(&api.CNSIRequest{
		GUID:     testutils.MockCFGUID,
		UserGUID: testutils.MockAccount,
	}, req)

	Convey("Oauth flow request erroneously succeeded", func() {
		So(err, ShouldNotBeNil)
	})

}

func TestDoOauthFlowRequestWithInvalidCNSIRequest(t *testing.T) {
	t.Parallel()

	Convey("Test Oauth flow request with invalid CNSI request", t, func() {

		var failFirst = false
		numReqs := 0
		mockCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if numReqs == 0 && failFirst {
				w.WriteHeader(http.StatusUnauthorized)
				numReqs++
				return
			}

			if "/v2/info" != r.URL.Path {
				t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
			}
			if "GET" != r.Method {
				t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
			}
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "hi")
			numReqs++
			return
		})) // end of mockCF

		req, _ := http.NewRequest("GET", mockCF.URL+"/v2/info", nil)

		pp := setupPortalProxy(nil)

		invalidCNSIRequest := &api.CNSIRequest{
			GUID:     "",
			UserGUID: "",
		}

		_, err := pp.DoOAuthFlowRequest(invalidCNSIRequest, req)

		Convey("Oauth flow request erroneously succeeded", func() {
			So(err, ShouldNotBeNil)
		})

		mockCF.Close()
	})

}

func TestRefreshTokenWithInvalidRefreshToken(t *testing.T) {
	t.Parallel()

	Convey("Test refresh of token with invalid refresh token", t, func() {

		cnsiGUID := testutils.MockCFGUID
		userGUID := testutils.MockAccount
		client := "mock-client"
		clientSecret := "secret"
		invalidTokenEndpoint := ""

		// setup database mocks
		db, mock, dberr := sqlmock.New()
		if dberr != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
		}
		defer db.Close()

		pp := setupPortalProxy(db)
		pp.DatabaseConnectionPool = db

		// Setup for getCNSITokenRecord
		tokenExpiration := time.Now().AddDate(0, 0, 1).Unix()
		expectedCNSITokenRow := testutils.GetEmptyTokenRows("token_guid", "user_guid", "linked_token").
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, true, "OAuth2", "", false)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount).
			WillReturnRows(expectedCNSITokenRow)

		_, err := pp.RefreshOAuthToken(true, cnsiGUID, userGUID, client, clientSecret, invalidTokenEndpoint)
		Convey("Oauth flow request erroneously succeeded", func() {
			So(err, ShouldNotBeNil)
		})

	})

}

func TestRefreshTokenWithDatabaseErrorOnSave(t *testing.T) {
	t.Parallel()

	Convey("Test refreshing of token with DB error", t, func() {
		var failFirst = false
		var tokenExpiration = time.Now().AddDate(0, 0, -1).Unix()

		// setup mock UAA server
		mockUAA := setupMockServer(
			t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		// setup mock CF server
		numReqs := 0
		mockCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if numReqs == 0 && failFirst {
				w.WriteHeader(http.StatusUnauthorized)
				numReqs++
				return
			}

			if "/v2/info" != r.URL.Path {
				t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
			}
			if "GET" != r.Method {
				t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
			}
			w.WriteHeader(http.StatusOK)
			io.WriteString(w, "hi")
			numReqs++
			return
		})) // end of mockCF

		// do a GET against the CF mock server
		req, _ := http.NewRequest("GET", mockCF.URL+"/v2/info", nil)

		// pp.CNSIs[testutils.MockCFGUID] = mockCNSI

		var mockTokenRecord = api.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		// setup database mocks
		db, mock, dberr := sqlmock.New()
		if dberr != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
		}
		defer db.Close()

		pp := setupPortalProxy(db)
		pp.DatabaseConnectionPool = db

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount).
			WillReturnRows(testutils.ExpectNoRows())

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectExec(insertIntoTokens).
			//WithArgs(testutils.MockCFGUID, testutils.MockAccount, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(testutils.MockCFGUID, testutils.MockAccount, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := testutils.GetEmptyTokenRows("token_guid", "user_guid", "linked_token").
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, false, "OAuth2", "", false)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		r1 := testutils.GetTestCNSIRecord()
		r1.SSOAllowed = true

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := testutils.GetCNSIRows(r1)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(testutils.MockCFGUID).
			WillReturnRows(expectedCNSIRecordRow)

		expectedCNSITokenRecordRow := testutils.GetEmptyTokenRows("token_guid", "user_guid", "linked_token").
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, false, "OAuth2", "", false)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(expectedCNSITokenRecordRow)

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(testutils.MockCFGUID, testutils.MockAccount, testutils.MockAdminGUID).
			WillReturnRows(testutils.ExpectOneRow())

		// p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
		//   p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
		//     tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t)
		mock.ExpectExec(updateTokens).
			WillReturnError(errors.New("Unknown Database Error"))
		//
		_, err := pp.DoOAuthFlowRequest(&api.CNSIRequest{
			GUID:     testutils.MockCFGUID,
			UserGUID: testutils.MockAccount,
		}, req)

		Convey("Oauth flow request erroneously succeeded", func() {
			So(err, ShouldNotBeNil)
		})

		mockCF.Close()

	})

}
