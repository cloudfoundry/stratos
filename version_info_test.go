package main

import (
	"testing"
	"net/http/httptest"
	"github.com/labstack/echo"
	"encoding/json"
	"reflect"
	"os"
)

type VersionJSON struct {
	Proxy_version    string
	Database_version string
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
	res, e, ctx, pp := setupHTTPTest(req)
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

func VersionTestJSON(t *testing.T) (*VersionJSON) {
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
		Proxy_version: "dev",
		Database_version: "dev",
	}

    // Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func () { osGetEnv = oldOsGetEnv } ()

	osGetEnv = func (key string) (string) {
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
		Proxy_version: "1.2.3",
		Database_version: "1.2.3",
	}

    // Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func () { osGetEnv = oldOsGetEnv } ()

	osGetEnv = func (key string) (string) {
		if key == "CONSOLE_VERSION" {
			return "1.2.3"
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

func TestVersionProxyAndDatabaseEnvVar(t *testing.T) {

	expectedJSON := &VersionJSON{
		Proxy_version: "1.2.3",
		Database_version: "4.5.6",
	}

    // Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func () { osGetEnv = oldOsGetEnv } ()

	osGetEnv = func (key string) (string) {
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
		Proxy_version: "dev",
		Database_version: "4.5.6",
	}

    // Mock out the os.getenv call.
	oldOsGetEnv := osGetEnv

	defer func () { osGetEnv = oldOsGetEnv } ()

	osGetEnv = func (key string) (string) {
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
