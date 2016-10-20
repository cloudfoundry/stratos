package main

import (
	"errors"
	"net/http"
	"net/url"
	"testing"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

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
		GUID:     mockHCFGUID,
		UserGUID: mockUserGUID,
		Method:   "GET",
		URL:      uri,
	}

	var mockTokenRecord = tokens.TokenRecord{
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
		WithArgs(mockHCFGUID, mockUserGUID).
		WillReturnRows(expectNoRows())

	// set up the database expectation for pp.setCNSITokenRecord
	mock.ExpectExec(insertIntoTokens).
		//	WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", encryptedUAAToken, encryptedUAAToken, mockTokenRecord.TokenExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err = pp.setCNSITokenRecord(mockHCFGUID, mockUserGUID, mockTokenRecord)
	if err != nil {
		t.Error("Unable to set CNSI Token record: %s", err)
	}

	/*	// verify expectations met
		if dberr := mock.ExpectationsWereMet(); dberr != nil {
			t.Errorf("There were unfulfilled expectations: %s", dberr)
		}
	*/
	// TODO(wchrisjohnson): document what is happening here for the sake of Golang newcomers  https://jira.hpcloud.net/browse/TEAMFOUR-636
	done := make(chan CNSIRequest)
	kill := make(chan struct{})

	// Set up database expectation for pp.doOauthFlowRequest
	//  p.getCNSIRequestRecords(cnsiRequest) ->
	//     p.getCNSITokenRecord(r.GUID, r.UserGUID) ->
	//        tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
	mock.ExpectQuery(selectAnyFromTokens).
		WithArgs(mockHCFGUID, mockUserGUID).
		WillReturnRows(expectTokenRow())

	//  p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	mock.ExpectQuery(selectAnyFromCNSIs).
		WithArgs(mockHCFGUID).
		WillReturnRows(expectHCFRow())

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
		t.Errorf("Expected %v, got %v", jsonMust(mockV2InfoResponse), string(newCNSIRequest.Response))
	}
}

func TestPassthroughGetEchoURL(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()

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
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()

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
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()

	uri := makeRequestURI(ctx)

	if uri.String() != fakeURL {
		t.Errorf("Failed to make a request uri: %s", uri)
	}
}

func TestPassthroughGetPortalUserGUID(t *testing.T) {
	t.Parallel()

	var fakeUserGUID = "fake-users-guid"

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()
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
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()

	_, err := getPortalUserGUID(ctx)
	if err == nil {
		t.Error("Should have failed to get portal user GUID from session.")
	}
}

func TestPassthroughGetRequestParts(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)
	_, _, ctx, _, db, _ := setupHTTPTest(req)
	defer db.Close()

	_, _, err := getRequestParts(ctx)

	if err != nil {
		t.Errorf("Error: %v", err)
	}
}

func TestPassthroughBuildCNSIRequest(t *testing.T) {
	t.Parallel()

	expectedCNSIRequest := CNSIRequest{
		GUID:     mockHCFGUID,
		UserGUID: "user1",
		Method:   "GET",
		Body:     nil,
		Header:   nil,
	}

	var cr CNSIRequest

	req := setupMockReq("GET", "", nil)
	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	r := ctx.Request()

	var ur *url.URL
	ur, _ = url.Parse(mockAPIEndpoint)

	//  p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	mock.ExpectQuery(selectAnyFromCNSIs).
		WithArgs(mockHCFGUID).
		WillReturnRows(expectHCFRow())

	cr, err := pp.buildCNSIRequest(expectedCNSIRequest.GUID, expectedCNSIRequest.UserGUID, r, ur, expectedCNSIRequest.Body, expectedCNSIRequest.Header, false)
	if err != nil {
		t.Errorf("Couldn't build CNSI request: %s", err)
	}

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
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint", "doppler_logging_endpoint", "skip_ssl_validation"}).
		AddRow("valid-guid-abc123", "mock-name", "hcf", "http://localhost", "http://localhost", "http://localhost", mockDopplerEndpoint, true)
	mock.ExpectQuery(selectAnyFromCNSIs).
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
	_, _, _, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Mock a database error
	mock.ExpectQuery(selectAnyFromCNSIs).
		WillReturnError(errors.New("Unknown Database Error"))

	err := pp.validateCNSIList(cnsiGUIDList)
	if err == nil {
		t.Error("Unepected success - attempt to rerieve non-existent CNSI GUID should have failed.")
	}
}
