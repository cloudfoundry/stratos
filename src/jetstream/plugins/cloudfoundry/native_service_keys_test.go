// src/jetstream/plugins/cloudfoundry/native_service_keys_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/stratosjobs"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func serviceKeyCtx(method, target, body string, paramNames, paramVals []string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	var req *http.Request
	if body == "" {
		req = httptest.NewRequest(method, target, nil)
	} else {
		req = httptest.NewRequest(method, target, strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	}
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames(paramNames...)
	c.SetParamValues(paramVals...)
	return c, rec
}

// TestCreateServiceKey_ForcesTypeKey verifies the handler pins type=key on the
// upstream credential-binding create even if the client body says otherwise.
func TestCreateServiceKey_ForcesTypeKey(t *testing.T) {
	var receivedBody map[string]interface{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodPost:
			_ = json.NewDecoder(r.Body).Decode(&receivedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write([]byte(`{"guid":"key-1","type":"key"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{testProxy: &mockNativeCFProxy{
		userID:      "user-1",
		cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}}

	// Client deliberately sends type=app — handler must override to "key".
	body := `{"type":"app","name":"my-key","relationships":{"service_instance":{"data":{"guid":"si-1"}}}}`
	c, rec := serviceKeyCtx(http.MethodPost, "/pp/v1/cf/service_keys/cnsi-1", body, []string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.createServiceKey(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, "key", receivedBody["type"], "handler must force type=key")
	assert.Equal(t, "my-key", receivedBody["name"])
}

// TestCreateServiceKey_FastPathResolvesAsync covers the async create branch.
func TestCreateServiceKey_FastPathResolvesAsync(t *testing.T) {
	var jobGets atomic.Int32
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodPost:
			w.Header().Set("Location", "/v3/jobs/job-key-1")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"guid":"job-key-1","operation":"service_credential_binding.create","state":"PROCESSING"}`))
		case r.URL.Path == "/v3/jobs/job-key-1" && r.Method == http.MethodGet:
			jobGets.Add(1)
			_, _ = w.Write([]byte(`{"guid":"job-key-1","state":"COMPLETE"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.asyncTranslator = NewCFJobTranslator(plugin)

	body := `{"name":"my-key","relationships":{"service_instance":{"data":{"guid":"si-1"}}}}`
	c, rec := serviceKeyCtx(http.MethodPost, "/pp/v1/cf/service_keys/cnsi-1", body, []string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.createServiceKey(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, string(stratosjobs.JobStateComplete), resp["state"])
	assert.GreaterOrEqual(t, jobGets.Load(), int32(1))
}

// TestDeleteServiceKey_FastPathResolves covers the async delete branch.
func TestDeleteServiceKey_FastPathResolves(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings/key-9" && r.Method == http.MethodDelete:
			w.Header().Set("Location", "/v3/jobs/job-keydel-1")
			w.WriteHeader(http.StatusAccepted)
		case r.URL.Path == "/v3/jobs/job-keydel-1" && r.Method == http.MethodGet:
			_, _ = w.Write([]byte(`{"guid":"job-keydel-1","state":"COMPLETE"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
		asyncTracker: stratosjobs.NewInMemoryTracker(stratosjobs.InMemoryTrackerConfig{}),
	}
	plugin.asyncTranslator = NewCFJobTranslator(plugin)

	c, rec := serviceKeyCtx(http.MethodDelete, "/pp/v1/cf/service_keys/cnsi-1/key-9", "",
		[]string{"cnsiGuid", "keyGuid"}, []string{"cnsi-1", "key-9"})

	require.NoError(t, plugin.deleteServiceKey(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, string(stratosjobs.JobStateComplete), resp["state"])
}

// TestGetNativeServiceKeys_FiltersTypeKey verifies the list handler pins
// the type=key filter on the upstream query.
func TestGetNativeServiceKeys_FiltersTypeKey(t *testing.T) {
	var gotQuery string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodGet:
			gotQuery = r.URL.RawQuery
			_, _ = w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"key-1","type":"key"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{testProxy: &mockNativeCFProxy{
		userID:      "user-1",
		cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}}

	c, rec := serviceKeyCtx(http.MethodGet, "/pp/v1/cf/service_keys/cnsi-1?service_instance_guids=si-1", "",
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.getNativeServiceKeys(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, gotQuery, "type=key")
	assert.Contains(t, gotQuery, "service_instance_guids=si-1")
}

// TestGetNativeServiceKeyDetails returns the key credentials.
func TestGetNativeServiceKeyDetails(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings/key-1/details" && r.Method == http.MethodGet:
			_, _ = w.Write([]byte(`{"credentials":{"username":"u","password":"p"}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{testProxy: &mockNativeCFProxy{
		userID:      "user-1",
		cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}}

	c, rec := serviceKeyCtx(http.MethodGet, "/pp/v1/cf/service_keys/cnsi-1/key-1/details", "",
		[]string{"cnsiGuid", "keyGuid"}, []string{"cnsi-1", "key-1"})

	require.NoError(t, plugin.getNativeServiceKeyDetails(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	creds, ok := resp["credentials"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "u", creds["username"])
}

// TestGetNativeServiceKeyParameters returns the broker parameters.
func TestGetNativeServiceKeyParameters(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings/key-1/parameters" && r.Method == http.MethodGet:
			_, _ = w.Write([]byte(`{"parameters":{"foo":"bar"}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer capiServer.Close()

	plugin := &CloudFoundrySpecification{testProxy: &mockNativeCFProxy{
		userID:      "user-1",
		cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(capiServer.URL)},
		tokenRecord: api.TokenRecord{AuthToken: "test-token"},
	}}

	c, rec := serviceKeyCtx(http.MethodGet, "/pp/v1/cf/service_keys/cnsi-1/key-1/parameters", "",
		[]string{"cnsiGuid", "keyGuid"}, []string{"cnsi-1", "key-1"})

	require.NoError(t, plugin.getNativeServiceKeyParameters(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "foo")
}
