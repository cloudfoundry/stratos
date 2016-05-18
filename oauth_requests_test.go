package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/hpcloud/portal-proxy/repository/cnsis"
	"github.com/hpcloud/portal-proxy/repository/tokens"
)

// TODO: check that Authorization header starts with "bearer "

func TestDoOauthFlowRequestWithValidToken(t *testing.T) {
	t.Parallel()

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

	// setup mock HCF server
	numReqs := 0
	mockHCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	})) // end of mockHCF

	// do a GET against the HCF mock server
	req, _ := http.NewRequest("GET", mockHCF.URL+"/v2/info", nil)

	var mockURL *url.URL
	var mockURLasString string
	var mockCNSI = cnsis.CNSIRecord{
		GUID:                  mockCNSIGUID,
		Name:                  "mockHCF",
		CNSIType:              cnsis.CNSIHCF,
		APIEndpoint:           mockURL,
		AuthorizationEndpoint: mockUAA.URL,
		TokenEndpoint:         mockUAA.URL,
	}
	// pp.CNSIs[mockCNSIGuid] = mockCNSI

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

	pp := setupPortalProxy()
	pp.DatabaseConnectionPool = db

	// --- set up the database expectation for pp.setCNSITokenRecord
	sql := `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, mockTokenRecord.TokenExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

	// --- set up database expectation for pp.doOauthFlowRequest
	//    1 p.getCNSIRequestRecords(cnsiRequest) ->
	//      2a p.getCNSITokenRecord(r.GUID, r.UserGUID) -> tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
	//                `SELECT auth_token, refresh_token, token_expiry
	// 								 FROM tokens
	// 								 WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`
	expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
		AddRow(mockUAAToken, mockUAAToken, tokenExpiration)
	sql = `SELECT auth_token, refresh_token, token_expiry FROM tokens`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(expectedCNSITokenRow)

	//      2b p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	//                `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
	//                 FROM cnsis
	//                 WHERE guid=$1`
	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint)
	sql = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRecordRow)

	res, err := pp.doOauthFlowRequest(CNSIRequest{
		GUID:     mockCNSIGUID,
		UserGUID: mockUserGUID,
	}, req)

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	if err != nil {
		t.Error(err)
	}

	if res.StatusCode != 200 {
		t.Errorf("Wanted status '200', got '%d'", res.StatusCode)
	}

	// close this explicitly here so we can thread-safely check the bool
	mockHCF.Close()

	expectReqs := 1
	if failFirst {
		expectReqs = 2
	}
	if numReqs != expectReqs {
		t.Errorf("Expected %d requests, %d were run", expectReqs, numReqs)
	}

}

func TestDoOauthFlowRequestWithExpiredToken(t *testing.T) {
	t.Parallel()

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

	// setup mock HCF server
	numReqs := 0
	mockHCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	})) // end of mockHCF

	// do a GET against the HCF mock server
	req, _ := http.NewRequest("GET", mockHCF.URL+"/v2/info", nil)

	var mockURL *url.URL
	var mockURLasString string
	var mockCNSI = cnsis.CNSIRecord{
		GUID:                  mockCNSIGUID,
		Name:                  "mockHCF",
		CNSIType:              cnsis.CNSIHCF,
		APIEndpoint:           mockURL,
		AuthorizationEndpoint: mockUAA.URL,
		TokenEndpoint:         mockUAA.URL,
	}
	// pp.CNSIs[mockCNSIGuid] = mockCNSI

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

	pp := setupPortalProxy()
	pp.DatabaseConnectionPool = db

	// --- set up the database expectation for pp.setCNSITokenRecord
	sql := `INSERT INTO tokens`
	mock.ExpectExec(sql).
		WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, mockTokenRecord.TokenExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	pp.setCNSITokenRecord(mockCNSIGUID, mockUserGUID, mockTokenRecord)

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	// --- set up database expectation for pp.doOauthFlowRequest
	//    1 p.getCNSIRequestRecords(cnsiRequest) ->
	//      2a p.getCNSITokenRecord(r.GUID, r.UserGUID) -> tokenRepo.FindCNSIToken(cnsiGUID, userGUID)
	//                `SELECT auth_token, refresh_token, token_expiry
	// 								 FROM tokens
	// 								 WHERE cnsi_guid=$1 AND user_guid = $2 AND token_type = 'cnsi'`
	expectedCNSITokenRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
		AddRow(mockUAAToken, mockUAAToken, tokenExpiration)
	sql = `SELECT auth_token, refresh_token, token_expiry FROM tokens`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(expectedCNSITokenRow)

	//      2b p.getCNSIRecord(r.GUID) -> cnsiRepo.Find(guid)
	//                `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint
	//                 FROM cnsis
	//                 WHERE guid=$1`
	expectedCNSIRecordRow := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSI.GUID, mockCNSI.Name, mockCNSI.CNSIType, mockURLasString, mockCNSI.AuthorizationEndpoint, mockCNSI.TokenEndpoint)
	sql = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID).
		WillReturnRows(expectedCNSIRecordRow)

	//      3 p.refreshToken(p.refreshToken(cnsiRequest.GUID, cnsiRequest.UserGUID, p.Config.HCFClient, p.Config.HCFClientSecret, cnsi.TokenEndpoint))
	//        -> a. p.getCNSITokenRecord(cnsiGUID, userGUID)

	expectedCNSITokenRecordRow := sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
		AddRow(mockUAAToken, mockUAAToken, tokenExpiration)
	sql = `SELECT auth_token, refresh_token, token_expiry FROM tokens`
	mock.ExpectQuery(sql).
		WithArgs(mockCNSIGUID, mockUserGUID).
		WillReturnRows(expectedCNSITokenRecordRow)

	//        -> b. p.getUAATokenWithRefreshToken(userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath)
	//            --> tokenRepo.FindCNSIToken(cnsiGUID, userGUID)

	// expectedCNSITokenRow = sqlmock.NewRows([]string{"auth_token", "refresh_token", "token_expiry"}).
	// 	AddRow(mockUAAToken, mockUAAToken, tokenExpiration)
	// sql = `SELECT auth_token, refresh_token, token_expiry FROM tokens`
	// mock.ExpectQuery(sql).WithArgs(mockCNSIGUID, mockUserGUID).WillReturnRows(expectedCNSITokenRow)

	//        -> c. getUserTokenInfo(uaaRes.AccessToken)
	//  NOTHING TO DO

	//        -> d. p.saveCNSIToken(cnsiGUID, *u, uaaRes.AccessToken, uaaRes.RefreshToken)
	//            --> p.setCNSITokenRecord(cnsiID, u.UserGUID, tokenRecord)
	//              --> tokenRepo.SaveCNSIToken(cnsiGUID, userGUID, t)

	// `INSERT INTO tokens (cnsi_guid, user_guid, token_type, auth_token, refresh_token, token_expiry)
	// 								 VALUES ($1, $2, $3, $4, $5, $6)`

	sql = `INSERT INTO tokens`
	var newExpiry = 1234567
	mock.ExpectExec(sql).
		WithArgs(mockCNSIGUID, mockUserGUID, "cnsi", mockTokenRecord.AuthToken, mockTokenRecord.RefreshToken, newExpiry).
		WillReturnResult(sqlmock.NewResult(1, 1))

	//
	res, err := pp.doOauthFlowRequest(CNSIRequest{
		GUID:     mockCNSIGUID,
		UserGUID: mockUserGUID,
	}, req)

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}

	if err != nil {
		t.Error(err)
	}

	if res.StatusCode != 200 {
		t.Errorf("Wanted status '200', got '%d'", res.StatusCode)
	}

	// close this explicitly here so we can thread-safely check the bool
	mockHCF.Close()

	expectReqs := 1
	if failFirst {
		expectReqs = 2
	}
	if numReqs != expectReqs {
		t.Errorf("Expected %d requests, %d were run", expectReqs, numReqs)
	}

}

// func TestDoOauthFlowRequestWithValidTokenFailFirst(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, 1).Unix())
// }

// func TestDoOauthFlowRequestWithExpiredTokenFailFirst(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, -1).Unix())
// }

// func TestDoOauthFlowRequestWithMissingCNSITokenRecord(t *testing.T) {
// 	t.Parallel()
//
// 	req, _ := http.NewRequest("GET", "/v2/info", nil)
// 	pp := setupPortalProxy()
//
// 	var mockTokenRecord = tokens.TokenRecord{
// 		AuthToken:   mockUAAToken,
// 		TokenExpiry: 0,
// 	}
// 	pp.setCNSITokenRecord("not-the-right-guid", mockUserGUID, mockTokenRecord)
//
// 	_, err := pp.doOauthFlowRequest(CNSIRequest{
// 		GUID:     mockCNSIGUID,
// 		UserGUID: mockUserGUID,
// 	}, req)
//
// 	if err == nil {
// 		t.Error("Request should not succeed if there is no matching CNSI tokenRecord")
// 	}
// }
