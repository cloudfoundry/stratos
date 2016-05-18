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

	req := setupMockReq("POST", map[string]string{
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

	// --- set up the database expectation for pp.saveUAAToken
	sql := `INSERT INTO tokens`
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

	req := setupMockReq("POST", map[string]string{
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

func TestLoginToCNSI(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{
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

// func TestLoginToCNSIWithMissingCNSI(t *testing.T) {
// 	t.Parallel()
//
// 	req := setupMockReq("POST", map[string]string{
// 		"username": "admin",
// 		"password": "changeme",
// 	})
//
// 	_, _, ctx, pp := setupHTTPTest(req)
//
// 	mockUAA := setupMockServer(t,
// 		msRoute("/oauth/token"),
// 		msMethod("POST"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockUAAResponse)))
//
// 	defer mockUAA.Close()
//
// 	var mockCNSI = cnsiRecord{
// 		Name:                  "mockHCF",
// 		CNSIType:              cnsiHCF,
// 		AuthorizationEndpoint: mockUAA.URL,
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	if err := pp.loginToCNSI(ctx); err == nil {
// 		t.Error("Login should fail if CNSI not specified")
// 	}
//
// 	testTokenKey := mkTokenRecordKey("", mockUserGuid)
// 	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
// 		t.Error("Token should not be saved in CNSI map if CNSI is not specified")
// 	}
// }

// func TestLoginToCNSIWithMissingCreds(t *testing.T) {
// 	t.Parallel()
//
// 	req := setupMockReq("POST", map[string]string{
// 		"cnsi_guid": mockCNSIGuid,
// 	})
//
// 	_, _, ctx, pp := setupHTTPTest(req)
//
// 	mockUAA := setupMockServer(t,
// 		msRoute("/oauth/token"),
// 		msMethod("POST"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockUAAResponse)))
//
// 	defer mockUAA.Close()
//
// 	var mockCNSI = cnsiRecord{
// 		Name:                  "mockHCF",
// 		CNSIType:              cnsiHCF,
// 		AuthorizationEndpoint: mockUAA.URL,
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	if err := pp.loginToCNSI(ctx); err == nil {
// 		t.Error("Login against CNSI should fail if creds not specified")
// 	}
//
// 	testTokenKey := mkTokenRecordKey("", mockUserGuid)
// 	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
// 		t.Error("Token should not be saved in CNSI map if creds not specified")
// 	}
// }

// func TestLoginToCNSIWithMissingAPIEndpoint(t *testing.T) {
// 	t.Parallel()
//
// 	req := setupMockReq("POST", map[string]string{
// 		"username":  "admin",
// 		"password":  "changeme",
// 		"cnsi_guid": mockCNSIGuid,
// 	})
//
// 	_, _, ctx, pp := setupHTTPTest(req)
//
// 	mockUAA := setupMockServer(t,
// 		msRoute("/oauth/token"),
// 		msMethod("POST"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockUAAResponse)))
//
// 	defer mockUAA.Close()
//
// 	var mockCNSI = cnsiRecord{
// 		Name:     "mockHCF",
// 		CNSIType: cnsiHCF,
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	if err := pp.loginToCNSI(ctx); err == nil {
// 		t.Error("Login against CNSI should fail if API endpoint not specified")
// 	}
//
// 	testTokenKey := mkTokenRecordKey("", mockUserGuid)
// 	if _, ok := pp.CNSITokenMap[testTokenKey]; ok {
// 		t.Error("Token should not be saved in CNSI map if API endpoint not specified")
// 	}
// }

// func TestLoginToCNSIWithBadCreds(t *testing.T) {
// 	t.Parallel()
//
// 	req := setupMockReq("POST", map[string]string{
// 		"username":  "admin",
// 		"password":  "busted",
// 		"cnsi_guid": mockCNSIGuid,
// 	})
//
// 	_, _, ctx, pp := setupHTTPTest(req)
//
// 	mockUAA := setupMockServer(t,
// 		msRoute("/oauth/token"),
// 		msMethod("POST"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockUAAResponse)))
//
// 	defer mockUAA.Close()
//
// 	var mockCNSI = cnsiRecord{
// 		Name:                  "mockHCF",
// 		CNSIType:              cnsiHCF,
// 		AuthorizationEndpoint: mockUAA.URL,
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	if err := pp.loginToCNSI(ctx); err != nil {
// 		t.Error(err)
// 	}
//
// 	testTokenKey := mkTokenRecordKey(mockCNSIGuid, mockUserGuid)
// 	if _, ok := pp.CNSITokenMap[testTokenKey]; !ok {
// 		t.Errorf("Token was not saved in CNSI map")
// 	}
// }
//

func TestLogout(t *testing.T) {
	t.Parallel()

	req := setupMockReq("POST", map[string]string{})

	res, _, ctx, pp := setupHTTPTest(req)

	pp.logout(ctx)

	header := res.Header()
	setCookie := header.Get("Set-Cookie")

	if strings.HasPrefix(string(setCookie), "portal-session=") && !strings.HasPrefix(string(setCookie), "portal-session=; Max-Age=0") {
		t.Errorf("Session should not exist after logout: %v", setCookie)
	}
}
