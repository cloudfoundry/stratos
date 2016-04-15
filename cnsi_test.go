package main

import (
	"net/http"
	"testing"
)

func TestGetHCFv2InfoWithBadURL(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusNotFound))

	defer mockV2Info.Close()

	req := setupMockReq("POST", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": "http:/not.a.valid.url",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	numRegisteredClusters := len(pp.CNSIs)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Cluster should not be registered if API Endpoint was invalid")
	}

	if len(pp.CNSIs) > numRegisteredClusters {
		t.Error("Cluster should not be registered if API Endpoint was invalid")
	}

}

func TestRegisterHCFCluster(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	numRegisteredClusters := len(pp.CNSIs)

	if err := pp.registerHCFCluster(ctx); err != nil {
		t.Errorf("Failed to register cluster: %v", err)
	}

	if len(pp.CNSIs) == numRegisteredClusters {
		t.Error("Failed to add cluster to CNSI map")
	}

}

func TestRegisterHCFClusterWithMissingName(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", map[string]string{
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	numRegisteredClusters := len(pp.CNSIs)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not be able to register cluster without cluster name")
	}

	if len(pp.CNSIs) > numRegisteredClusters {
		t.Error("Should not add clusters with no name to cluster map")
	}

}

func TestRegisterHCFClusterWithBadV2Request(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusNotFound),
		msBody(""))

	defer mockV2Info.Close()

	req := setupMockReq("POST", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	numRegisteredClusters := len(pp.CNSIs)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not register cluster if call to v2/info fails")
	}

	if len(pp.CNSIs) > numRegisteredClusters {
		t.Error("Should not save cluster to map if call to v2/info fails")
	}

}

func TestGetCNSIRecord(t *testing.T) {
	t.Parallel()

	pp := setupPortalProxy()
	pp.CNSIs[mockCNSIGuid] = cnsiRecord{
		APIEndpoint:           mockAPIEndpoint,
		AuthorizationEndpoint: mockAuthEndpoint,
	}

	_, ok := pp.getCNSIRecord(mockCNSIGuid)
	if !ok {
		t.Error("Failed to retrieve registered CNSI")
	}
}

func TestGetCNSIRecordMissing(t *testing.T) {
	t.Parallel()

	pp := setupPortalProxy()
	pp.CNSIs[mockCNSIGuid] = cnsiRecord{
		APIEndpoint:           mockAPIEndpoint,
		AuthorizationEndpoint: mockAuthEndpoint,
	}

	_, ok := pp.getCNSIRecord("not-a-registered-cnsi-guid")
	if ok {
		t.Error("Returned a record when passed a non-registered GUID")
	}
}

func TestListRegisteredCNSIs(t *testing.T) {
	t.Skip("GET requests broken in mock server right now")
	t.Parallel()

	req := setupMockReq("GET", nil)

	_, _, ctx, pp := setupHTTPTest(req)
	pp.CNSIs[mockCNSIGuid] = cnsiRecord{
		APIEndpoint:           mockAPIEndpoint,
		AuthorizationEndpoint: mockAuthEndpoint,
	}

	err := pp.listRegisteredCNSIs(ctx)
	if err != nil {
		t.Errorf("Unable to retriece list of registered CNSIs from /cnsis: %v", err)
	}
}
