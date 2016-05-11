package main

// import (
// 	"net/http"
// 	"net/url"
// 	"testing"
// 	"time"
// )
//
// func TestDoRequest(t *testing.T) {
// 	t.Parallel()
//
// 	mockHCFServer := setupMockServer(t,
// 		msRoute("/v2/info"),
// 		msMethod("GET"),
// 		msStatus(http.StatusOK),
// 		msBody(jsonMust(mockV2InfoResponse)))
//
// 	defer mockHCFServer.Close()
//
// 	uri, err := url.Parse(mockHCFServer.URL + "/v2/info")
// 	if err != nil {
// 		t.Fatal(err)
// 	}
// 	mockCNSIRequest := CNSIRequest{
// 		GUID:     mockCNSIGuid,
// 		UserGUID: mockUserGuid,
// 		Method:   "GET",
// 		URL:      uri,
// 	}
//
// 	pp := setupPortalProxy()
// 	var mockCNSI = cnsiRecord{
// 		Name:                  "mockHCF",
// 		CNSIType:              cnsiHCF,
// 		AuthorizationEndpoint: mockHCFServer.URL,
// 		TokenEndpoint:         mockHCFServer.URL + "/oauth/token",
// 	}
// 	pp.CNSIs[mockCNSIGuid] = mockCNSI
//
// 	var mockTokenRecord = tokenRecord{
// 		AuthToken:   mockUAAToken,
// 		TokenExpiry: time.Now().AddDate(0, 0, 1).Unix(),
// 	}
// 	pp.setCNSITokenRecord(mockCNSIGuid, mockUserGuid, mockTokenRecord)
//
// 	done := make(chan CNSIRequest)
// 	kill := make(chan struct{})
// 	go pp.doRequest(mockCNSIRequest, done, kill)
//
// 	newCNSIRequest := <-done
//
// 	if newCNSIRequest.Error != nil {
// 		t.Error(newCNSIRequest.Error)
// 	}
//
// 	if string(newCNSIRequest.Response) != jsonMust(mockV2InfoResponse) {
// 		t.Errorf("Did not get expected output: %v", newCNSIRequest.Response)
// 	}
//
// }
