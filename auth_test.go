package main

import (
	"errors"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestLoginToUAA(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})

	res, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()
	pp.Config.UAAEndpoint = mockUAA.URL + "/oauth/token"

	var tokenExpiration = time.Now().AddDate(0, 0, 1).Unix()
	var mockTokenRecord = tokens.TokenRecord{
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
	pp.DatabaseConnectionPool = db

	sql := `SELECT (.+) FROM tokens WHERE (.+)`
	mock.ExpectQuery(sql).
		WithArgs(mockUserGUID).
		WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

	// --- set up the database expectation for pp.saveUAAToken
	sql = `INSERT INTO tokens`
	var newExpiry = 1234567
	mock.ExpectExec(sql).
		WithArgs(mockUserGUID, "uaa", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, newExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pp.loginToUAA(ctx); err != nil {
		t.Error(err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if !strings.HasPrefix(string(setCookie), "portal-session=") {
		t.Errorf("Session was not set: %v", setCookie)
	}
}

func TestLoginToUAAWithBadCreds(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username": "admin",
		"password": "busted",
	})

	res, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusUnauthorized),
	)

	defer mockUAA.Close()
	pp.Config.UAAEndpoint = mockUAA.URL + "/oauth/token"

	err := pp.loginToUAA(ctx)
	if err == nil {
		t.Error("Should not have been able to log in with incorrect credentials")
	}

	someErr := err.(errHTTPShadow)
	if someErr.HTTPError.Code != http.StatusUnauthorized {
		t.Error("Status was wrong on invalid auth attempt:", someErr.HTTPError.Code)
	}

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if strings.HasPrefix(string(setCookie), "portal-session=") {
		t.Errorf("Session should not be set with invalid creds: %v", setCookie)
	}
}

func TestLoginToUAAButCantSaveToken(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()
	pp.Config.UAAEndpoint = mockUAA.URL + "/oauth/token"

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	sql := `SELECT (.+) FROM tokens WHERE (.+)`
	mock.ExpectQuery(sql).
		WithArgs(mockUserGUID).
		WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

	// --- set up the database expectation for pp.saveUAAToken
	sql = `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WillReturnError(errors.New("Unknown Database Error"))

	if err := pp.loginToUAA(ctx); err == nil {
		t.Error("Unexpected success - should not be able to Login to UAA given database error.")
	}
}

func TestLoginToCNSI(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockURL *url.URL
	mockURL, _ = url.Parse(mockUAA.URL)
	stringHCFType := "hcf"
	var mockCNSI = cnsis.CNSIRecord{
		GUID:                  mockCNSIGUID,
		Name:                  "mockHCF",
		CNSIType:              cnsis.CNSIHCF,
		APIEndpoint:           mockURL,
		AuthorizationEndpoint: mockUAA.URL,
		TokenEndpoint:         mockUAA.URL,
	}

	var tokenExpiration = time.Now().AddDate(0, 0, 1).Unix()
	var mockTokenRecord = tokens.TokenRecord{
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
	pp.DatabaseConnectionPool = db

	expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSIGUID, mockCNSI.Name, stringHCFType, mockUAA.URL, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint)
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRow)

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = mockUserGUID
	sessionValues["exp"] = time.Now().AddDate(0, 0, 1).Unix()

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("Unable to mock/stub user in session object."))
	}

	sql = `SELECT (.+) FROM tokens WHERE (.+)`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

	// Setup expectation that the CNSI token will get saved
	sql = `INSERT INTO tokens`
	var newExpiry = 1234567
	mock.ExpectExec(sql).
		WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, newExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// do the call
	if err := pp.loginToCNSI(ctx); err != nil {
		t.Error(err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestLoginToCNSIWithoutCNSIGuid(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	// do the call - expect an error
	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Expected an error attempting a CNSI login without a CNSI GUID.")
	}
}

func TestLoginToCNSIWithMissingCNSIRecord(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	// Return nil from db call
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(nil)

	// do the call
	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Expected an error attempting to get a registered endpoint from the database.")
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestLoginToCNSIWithMissingCreds(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_guid": mockCNSIGUID,
	})
	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSIGUID, "mockHCF", "hcf", mockUAA.URL, mockUAA.URL, mockUAA.URL)
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRow)

	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Login against CNSI should fail if creds not specified")
	}
}

func TestLoginToCNSIWithBadUserIDinSession(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	var mockURL *url.URL
	mockURL, _ = url.Parse(mockUAA.URL)
	stringHCFType := "hcf"
	var mockCNSI = cnsis.CNSIRecord{
		GUID:                  mockCNSIGUID,
		Name:                  "mockHCF",
		CNSIType:              cnsis.CNSIHCF,
		APIEndpoint:           mockURL,
		AuthorizationEndpoint: mockUAA.URL,
		TokenEndpoint:         mockUAA.URL,
	}

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	expectedCNSIRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSIGUID, mockCNSI.Name, stringHCFType, mockUAA.URL, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint)
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRow)

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	// sessionValues["user_id"] = mockUserGUID
	sessionValues["exp"] = time.Now().AddDate(0, 0, 1).Unix()

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("Unable to mock/stub user in session object."))
	}

	// do the call
	if err := pp.loginToCNSI(ctx); err == nil {
		t.Error("Unexpected success - call should fail due to user GUID not in session.")
	}
}

func TestLogout(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{})

	res, _, ctx, pp := setupHTTPTest(req)

	pp.logout(ctx)

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if strings.HasPrefix(string(setCookie), "portal-session=") && !strings.HasPrefix(string(setCookie), "portal-session=; Max-Age=0") {
		t.Errorf("Session should not exist after logout: %v", setCookie)
	}
}

func TestSaveCNSITokenWithInvalidInput(t *testing.T) {
	t.Parallel()

	badCNSIID := ""
	badAuthToken := ""
	badRefreshToken := ""
	badUserInfo := userTokenInfo{
		UserGUID:    "",
		TokenExpiry: 0,
	}
	emptyTokenRecord := tokens.TokenRecord{}

	req := setupMockReq("POST", "", map[string]string{})
	_, _, _, pp := setupHTTPTest(req)

	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	sql := `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WillReturnError(errors.New("Unknown Database Error"))

	tr, err := pp.saveCNSIToken(badCNSIID, badUserInfo, badAuthToken, badRefreshToken)

	if err == nil || tr != emptyTokenRecord {
		t.Error("Should not be able to save a CNSI token with invalid user, CNSI, or token data.")
	}
}

func TestSetUAATokenRecord(t *testing.T) {
	t.Parallel()

	fakeKey := "fake-guid"
	fakeTr := tokens.TokenRecord{}

	req := setupMockReq("POST", "", map[string]string{})
	_, _, _, pp := setupHTTPTest(req)

	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	sql := `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WillReturnError(errors.New("Unknown Database Error"))

	err := pp.setUAATokenRecord(fakeKey, fakeTr)

	if err == nil {
		t.Error("Should not be able to save a UAA token with a database exception.")
	}
}

func TestLoginToCNSIWithMissingAPIEndpoint(t *testing.T) {
	t.Skip("Skipping for now - need to verify whether still needed.")
	t.Parallel()

	req := setupMockReq("POST", "", map[string]string{
		"username":  "admin",
		"password":  "changeme",
		"cnsi_guid": mockCNSIGUID,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	// var mockCNSI = CNSIRecord{
	// 	Name:     "mockHCF",
	// 	CNSIType: cnsiHCF,
	// }
	// pp.CNSIs[mockCNSIGuid] = mockCNSI

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

	_, _, ctx, pp := setupHTTPTest(req)

	mockUAA := setupMockServer(t,
		msRoute("/oauth/token"),
		msMethod("POST"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockUAAResponse)))

	defer mockUAA.Close()

	// var mockCNSI = cnsiRecord{
	// 	Name:                  "mockHCF",
	// 	CNSIType:              cnsiHCF,
	// 	AuthorizationEndpoint: mockUAA.URL,
	// }
	// pp.CNSIs[mockCNSIGuid] = mockCNSI

	if err := pp.loginToCNSI(ctx); err != nil {
		t.Error(err)
	}

	// testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
	// if _, ok := pp.CNSITokenMap[testTokenKey]; !ok {
	// 	t.Errorf("Token was not saved in CNSI map")
	// }
}
