// src/jetstream/plugins/cloudfoundry/native_service_bindings_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCreateServiceBinding_ForwardsBody verifies the handler forwards the
// Stratos-shape v3 body to POST /v3/service_credential_bindings on the target
// CF foundation. The handler decodes the client body into a capi
// ServiceCredentialBindingCreateRequest (which mirrors v3 shape exactly) and
// passes it to ServiceCredentialBindings().Create. The synchronous path
// (201 Created with a binding JSON) is surfaced to the Stratos caller as 201
// with the binding guid in the body.
func TestCreateServiceBinding_ForwardsBody(t *testing.T) {
	capiHits := 0
	var receivedBody map[string]interface{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodPost {
			capiHits++
			_ = json.NewDecoder(r.Body).Decode(&receivedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"guid":"binding-1","type":"app"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	body := `{"type":"app","relationships":{"app":{"data":{"guid":"app-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/service_bindings/cnsi-1", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_bindings/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.createServiceBinding(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, 1, capiHits)
	assert.Equal(t, "app", receivedBody["type"])

	rels, ok := receivedBody["relationships"].(map[string]interface{})
	require.True(t, ok, "upstream body missing relationships")
	app, ok := rels["app"].(map[string]interface{})
	require.True(t, ok, "upstream body missing relationships.app")
	data, ok := app["data"].(map[string]interface{})
	require.True(t, ok, "upstream body missing relationships.app.data")
	assert.Equal(t, "app-1", data["guid"])

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "binding-1", resp["guid"])
}

// TestCreateServiceBinding_PropagatesCapiError verifies that a non-2xx error
// envelope from CF (e.g. CF-UnprocessableEntity) is classified via
// handleCapiError so the Stratos caller sees the original status and body.
func TestCreateServiceBinding_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		w.Write([]byte(`{"errors":[{"code":10008,"title":"CF-UnprocessableEntity","detail":"App is already bound"}]}`))
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	body := `{"type":"app","relationships":{"app":{"data":{"guid":"app-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/service_bindings/cnsi-1", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_bindings/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.createServiceBinding(c))
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Contains(t, rec.Body.String(), "UnprocessableEntity")
}

// TestCreateServiceBinding_RejectsInvalidBody verifies that a malformed JSON
// payload is rejected with 400 Bad Request before any upstream call is made.
func TestCreateServiceBinding_RejectsInvalidBody(t *testing.T) {
	capiHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		capiHits++
		w.WriteHeader(http.StatusCreated)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/pp/v1/cf/service_bindings/cnsi-1", strings.NewReader("not-json"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_bindings/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	err := plugin.createServiceBinding(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok, "expected *echo.HTTPError, got %T", err)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
	assert.Equal(t, 0, capiHits, "no upstream call should be made on malformed body")
}

// TestDeleteServiceBinding_ForwardsByGuid verifies the handler issues a DELETE
// to /v3/service_credential_bindings/{bindingGuid} and surfaces CF's 202
// Accepted (async delete returning a Job) to the Stratos caller.
func TestDeleteServiceBinding_ForwardsByGuid(t *testing.T) {
	capiHits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		if r.URL.Path == "/v3/service_credential_bindings/binding-1" && r.Method == http.MethodDelete {
			capiHits++
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Location", "/v3/jobs/delete-job-1")
			w.WriteHeader(http.StatusAccepted)
			w.Write([]byte(`{"guid":"delete-job-1","operation":"service_credential_binding.delete","state":"PROCESSING"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/service_bindings/cnsi-1/binding-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_bindings/:cnsiGuid/:bindingGuid")
	c.SetParamNames("cnsiGuid", "bindingGuid")
	c.SetParamValues("cnsi-1", "binding-1")

	require.NoError(t, plugin.deleteServiceBinding(c))
	assert.Equal(t, http.StatusAccepted, rec.Code)
	assert.Equal(t, 1, capiHits)
}

// TestDeleteServiceBinding_PropagatesCapiError verifies that a 404 from CF is
// preserved via handleCapiError so the caller sees the original status and
// error envelope.
func TestDeleteServiceBinding_PropagatesCapiError(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v3" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"errors":[{"code":10010,"title":"CF-ResourceNotFound","detail":"Service binding not found"}]}`))
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/pp/v1/cf/service_bindings/cnsi-1/missing", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_bindings/:cnsiGuid/:bindingGuid")
	c.SetParamNames("cnsiGuid", "bindingGuid")
	c.SetParamValues("cnsi-1", "missing")

	require.NoError(t, plugin.deleteServiceBinding(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "ResourceNotFound")
}
