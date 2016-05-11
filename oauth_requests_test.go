package main

// import (
// 	"io"
// 	"net/http"
// 	"net/http/httptest"
// 	"testing"
// 	"time"
// )
//
// // TODO: check that Authorization header starts with "bearer "
//
// func TestDoOauthFlowRequestWithValidToken(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, false, time.Now().AddDate(0, 0, 1).Unix())
// }
//
// func TestDoOauthFlowRequestWithExpiredToken(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, false, time.Now().AddDate(0, 0, -1).Unix())
// }
//
// func TestDoOauthFlowRequestWithValidTokenFailFirst(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, 1).Unix())
// }
//
// func TestDoOauthFlowRequestWithExpiredTokenFailFirst(t *testing.T) {
// 	t.Parallel()
// 	testDoOauthFlowRequest(t, true, time.Now().AddDate(0, 0, -1).Unix())
// }
//
// func testDoOauthFlowRequest(t *testing.T, failFirst bool, tokenExpiration int64) {
//
// 	mockUAA := setupMockServer(t,
// 		msRoute("/oauth/token"),
// 		msMethod("POST"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockUAAResponse)))
//
// 	defer mockUAA.Close()
//
// 	numReqs := 0
// 	mockHCF := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		if numReqs == 0 && failFirst {
// 			w.WriteHeader(http.StatusUnauthorized)
// 			numReqs++
// 			return
// 		}
//
// 		if "/v2/info" != r.URL.Path {
// 			t.Errorf("Wanted path '/v2/info', got path '%s'", r.URL.Path)
// 		}
// 		if "GET" != r.Method {
// 			t.Errorf("Wanted method 'GET', got method '%s'", r.Method)
// 		}
// 		w.WriteHeader(http.StatusOK)
// 		io.WriteString(w, "hi")
// 		numReqs++
// 		return
// 	}))
//
// 	req, _ := http.NewRequest("GET", mockHCF.URL+"/v2/info", nil)
// 	pp := setupPortalProxy()
// 	var mockCNSI = cnsiRecord{
// 		Name:                  "mockHCF",
// 		CNSIType:              cnsiHCF,
// 		AuthorizationEndpoint: mockUAA.URL,
// 		TokenEndpoint:         mockUAA.URL,
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	var mockTokenRecord = tokenRecord{
// 		AuthToken:   mockUAAToken,
// 		TokenExpiry: tokenExpiration,
// 	}
// 	pp.setCNSITokenRecord(mockCNSIGuid, mockUserGuid, mockTokenRecord)
//
// 	res, err := pp.doOauthFlowRequest(CNSIRequest{
// 		GUID:     mockCNSIGuid,
// 		UserGUID: mockUserGuid,
// 	}, req)
//
// 	if err != nil {
// 		t.Error(err)
// 	}
//
// 	if res.StatusCode != 200 {
// 		t.Errorf("Wanted status '200', got '%d'", res.StatusCode)
// 	}
//
// 	// close this explicitly here so we can thread-safely check the bool
// 	mockHCF.Close()
//
// 	expectReqs := 1
// 	if failFirst {
// 		expectReqs = 2
// 	}
// 	if numReqs != expectReqs {
// 		t.Error("Expected %d requests, %d were run", expectReqs, numReqs)
// 	}
// }

//
// func TestDoOauthFlowRequestWithMissingCNSITokenRecord(t *testing.T) {
// 	t.Parallel()
//
// 	req, _ := http.NewRequest("GET", "/v2/info", nil)
// 	pp := setupPortalProxy()
//
// 	var mockTokenRecord = tokenRecord{
// 		AuthToken:   mockUAAToken,
// 		TokenExpiry: 0,
// 	}
// 	pp.setCNSITokenRecord("not-the-right-guid", mockUserGuid, mockTokenRecord)
//
// 	_, err := pp.doOauthFlowRequest(CNSIRequest{
// 		GUID:     mockCNSIGuid,
// 		UserGUID: mockUserGuid,
// 	}, req)
//
// 	if err == nil {
// 		t.Error("Request should not succeed if there is no matching CNSI tokenRecord")
// 	}
// }
