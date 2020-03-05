package main

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
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

		var mockURL *url.URL
		var mockURLasString string
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                  mockCNSIGUID,
			Name:                  "mockCF",
			CNSIType:              "cf",
			APIEndpoint:           mockURL,
			AuthorizationEndpoint: mockUAA.URL,
			TokenEndpoint:         mockUAA.URL,
		}

		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		encryptedToken, _ := crypto.EncryptToken(pp.Config.EncryptionKeyInBytes, mockUAAToken)
		var mockTokenRecord = interfaces.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		mockTokenGUID := "mock-token-guid"

		// set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		mock.ExpectExec(insertIntoTokens).
			//WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedToken, encryptedToken, mockTokenRecord.TokenExpiry). // TODO: figure out why tokens mismatch on this test when this line is called
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

		// Set up database expectation for pp.doOauthFlowRequest
		//  p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token"}).
			AddRow(mockTokenGUID, encryptedToken, encryptedToken, tokenExpiration, false, "OAuth2", "", mockUserGUID, nil)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)

		expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "allow_sso", "sub_type", "meta_data"}).
			AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockCNSI.DopplerLoggingEndpoint, true, mockCNSI.ClientId, cipherClientSecret, true, "", "")
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRecordRow)

		res, err := pp.DoOAuthFlowRequest(&interfaces.CNSIRequest{
			GUID:     mockCNSIGUID,
			UserGUID: mockUserGUID,
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

		var mockURL *url.URL
		var mockURLasString string
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                  mockCNSIGUID,
			Name:                  "mockCF",
			CNSIType:              "cf",
			APIEndpoint:           mockURL,
			AuthorizationEndpoint: mockUAA.URL,
			TokenEndpoint:         mockUAA.URL,
		}
		// pp.CNSIs[mockCNSIGuid] = mockCNSI

		var mockTokenRecord = interfaces.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}

		mockTokenGUID := "mock-token-guid"

		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()
		encryptedUAAToken, _ := crypto.EncryptToken(pp.Config.EncryptionKeyInBytes, mockUAAToken)

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		mock.ExpectExec(insertIntoTokens).
			//WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token"}).
			AddRow(mockTokenGUID, encryptedUAAToken, encryptedUAAToken, tokenExpiration, false, "OAuth2", "", mockUserGUID, nil)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "allow_sso", "sub_type", "meta_data"}).
			AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockCNSI.DopplerLoggingEndpoint, true, mockCNSI.ClientId, cipherClientSecret, true, "", "")
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRecordRow)

		expectedCNSITokenRecordRow := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token"}).
			AddRow(mockTokenGUID, encryptedUAAToken, encryptedUAAToken, tokenExpiration, false, "OAuth2", "", mockUserGUID, nil)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRecordRow)

		// A token refresh attempt will be made - which is just an update
		mock.ExpectExec(updateTokens).
			WillReturnResult(sqlmock.NewResult(1, 1))

		//
		res, err := pp.DoOAuthFlowRequest(&interfaces.CNSIRequest{
			GUID:     mockCNSIGUID,
			UserGUID: mockUserGUID,
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

		var mockURL *url.URL
		var mockURLasString string
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                  mockCNSIGUID,
			Name:                  "mockCF",
			CNSIType:              "cf",
			APIEndpoint:           mockURL,
			AuthorizationEndpoint: mockUAA.URL,
			TokenEndpoint:         mockUAA.URL,
		}
		// pp.CNSIs[mockCNSIGuid] = mockCNSI

		var mockTokenRecord = interfaces.TokenRecord{
			AuthToken:    mockUAAToken,
			RefreshToken: mockUAAToken,
			TokenExpiry:  tokenExpiration,
		}
		encryptedUAAToken, _ := crypto.EncryptToken(pp.Config.EncryptionKeyInBytes, mockUAAToken)

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectExec(insertIntoTokens).
			//WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data", "user_guid", "linked_token"}).
			AddRow(encryptedUAAToken, encryptedUAAToken, tokenExpiration, false, "OAuth2", "", mockUserGUID, nil)
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint"}).
			AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockCNSI.DopplerLoggingEndpoint)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRecordRow)

		mock.ExpectQuery(selectAnyFromTokens).
			WillReturnError(errors.New("Unknown Database Error"))

		//
		_, err := pp.DoOAuthFlowRequest(&interfaces.CNSIRequest{
			GUID:     mockCNSIGUID,
			UserGUID: mockUserGUID,
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

	var mockTokenRecord = interfaces.TokenRecord{
		AuthToken:   mockUAAToken,
		TokenExpiry: 0,
	}
	pp.setCNSITokenRecord("not-the-right-guid", mockUserGUID, mockTokenRecord)

	_, err := pp.DoOAuthFlowRequest(&interfaces.CNSIRequest{
		GUID:     mockCNSIGUID,
		UserGUID: mockUserGUID,
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

		invalidCNSIRequest := &interfaces.CNSIRequest{
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

		cnsiGUID := mockCNSIGUID
		userGUID := mockUserGUID
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
		expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data"}).
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, true, "OAuth2", "")
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID).
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

		var mockURL *url.URL
		var mockURLasString string
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                  mockCNSIGUID,
			Name:                  "mockCF",
			CNSIType:              "cf",
			APIEndpoint:           mockURL,
			AuthorizationEndpoint: mockUAA.URL,
			TokenEndpoint:         mockUAA.URL,
		}
		// pp.CNSIs[mockCNSIGuid] = mockCNSI

		var mockTokenRecord = interfaces.TokenRecord{
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
			WithArgs(mockCNSIGUID, mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		// 1) Set up the database expectation for pp.setCNSITokenRecord
		mock.ExpectExec(insertIntoTokens).
			//WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, mockTokenRecord.TokenExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}

		// 2) Set up database expectation for pp.doOauthFlowRequest
		//   p.getCNSIRequestRecords(cnsiRequest) ->
		//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
		//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
		expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data"}).
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, false, "OAuth2", "")
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRow)

		//  p.GetCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
		expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint"}).
			AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockCNSI.DopplerLoggingEndpoint)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRecordRow)

		expectedCNSITokenRecordRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected", "auth_type", "meta_data"}).
			AddRow(mockUAAToken, mockUAAToken, tokenExpiration, false, "OAuth2", "")
		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(expectedCNSITokenRecordRow)

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID, mockAdminGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("1"))

		// p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
		//   p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
		//     tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t)
		mock.ExpectExec(updateTokens).
			WillReturnError(errors.New("Unknown Database Error"))
		//
		_, err := pp.DoOAuthFlowRequest(&interfaces.CNSIRequest{
			GUID:     mockCNSIGUID,
			UserGUID: mockUserGUID,
		}, req)

		Convey("Oauth flow request erroneously succeeded", func() {
			So(err, ShouldNotBeNil)
		})

		mockCF.Close()

	})

}
