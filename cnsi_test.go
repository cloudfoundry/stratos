package main

import (
	"errors"
	"net/http"
	"testing"

	_ "github.com/satori/go.uuid"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

func TestRegisterHCFCluster(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	// Setup database expectations for CNSO record insert
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	sql := `INSERT INTO cnsis`
	mock.ExpectExec(sql).
		WithArgs(sqlmock.AnyArg(), "Some fancy HCF Cluster", "hcf", mockV2Info.URL, "https://login.127.0.0.1", "https://uaa.127.0.0.1").
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pp.registerHCFCluster(ctx); err != nil {
		t.Errorf("Failed to register cluster: %v", err)
	}

	if dberr := mock.ExpectationsWereMet(); dberr != nil {
		t.Errorf("There were unfulfilled expectations: %s", dberr)
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

	req := setupMockReq("POST", "", map[string]string{
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not be able to register cluster without cluster name")
	}
}

func TestRegisterHCFClusterWithMissingAPIEndpoint(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name": "Some fancy HCF Cluster",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not be able to register cluster without api endpoint")
	}
}

func TestRegisterHCFClusterWithInvalidAPIEndpoint(t *testing.T) {
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
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": "%zzzzz",
	})

	_, _, ctx, pp := setupHTTPTest(req)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not be able to register cluster without a valid api endpoint")
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

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Error("Should not register cluster if call to v2/info fails")
	}
}

func TestRegisterHCFClusterButCantSaveCNSIRecord(t *testing.T) {
	t.Parallel()

	mockV2Info := setupMockServer(t,
		msRoute("/v2/info"),
		msMethod("GET"),
		msStatus(http.StatusOK),
		msBody(jsonMust(mockV2InfoResponse)))

	defer mockV2Info.Close()

	req := setupMockReq("POST", "", map[string]string{
		"cnsi_name":    "Some fancy HCF Cluster",
		"api_endpoint": mockV2Info.URL,
	})

	_, _, ctx, pp := setupHTTPTest(req)

	// Setup database expectations for CNSO record insert
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	sql := `INSERT INTO cnsis`
	mock.ExpectExec(sql).
		WillReturnError(errors.New("Unknown Database Error"))

	if err := pp.registerHCFCluster(ctx); err == nil {
		t.Errorf("Unexpected success - should not be able to register cluster withot token save.")
	}
}

func TestListCNSIs(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", nil)

	_, _, ctx, pp := setupHTTPTest(req)

	// Setup database expectations for CNSO record insert
	db, mock, dberr := sqlmock.New()
	if dberr != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", dberr)
	}
	defer db.Close()
	pp.DatabaseConnectionPool = db

	// Mock the CNSIs in the database
	expectedCNSIList := sqlmock.NewRows([]string{"guid", "name", "cnsi_type", "api_endpoint", "auth_endpoint", "token_endpoint"}).
		AddRow(mockCNSIGUID, "Some fancy HCF Cluster", "hcf", urlMust(mockAPIEndpoint), mockAuthEndpoint, mockAuthEndpoint)
	sql := `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint FROM cnsis`
	mock.ExpectQuery(sql).
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

	_, _, ctx, pp := setupHTTPTest(req)

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

	err := pp.listCNSIs(ctx)

	if err == nil {
		t.Errorf("Should receive an error when unable to get a list of registered CNSIs from /cnsis: %v", err)
	}
}

func TestGetHCFv2InfoWithBadURL(t *testing.T) {
	t.Parallel()

	invalidEndpoint := "%zzzz"
	if _, err := getHCFv2Info(invalidEndpoint); err == nil {
		t.Error("getHCFv2Info should not return a valid response when the URL is bad.")
	}
}

func TestGetHCFv2InfoWithInvalidEndpoint(t *testing.T) {
	t.Parallel()

	ep := "http://invalid.net"
	if _, err := getHCFv2Info(ep); err == nil {
		t.Error("getHCFv2Info should not return a valid response when the endpoint is invalid.")
	}
}
