package main

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo"
)

func TestVerifySession(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})
	res, _, ctx, pp := setupHTTPTest(req)

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = mockUserGUID
	sessionValues["exp"] = time.Now().Add(time.Hour).Unix()

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("Unable to mock/stub user in session object."))
	}

	if err := pp.verifySession(ctx); err != nil {
		t.Error(err)
	}

	header := res.Header()
	contentType := header.Get("Content-Type")
	if contentType != "application/json; charset=utf-8" {
		t.Errorf("Expected content type 'application/json', got: %s", contentType)
	}

	// var expectedBody = "{\"account\":\"admin\",\"scope\":\"cloud_controller.admin\"}"
	var expectedBody = "{\"account\":\"admin\",\"scope\":\"openid scim.read cloud_controller.admin uaa.user cloud_controller.read password.write routing.router_groups.read cloud_controller.write doppler.firehose scim.write\"}"
	if res == nil || strings.TrimSpace(res.Body.String()) != expectedBody {
		t.Errorf("Response Body incorrect.  Expected %s  Received %s", expectedBody, res.Body)
	}

}

func TestVerifySessionNoDate(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})
	_, _, ctx, pp := setupHTTPTest(req)

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = mockUserGUID
	// Note the lack of an "exp" key.

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("Unable to mock/stub user in session object."))
	}

	err := pp.verifySession(ctx)
	if err == nil {
		t.Errorf("Expected an 403 error with 'Could not find session date' string. got %s", err)
	}

	errHTTP, ok := err.(*echo.HTTPError)
	if !ok {
		t.Error("Couldn't coerce our error into and HTTPError.")
	}
	var expectedCode = 403
	if errHTTP.Code != expectedCode {
		t.Errorf("Bad response code:  Expected %d  Received %d", expectedCode, errHTTP.Code)
	}

}

func TestVerifySessionExpired(t *testing.T) {
	t.Parallel()

	req := setupMockReq("GET", "", map[string]string{
		"username": "admin",
		"password": "changeme",
	})
	_, _, ctx, pp := setupHTTPTest(req)

	// Set a dummy userid in session - normally the login to UAA would do this.
	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = mockUserGUID
	sessionValues["exp"] = time.Now().Add(-time.Hour).Unix()

	if errSession := pp.setSessionValues(ctx, sessionValues); errSession != nil {
		t.Error(errors.New("Unable to mock/stub user in session object."))
	}

	err := pp.verifySession(ctx)
	if err == nil {
		t.Error("Expected an 403 error with 'Session has expired' string.")
	}

	errHTTP, ok := err.(*echo.HTTPError)
	if !ok {
		t.Error("Couldn't coerce our error into and HTTPError.")
	}
	var expectedCode = 403
	if errHTTP.Code != expectedCode {
		t.Errorf("Bad response code:  Expected %d  Received %d", expectedCode, errHTTP.Code)
	}
}
