package main

import (
	"encoding/json"
	"log"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	. "github.com/smartystreets/goconvey/convey"
	"gopkg.in/DATA-DOG/go-sqlmock.v1"
)

type VersionJSON struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion int64  `json:"database_version"`
}

// Test helpers

func getJSON(res *httptest.ResponseRecorder, outputJSON interface{}) error {
	return json.Unmarshal(res.Body.Bytes(), &outputJSON)
}

func versionTestSetup() (*httptest.ResponseRecorder, *echo.Echo, echo.Context, *portalProxy, error) {

	req := setupMockReq("GET", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})
	res, e, ctx, pp, db, mock := setupHTTPTest(req)
	defer db.Close()
	log.Println("about to retrieve versions endpoint")

	expectVersionRow := sqlmock.NewRows([]string{"version_id"}).
		AddRow(mockProxyVersion)

	mock.ExpectQuery(getDbVersion).WillReturnRows(expectVersionRow)

	err := pp.getVersions(ctx)

	if err != nil {
		log.Printf("versionTestSetup returned an error: %s", err)

	}

	return res, e, ctx, pp, err
}

func versionTestSetupWithErrorCheck(t *testing.T) (*httptest.ResponseRecorder, *echo.Echo, echo.Context, *portalProxy) {
	res, e, ctx, pp, err := versionTestSetup()
	if err != nil {
		t.Errorf("getVersions returned an error: %s", err)
	}
	return res, e, ctx, pp
}

func versionTestJSON(t *testing.T) *VersionJSON {
	res, _, _, _ := versionTestSetupWithErrorCheck(t)

	receivedJSON := new(VersionJSON)
	if err := getJSON(res, receivedJSON); err != nil {
		t.Errorf("Unable to unmarshal resulting JSON.  %s", err)
	}

	log.Printf("receivedJson: %+v", receivedJSON)

	return receivedJSON
}

// Tests
func TestVersionContentType(t *testing.T) {
	t.Parallel()
	Convey("Response should have the correct content-type", t, func() {

		res, _, _, _ := versionTestSetupWithErrorCheck(t)

		expectedContentType := "application/json; charset=UTF-8"

		contentType := res.Header().Get("Content-Type")
		So(contentType, ShouldEqual, expectedContentType)
	})
}

func TestVersionStatusCode(t *testing.T) {
	t.Parallel()

	Convey("Request should have `200` status code", t, func() {
		res, _, _, _ := versionTestSetupWithErrorCheck(t)
		expectedHTTPStatus := 200
		So(res.Code, ShouldEqual, expectedHTTPStatus)
	})

}

func TestVersionDefault(t *testing.T) {
	t.Parallel()

	Convey("default version test", t, func() {
		expectedJSON := &VersionJSON{
			ProxyVersion:    "dev",
			DatabaseVersion: mockProxyVersion,
		}

		receivedJSON := versionTestJSON(t)

		So(receivedJSON, ShouldResemble, expectedJSON)

	})

}
