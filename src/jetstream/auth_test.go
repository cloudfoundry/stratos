package main

import (
	"errors"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	sqlmock "gopkg.in/DATA-DOG/go-sqlmock.v1"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	. "github.com/smartystreets/goconvey/convey"
)

const (
	findUAATokenSql = `SELECT token_guid, auth_token, refresh_token, token_expiry, auth_type, meta_data FROM tokens .*`
)

func TestLoginToUAA(t *testing.T) {
	t.Parallel()

	Convey("UAA tests", t, func() {
		req := setupMockReq("POST", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()
		pp.Config.ConsoleConfig = new(interfaces.ConsoleConfig)
		uaaUrl, _ := url.Parse(mockUAA.URL)
		pp.Config.ConsoleConfig.UAAEndpoint = uaaUrl
		pp.Config.ConsoleConfig.SkipSSLValidation = true

		mock.ExpectQuery(selectAnyFromTokens).
			WillReturnRows(expectNoRows())

		mock.ExpectExec(insertIntoTokens).
			// WithArgs(mockUserGUID, "uaa", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, newExpiry).
			WillReturnResult(sqlmock.NewResult(1, 1))

		Convey("Should not fail to login", func() {
			So(pp.loginToUAA(ctx), ShouldBeNil)
		})
		//
		//Convey("Expectations should be met", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})
}

func TestLoginToUAAWithBadCreds(t *testing.T) {
	t.Parallel()

	Convey("UAA tests with bad credentials", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username": "admin",
			"password": "busted",
		})

		_, _, ctx, pp, db, _ := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusUnauthorized),
		)

		defer mockUAA.Close()
		pp.Config.ConsoleConfig = new(interfaces.ConsoleConfig)
		uaaUrl, _ := url.Parse(mockUAA.URL)
		pp.Config.ConsoleConfig.UAAEndpoint = uaaUrl
		pp.Config.ConsoleConfig.SkipSSLValidation = true

		err := pp.loginToUAA(ctx)
		Convey("Login to UAA should fail", func() {
			So(err, ShouldNotBeNil)
		})

		someErr := err.(interfaces.ErrHTTPShadow)

		Convey("HTTP status code should be 401", func() {
			So(someErr.HTTPError.Code, ShouldEqual, http.StatusUnauthorized)
		})

	})

}

func TestLoginToUAAButCantSaveToken(t *testing.T) {
	t.Parallel()

	Convey("Should fail to authenticate with a DB error", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()
		pp.Config.ConsoleConfig = new(interfaces.ConsoleConfig)
		uaaUrl, _ := url.Parse(mockUAA.URL)
		pp.Config.ConsoleConfig.UAAEndpoint = uaaUrl
		pp.Config.ConsoleConfig.SkipSSLValidation = true

		mock.ExpectQuery(selectAnyFromTokens).
			// WithArgs(mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		// --- set up the database expectation for pp.saveAuthToken
		mock.ExpectExec(insertIntoTokens).
			WillReturnError(errors.New("Unknown Database Error"))

		Convey("Should not fail to login", func() {
			So(pp.loginToUAA(ctx), ShouldNotBeNil)
		})
		//Convey("Expectations should be met", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})

}

func TestLoginToCNSI(t *testing.T) {
	t.Parallel()

	Convey("Login to CNSI tests", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username":  "admin",
			"password":  "changeme",
			"cnsi_guid": mockCNSIGUID,
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		var mockURL *url.URL
		mockURL, _ = url.Parse(mockUAA.URL)
		stringCFType := "cf"
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                   mockCNSIGUID,
			Name:                   "mockCF",
			CNSIType:               "cf",
			APIEndpoint:            mockURL,
			AuthorizationEndpoint:  mockUAA.URL,
			TokenEndpoint:          mockUAA.URL,
			DopplerLoggingEndpoint: mockDopplerEndpoint,
		}

		expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation", "client_id", "client_secret", "allow_sso"}).
			AddRow(mockCNSIGUID, mockCNSI.Name, stringCFType, mockUAA.URL, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockCNSI.DopplerLoggingEndpoint, true, mockCNSI.ClientId, cipherClientSecret, true)

		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRow)

		// Set a dummy userid in session - normally the login to UAA would do this.
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = mockUserGUID
		sessionValues["exp"] = time.Now().AddDate(0, 0, 1).Unix()

		if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
			t.Error(errors.New("Unable to mock/stub user in session object."))
		}

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockCNSIGUID, mockUserGUID).
			WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

		// Setup expectation that the CNSI token will get saved
		//encryptedUAAToken, _ := tokens.EncryptToken(pp.Config.EncryptionKeyInBytes, mockUAAToken)
		mock.ExpectExec(insertIntoTokens).
			//WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedUAAToken, encryptedUAAToken, sessionValues["exp"]).
			WillReturnResult(sqlmock.NewResult(1, 1))

		// do the call

		Convey("Login should not return an error", func() {
			So(pp.loginToCNSI(ctx), ShouldBeNil)
		})

		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})
	})

}

func TestLoginToCNSIWithoutCNSIGuid(t *testing.T) {
	t.Parallel()

	Convey("Login to CNSI should fail without CNSI GUID", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})

		_, _, ctx, pp, db, _ := setupHTTPTest(req)
		defer db.Close()

		// do the call - expect an error
		Convey("Login should fail", func() {
			So(pp.loginToCNSI(ctx), ShouldNotBeNil)
		})
	})

}

func TestLoginToCNSIWithMissingCNSIRecord(t *testing.T) {
	t.Parallel()

	Convey("CNSI Login should fail is CNSI record is missing", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username":  "admin",
			"password":  "changeme",
			"cnsi_guid": mockCNSIGUID,
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// Return nil from db call
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnError(errors.New("No match for that GUID"))

		// do the call
		Convey("Should fail to login", func() {
			So(pp.loginToCNSI(ctx), ShouldNotBeNil)
		})

		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})

}

func TestLoginToCNSIWithMissingCreds(t *testing.T) {
	t.Parallel()
	// TODO fix test

	Convey("should fail to login to CNSI with missing credentials", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"cnsi_guid": mockCNSIGUID,
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint"}).
			AddRow(mockCNSIGUID, "mockCF", "cf", mockUAA.URL, mockUAA.URL, mockUAA.URL, mockDopplerEndpoint)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRow)

		Convey("Should fail to login", func() {
			So(pp.loginToCNSI(ctx), ShouldNotBeNil)
		})

		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})
	})

}

func TestLoginToCNSIWithBadUserIDinSession(t *testing.T) {
	t.Parallel()

	Convey("Should fail to login to CNSI with invalid user session", t, func() {

		req := setupMockReq("POST", "", map[string]string{
			"username":  "admin",
			"password":  "changeme",
			"cnsi_guid": mockCNSIGUID,
		})

		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mockUAA := setupMockServer(t,
			msRoute("/oauth/token"),
			msMethod("POST"),
			msStatus(http.StatusOK),
			msBody(jsonMust(mockUAAResponse)))

		defer mockUAA.Close()

		var mockURL *url.URL
		mockURL, _ = url.Parse(mockUAA.URL)
		stringCFType := "cf"
		var mockCNSI = interfaces.CNSIRecord{
			GUID:                  mockCNSIGUID,
			Name:                  "mockCF",
			CNSIType:              "cf",
			APIEndpoint:           mockURL,
			AuthorizationEndpoint: mockUAA.URL,
			TokenEndpoint:         mockUAA.URL,
		}

		expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint"}).
			AddRow(mockCNSIGUID, mockCNSI.Name, stringCFType, mockUAA.URL, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint, mockDopplerEndpoint)
		mock.ExpectQuery(selectAnyFromCNSIs).
			WithArgs(mockCNSIGUID).
			WillReturnRows(expectedCNSIRow)

		// Set a dummy userid in session - normally the login to UAA would do this.
		sessionValues := make(map[string]interface{})
		// sessionValues["user_id"] = mockUserGUID
		sessionValues["exp"] = time.Now().AddDate(0, 0, 1).Unix()

		Convey("Should mock/stub user in session object", func() {
			So(pp.setSessionValues(ctx, sessionValues), ShouldBeNil)
		})

		Convey("Should fail to login", func() {
			So(pp.loginToCNSI(ctx), ShouldNotBeNil)
		})
		//
		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})
	})

}

func TestLogout(t *testing.T) {
	t.Parallel()

	Convey("logout tests", t, func() {

		req := setupMockReq("POST", "", map[string]string{})

		res, _, ctx, pp, db, _ := setupHTTPTest(req)
		defer db.Close()

		pp.logout(ctx)

		header := res.Header()
		setCookie := header.Get("Set-Cookie")

		Convey("Should unset Cookie", func() {
			So(setCookie, ShouldNotStartWith, "console-session=")
			So(setCookie, ShouldNotStartWith, "console-session=; Max-Age=0")
		})

	})

}

func TestSaveCNSITokenWithInvalidInput(t *testing.T) {
	t.Parallel()

	Convey("Should not save CNSI token with invalid inputs", t, func() {

		badCNSIID := ""
		badAuthToken := ""
		badRefreshToken := ""
		badUserInfo := interfaces.JWTUserTokenInfo{
			UserGUID:    "",
			TokenExpiry: 0,
		}
		emptyTokenRecord := interfaces.TokenRecord{}

		req := setupMockReq("POST", "", map[string]string{})
		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mock.ExpectExec(insertIntoTokens).
			WillReturnError(errors.New("Unknown Database Error"))

		tr := pp.InitEndpointTokenRecord(badUserInfo.TokenExpiry, badAuthToken, badRefreshToken, false)
		err := pp.setCNSITokenRecord(badCNSIID, badUserInfo.UserGUID, tr)

		log.Printf("tr is: %T %+v", tr, tr)
		log.Printf("emptyTokenRecord is: %T %+v", emptyTokenRecord, emptyTokenRecord)

		Convey("Should fail to login", func() {
			So(err, ShouldNotBeNil)
			So(tr.RefreshToken, ShouldEqual, emptyTokenRecord.RefreshToken)
			So(tr.TokenExpiry, ShouldEqual, emptyTokenRecord.TokenExpiry)
		})

		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})

}

func TestSetUAATokenRecord(t *testing.T) {
	t.Parallel()

	Convey("Test saving a UAA Token record with a DB exception", t, func() {

		fakeKey := "fake-guid"
		fakeTr := interfaces.TokenRecord{}

		req := setupMockReq("POST", "", map[string]string{})
		_, _, _, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		mock.ExpectExec(insertIntoTokens).
			WillReturnError(errors.New("Unknown Database Error"))

		err := pp.setUAATokenRecord(fakeKey, fakeTr)

		Convey("Should fail to set UAA Token Record", func() {
			So(err, ShouldNotBeNil)
		})
		//
		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})

}

func TestLoginToCNSIWithMissingAPIEndpoint(t *testing.T) {
	t.Skip("Skipping for now - need to verify whether still needed.")
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Login against CNSI should fail if API endpoint not specified")
	}

	// testTokenKey := mkTokenRecordKey("", mockUserGuid)
	// if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
	// 	t.Error("Token should not be saved in CNSI map if API endpoint not specified")
	// }
}

func TestLoginToCNSIWithBadCreds(t *testing.T) {
	t.Skip("Skipping for now - need to verify whether still needed.")
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "busted",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	if err := pp.loginToCNSI(ctx); err != nil {
		t.Error(err)
	}

	// testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
	// if _, ok := pp.CNSITokenMap[testTokenKey]; !ok {
	// 	t.Errorf("Token was not saved in CNSI map")
	// }
}

func TestVerifySession(t *testing.T) {
	t.Parallel()

	Convey("Test verify session", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		res, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// Set a dummy userid in session - normally the login to UAA would do this.
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = mockUserGUID
		sessionValues["exp"] = time.Now().Add(time.Hour).Unix()

		if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
			t.Error(errors.New("Unable to mock/stub user in session object."))
		}

		mockTokenGUID := "mock-token-guid"
		encryptedUAAToken, _ := crypto.EncryptToken(pp.Config.EncryptionKeyInBytes, mockUAAToken)
		expectedTokensRow := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "auth_type", "meta_data"}).
			AddRow(mockTokenGUID, encryptedUAAToken, encryptedUAAToken, mockTokenExpiry, "oauth", "")

		mock.ExpectQuery(selectAnyFromTokens).
			WithArgs(mockUserGUID).
			WillReturnRows(expectedTokensRow)

		expectVersionRow := sqlmock.NewRows([]string{"version_id"}).
			AddRow(mockProxyVersion)
		mock.ExpectQuery(getDbVersion).WillReturnRows(expectVersionRow)

		rs := sqlmock.NewRows([]string{"token_guid", "auth_token", "refresh_token", "token_expiry", "auth_type", "meta_data"}).
			AddRow(mockTokenGUID, encryptedUAAToken, encryptedUAAToken, mockTokenExpiry, "oauth", "")
		mock.ExpectQuery(findUAATokenSql).
			WillReturnRows(rs)

		if err := pp.verifySession(ctx); err != nil {
			t.Error(err)
		}

		header := res.Header()
		contentType := header.Get("Content-Type")

		Convey("Should have expected contentType", func() {
			So(contentType, ShouldEqual, "application/json; charset=utf-8")
		})

		var expectedScopes = "\"scopes\":[\"openid\",\"scim.read\",\"cloud_controller.admin\",\"uaa.user\",\"cloud_controller.read\",\"password.write\",\"routing.router_groups.read\",\"cloud_controller.write\",\"doppler.firehose\",\"scim.write\"]"

		var expectedBody = "{\"version\":{\"proxy_version\":\"dev\",\"database_version\":20161117141922},\"user\":{\"guid\":\"asd-gjfg-bob\",\"name\":\"admin\",\"admin\":false," + expectedScopes + "},\"endpoints\":{\"cf\":{}}}"

		Convey("Should contain expected body", func() {
			So(res, ShouldNotBeNil)
			So(strings.TrimSpace(res.Body.String()), ShouldEqual, expectedBody)
		})

		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})
	})

}

func TestVerifySessionNoDate(t *testing.T) {
	t.Parallel()

	Convey("Test verify sesson without date", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, _ := setupHTTPTest(req)
		defer db.Close()

		// Set a dummy userid in session - normally the login to UAA would do this.
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = mockUserGUID
		// Note the lack of an "exp" key.

		errSession := pp.setSessionValues(ctx, sessionValues)
		Convey("Should be able to mock/stub user in session object.", func() {

			So(errSession, ShouldBeNil)
		})

		err := pp.verifySession(ctx)
		Convey("Should fail to verify session.", func() {

			So(err, ShouldNotBeNil)
		})

		errHTTP, ok := err.(*echo.HTTPError)
		Convey("should be able to cast error to HTTPError", func() {
			So(ok, ShouldBeTrue)
		})

		var expectedCode = 403
		Convey("Request should have expected code", func() {
			So(errHTTP.Code, ShouldEqual, expectedCode)
		})
	})

}

func TestVerifySessionExpired(t *testing.T) {
	t.Parallel()

	Convey("Test verification of expired session", t, func() {

		req := setupMockReq("GET", "", map[string]string{
			"username": "admin",
			"password": "changeme",
		})
		_, _, ctx, pp, db, mock := setupHTTPTest(req)
		defer db.Close()

		// Set a dummy userid in session - normally the login to UAA would do this.
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = mockUserGUID
		sessionValues["exp"] = time.Now().Add(-time.Hour).Unix()

		mock.ExpectQuery(selectAnyFromTokens).
			WillReturnRows(sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected"}))
		mock.ExpectExec(insertIntoTokens).
			WillReturnError(errors.New("Session has expired"))

		if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
			t.Error(errors.New("Unable to mock/stub user in session object."))
		}

		mock.ExpectQuery(selectAnyFromTokens).
			WillReturnRows(sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry", "disconnected"}).
				AddRow(mockUAAToken, mockUAAToken, sessionValues["exp"], false))
		err := pp.verifySession(ctx)

		Convey("Should fail to verify session", func() {
			So(err, ShouldNotBeNil)
		})

		errHTTP, ok := err.(*echo.HTTPError)
		Convey("should be able to cast error to HTTPError", func() {
			So(ok, ShouldBeTrue)
		})

		var expectedCode = 403
		Convey("Request should have expected code", func() {
			So(errHTTP.Code, ShouldEqual, expectedCode)
		})
		//
		//Convey("Should meet expectations", func() {
		//	So(mock.ExpectationsWereMet(), ShouldBeNil)
		//})

	})

}
