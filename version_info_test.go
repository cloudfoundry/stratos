package main

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"reflect"
	"testing"

	"gopkg.in/DATA-DOG/go-sqlmock.v1"

	"github.com/labstack/echo"
)

type VersionJSON struct {
	ProxyVersion    string
	DatabaseVersion string
}

// Test helpers

func getJSON(res *httptest.ResponseRecorder, outputJSON interface{}) error {
	return json.NewDecoder(res.Body).Decode(outputJSON)
}

func VersionTestSetup() (*httptest.ResponseRecorder, *echo.Echo, echo.Context, *portalProxy, error) {
	req := setupMockReq("GET", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})
	res, e, ctx, pp, db, _ := setupHTTPTest(req)
	defer db.Close()
	err := pp.getVersions(ctx)

	return res, e, ctx, pp, err
}

func VersionTestSetupWithErrorCheck(t *testing.T) (*httptest.ResponseRecorder, *echo.Echo, echo.Context, *portalProxy) {
	res, e, ctx, pp, err := VersionTestSetup()
	if err != nil {
		t.Errorf("getVersions returned an error: %s", err)
	}
	return res, e, ctx, pp
}

func VersionTestJSON(t *testing.T) *VersionJSON {
	res, _, _, _ := VersionTestSetupWithErrorCheck(t)

	receivedJSON := new(VersionJSON)
	if err := getJSON(res, receivedJSON); err != nil {
		t.Errorf("Unable to unmarshal resulting JSON.  %s", err)
	}

	return receivedJSON
}

// Tests

func TestVersionContentType(t *testing.T) {
	t.Parallel()

	res, _, _, _ := VersionTestSetupWithErrorCheck(t)

	expectedContentType := "application/json; charset=utf-8"

	contentType := res.Header().Get("Content-Type")
	if contentType != expectedContentType {
		t.Errorf("Expected content type '%s' got: '%s'", expectedContentType, contentType)
	}
}

func TestVersionStatusCode(t *testing.T) {
	t.Parallel()

	res, _, _, _ := VersionTestSetupWithErrorCheck(t)

	expectedHTTPStatus := 200

	code := res.Code
	if code != expectedHTTPStatus {
		t.Errorf("Expected status code of '%d', got '%d'", expectedHTTPStatus, code)
	}
}

func TestVersionDefault(t *testing.T) {
	t.Parallel()

	expectedJSON := &VersionJSON{
		ProxyVersion:    "dev",
		DatabaseVersion: "dev",
	}

	// Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func() { osGetEnv = oldOsGetEnv }()

	osGetEnv = func(key string) string {
		if key == "CONSOLE_VERSION" {
			return ""
		} else if key == "DATABASE_VERSION" {
			return ""
		}
		return os.Getenv(key)
	}
	receivedJSON := VersionTestJSON(t)

	if !reflect.DeepEqual(expectedJSON, receivedJSON) {
		t.Errorf("Expected JSON '%s', got '%s'", expectedJSON, receivedJSON)
	}
}

func TestVersionProxyEnvVar(t *testing.T) {
	expectedJSON := &VersionJSON{
		ProxyVersion:    "1.2.3",
		DatabaseVersion: "1.2.4",
	}

	req := setupMockReq("POST", "", map[string]string{})
	_, _, _, _, db, mock := setupHTTPTest(req)
	defer db.Close()

	expectedVersionRow := sqlmock.NewRows([]string{"guid"}).AddRow("1.2.3")
	sql := `SELECT version_id FROM goose_db_version`
	mock.ExpectQuery(sql).WillReturnRows(expectedVersionRow)

	// Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func() { osGetEnv = oldOsGetEnv }()

	osGetEnv = func(key string) string {
		if key == "CONSOLE_VERSION" {
			return "1.2.3"
		} else if key == "DATABASE_VERSION" {
			return "1.2.4"
		}
		return os.Getenv(key)
	}

	receivedJSON := VersionTestJSON(t)

	if !reflect.DeepEqual(expectedJSON, receivedJSON) {
		t.Errorf("Expected JSON '%s', got '%s'", expectedJSON, receivedJSON)
	}
}

func TestVersionProxyAndDatabaseEnvVar(t *testing.T) {

	expectedJSON := &VersionJSON{
		ProxyVersion:    "1.2.3",
		DatabaseVersion: "4.5.6",
	}

	// Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func() { osGetEnv = oldOsGetEnv }()

	osGetEnv = func(key string) string {
		if key == "CONSOLE_VERSION" {
			return "1.2.3"
		} else if key == "DATABASE_VERSION" {
			return "4.5.6"
		}
		return os.Getenv(key)
	}

	receivedJSON := VersionTestJSON(t)

	if !reflect.DeepEqual(expectedJSON, receivedJSON) {
		t.Errorf("Expected JSON '%s', got '%s'", expectedJSON, receivedJSON)
	}
}

func TestVersionDatabaseEnvVar(t *testing.T) {

	expectedJSON := &VersionJSON{
		ProxyVersion:    "dev",
		DatabaseVersion: "4.5.6",
	}

	// Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func() { osGetEnv = oldOsGetEnv }()

	osGetEnv = func(key string) string {
		if key == "CONSOLE_VERSION" {
			return ""
		} else if key == "DATABASE_VERSION" {
			return "4.5.6"
		}
		return os.Getenv(key)
	}

	receivedJSON := VersionTestJSON(t)

	if !reflect.DeepEqual(expectedJSON, receivedJSON) {
		t.Errorf("Expected JSON '%s', got '%s'", expectedJSON, receivedJSON)
	}
}
