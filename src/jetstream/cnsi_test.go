package main

import (
	"errors"
	"net/http"
	"testing"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	_ "github.com/satori/go.uuid"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestRegisterCFCluster(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":           "Some fancy CF Cluster",
		"api_endpoint":        mockV2Info.URL,
		"skip_ssl_validation": "true",
		"cnsi_client_id":      mockClientId,
		"cnsi_client_secret":  mockClientSecret,
	})

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	mock.ExpectExec(insertIntoCNSIs).
		WithArgs(sqlmock.AnyArg(), "Some fancy CF Cluster", "cf", mockV2Info.URL, mockAuthEndpoint, mockTokenEndpoint, mockDopplerEndpoint, true, mockClientId, sqlmock.AnyArg(), false, "", "", "").
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err != nil {
		t.Errorf("Failed to register cluster: %v", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestRegisterCFClusterWithMissingName(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without cluster name")
	}
}

func getCFPlugin(p *portalProxy, endpointType string) interfaces.EndpointPlugin {

	for _, plugin := range p.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		if endpointType == endpointPlugin.GetType() {
			return endpointPlugin
		}
	}
	return nil
}

func TestRegisterCFClusterWithMissingAPIEndpoint(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name": "Some fancy CF Cluster",
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without api endpoint")
	}
}

func TestRegisterCFClusterWithInvalidAPIEndpoint(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	// force a bad api_endpoint to be sure it is handled properly:
	// src: https://bryce.fisher-fleig.org/blog/golang-testing-stdlib-errors/index.html
	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": "%zzzzz",
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not be able to register cluster without a valid api endpoint")
	}
}

func TestRegisterCFClusterWithBadV2Request(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusNotFound),
		msBody(""))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, _ := setupHTTPTest(req)

	defer db.Close()

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Error("Should not register cluster if call to v2/info fails")
	}
}

func TestRegisterCFClusterButCantSaveCNSIRecord(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy CF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp, db, mock := setupHTTPTest(req)

	defer db.Close()

	mock.ExpectExec(insertIntoCNSIs).
		WillReturnError(errors.New("Unknown Database Error"))

	if err := pp.RegisterEndpoint(ctx, getCFPlugin(pp, "cf").Info); err == nil {
		t.Errorf("Unexpected success - should not be able to register cluster without token save.")
	}
}
func TestListCNSIs(t *testing.T) {
	t.Skip("TODO: fix this test")
	t.Parallel()

	req := setupMockReq("GET", "", nil)

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Mock the CNSIs in the database
	expectedCNSIList := expectCFAndCERows()
	mock.ExpectQuery(selectAnyFromCNSIs).
		WillReturnRows(expectedCNSIList)

	err := pp.listCNSIs(ctx)
	if err != nil {
		t.Errorf("Unable to retriece list of registered CNSIs from /cnsis: %v", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
	}
}

func TestListCNSIsWhenListFails(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)

	_, _, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()

	// Mock a database error
	mock.ExpectQuery(selectAnyFromCNSIs).
		WillReturnError(errors.New("Unknown Database Error"))

	err := pp.listCNSIs(ctx)

	if err == nil {
		t.Errorf("Should receive an error when unable to get a list of registered CNSIs from /cnsis: %v", err)
	}
}

func TestGetCFv2InfoWithBadURL(t *testing.T) {
	t.Parallel()

	cfPlugin := initCFPlugin(&portalProxy{})

	endpointPlugin, _ := cfPlugin.GetEndpointPlugin()
	invalidEndpoint := "%zzzz"
	if _, _, err := endpointPlugin.Info(invalidEndpoint, true, ""); err == nil {
		t.Error("getCFv2Info should not return a valid response when the URL is bad.")
	}
}

func TestGetCFv2InfoWithInvalidEndpoint(t *testing.T) {
	t.Parallel()

	cfPlugin := initCFPlugin(&portalProxy{})
	endpointPlugin, _ := cfPlugin.GetEndpointPlugin()

	ep := "http://invalid.net"
	if _, _, err := endpointPlugin.Info(ep, true, ""); err == nil {
		t.Error("getCFv2Info should not return a valid response when the endpoint is invalid.")
	}
}
