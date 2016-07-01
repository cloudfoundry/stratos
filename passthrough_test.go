package main

import (
	"errors"
	"net/http"
	"net/url"
	"testing"
	"time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
)

func TestPassthroughDoRequest(t *testing.T) {
	t.Parallel()

	mockHCFServer := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockHCFServer.Close()

	uri, err := url.Parse(mockHCFServer.URL + "/v2/info")
	if err != nil {
		t.Fatal(err)
	}
	mockCNSIRequest := CNSIRequest{
		GUID:     mockCNSIGUID,
		UserGUID: mockUserGUID,
		Method:   "GET",
		URL:      uri,
	}

	var mockTokenRecord = tokens.TokenRecord{
		AuthToken:    mockUAAToken,
		RefreshToken: mockUAAToken,
		TokenExpiry:  time.Now().AddDate(0, 0, 1).Unix(),
	}

	var mockCNSI = cnsis.CNSIRecord{
		Name:                  "mockHCF",
		CNSIType:              cnsis.CNSIHCF,
		AuthorizationEndpoint: mockHCFServer.URL,
		TokenEndpoint:         mockHCFServer.URL + "/oauth/token",
	}
	// pp.CNSIs[mockCNSIGuid] = mockCNSI

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()

	pp := setupPortalProxy()
	pp.DatabaseConnectionPool = db

	sql := `SELECT (.+) FROM tokens WHERE (.+)`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(sqlmock.NewRows([]string{"COUNT(*)"}).AddRow("0"))

	// set up the database expectation for pp.setCNSITokenRecord
	sql = `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, mockTokenRecord.TokenExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

	// verify expectations met
	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	// TODO(wchrisjohnson): document what is happening here for the sake of Golang newcomers  https://jira.hpcloud.net/browse/TEAMFOUR-636
	done := make(chan CNSIRequest)
	kill := make(chan struct{})

	// Set up database expectation for pp.doOauthFlowRequest
	//  p.getCNSIRequestRecords(cnsiRequest) ->
	//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
	//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
	tokenExpiration := time.Now().AddDate(0, 0, 1).Unix()
	expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
		AddRow(mockUAAToken, mockUAAToken, tokenExpiration)
	sql = `SELECT auth_token, refresh_token, token_expiry FROM tokens`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(expectedCNSITokenRow)

	//  p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	var mockURLasString string
	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint)
	sql = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRecordRow)

	go pp.doRequest(mockCNSIRequest, done, kill)

	newCNSIRequest := <-done

	// verify expectations met
	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	if newCNSIRequest.Error != nil {
		t.Error(newCNSIRequest.Error)
	}

	if string(newCNSIRequest.Response) != jsonMust(mockV2InfoResponse) {
		t.Errorf("Did not get expected output: %v", newCNSIRequest.Response)
	}
}

func TestPassthroughGetEchoURL(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _ := setupHTTPTest(req)

	uri := getEchoURL(ctx)

	if uri.String() != mockURLString {
		t.Errorf("Did not get expected uri - expected: %s got %v", mockURLString, uri.String())
	}
}

func TestPassthroughGetEchoHeaders(t *testing.T) {
	t.Parallel()

	fakeHeaderKey := "Content-Type"
	fakeHeaderValue := "application/x-www-form-urlencoded"

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _ := setupHTTPTest(req)

	req.Header.Set(fakeHeaderKey, fakeHeaderValue)

	header := getEchoHeaders(ctx)

	_, ok := header[fakeHeaderKey]
	if !ok {
		t.Error("Expected key not found in header")
	}

	if header[fakeHeaderKey][0] != fakeHeaderValue {
		t.Errorf("Did not get expected headers - %v", header)
	}
}

func TestPassthroughMakeRequestURI(t *testing.T) {
	t.Parallel()

	fakeURL := "http://localhost/v1/proxy/v2/info/"

	req := setupMockReq("GET", fakeURL, nil)
	_, _, ctx, _ := setupHTTPTest(req)

	uri := makeRequestURI(ctx)

	if uri.String() != fakeURL {
		t.Errorf("Failed to make a request uri: %s", uri)
	}
}

func TestPassthroughGetPortalUserGUID(t *testing.T) {
	t.Parallel()

	var fakeUserGUID = "fake-users-guid"

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _ := setupHTTPTest(req)
	ctx.Set("user_id", fakeUserGUID)

	userGUID, err := getPortalUserGUID(ctx)
	if err != nil {
		t.Errorf("Failed to get portal user GUID from session: %v", err)
	}
	if userGUID != fakeUserGUID {
		t.Errorf("User ID from portal [%s] doesn't match expected [%s]", userGUID, fakeUserGUID)
	}
}

func TestPassthroughGetPortalUserGUIDWhenCorruptedSession(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _ := setupHTTPTest(req)

	_, err := getPortalUserGUID(ctx)
	if err == nil {
		t.Error("Should have failed to get portal user GUID from session.")
	}
}

func TestPassthroughGetRequestParts(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _ := setupHTTPTest(req)

	_, _, err := getRequestParts(ctx)

	if err != nil {
		t.Errorf("Error: %v", err)
	}
}

func TestPassthroughBuildCNSIRequest(t *testing.T) {
	t.Parallel()

	expectedCNSIRequest := CNSIRequest{
		GUID:     mockCNSIGUID,
		UserGUID: "user1",
		Method:   "GET",
		Body:     nil,
		Header:   nil,
	}

	var cr CNSIRequest

	req := setupMockReq("GET", "", nil)
	_, _, ctx, pp := setupHTTPTest(req)
	r := ctx.Request()

	var ur *url.URL
	ur, _ = url.Parse(mockAPIEndpoint)

	// setup database mocks
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()

	pp.DatabaseConnectionPool = db

	//  p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSIGUID, "Test", "hcf", mockAPIEndpoint, mockAuthEndpoint, mockTokenEndpoint)
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRecordRow)

	cr = pp.buildCNSIRequest(expectedCNSIRequest.GUID, expectedCNSIRequest.UserGUID, r, ur, expectedCNSIRequest.Body, expectedCNSIRequest.Header, false)

	// verify expectations met
	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	if cr.GUID != expectedCNSIRequest.GUID ||
		cr.UserGUID != expectedCNSIRequest.UserGUID ||
		cr.Method != expectedCNSIRequest.Method {
		t.Error("Invalid return from buildCNSIRequest.")
	}
}

func TestValidateCNSIListWithValidGUID(t *testing.T) {
	t.Parallel()

	var cnsiGUIDList []string
	cnsiGUIDList = append(cnsiGUIDList, "valid-guid-abc123")

	req := setupMockReq("GET", "", nil)
	_, _, _, pp := setupHTTPTest(req)

	// Setup database expectations for CNSO record insert
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow("valid-guid-abc123", "mock-name", "hcf", "http://localhost", "http://localhost", "http://localhost")
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs("valid-guid-abc123").
		WillReturnRows(expectedCNSIRecordRow)

	err := pp.validateCNSIList(cnsiGUIDList)
	if err != nil {
		t.Errorf("Unable to validate CNSI GUID list. %+v\n", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestValidateCNSIListWithInvalidGUID(t *testing.T) {
	t.Parallel()

	var cnsiGUIDList []string
	cnsiGUIDList = append(cnsiGUIDList, "fake-guid-abc123")

	req := setupMockReq("GET", "", nil)
	_, _, _, pp := setupHTTPTest(req)

	// Setup database expectations for CNSO record insert
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	// Mock a database error
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WillReturnError(errors.New("Unknown Database Error"))

	err := pp.validateCNSIList(cnsiGUIDList)
	if err == nil {
		t.Error("Unepected success - attempt to rerieve non-existent CNSI GUID should have failed.")
	}
}
