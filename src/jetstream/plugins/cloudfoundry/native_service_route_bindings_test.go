// src/jetstream/plugins/cloudfoundry/native_service_route_bindings_test.go
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

// routeBindingCtx wires an echo context for the route-binding handlers.
func routeBindingCtx(method, target, body string, paramNames, paramVals []string) (echo.Context, *httptest.ResponseRecorder) {
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

// TestCreateServiceRouteBinding_ForwardsBody verifies the v3-shape body is
// forwarded to POST /v3/service_route_bindings and the sync 201 surfaced.
func TestCreateServiceRouteBinding_ForwardsBody(t *testing.T) {
	capiHits := 0
	var receivedBody map[string]interface{}
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_route_bindings" && r.Method == http.MethodPost:
			capiHits++
			_ = json.NewDecoder(r.Body).Decode(&receivedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write([]byte(`{"guid":"srb-1"}`))
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

	body := `{"relationships":{"route":{"data":{"guid":"route-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`
	c, rec := routeBindingCtx(http.MethodPost, "/pp/v1/cf/service_route_bindings/cnsi-1", body, []string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.createServiceRouteBinding(c))
	assert.Equal(t, http.StatusCreated, rec.Code)
	assert.Equal(t, 1, capiHits)

	rels, ok := receivedBody["relationships"].(map[string]interface{})
	require.True(t, ok, "upstream body missing relationships")
	route, ok := rels["route"].(map[string]interface{})
	require.True(t, ok, "upstream body missing relationships.route")
	data, ok := route["data"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "route-1", data["guid"])
}

// TestCreateServiceRouteBinding_FastPathResolvesAsync exercises the async
// (202 + Job) branch resolving to COMPLETE within the fast-path window.
func TestCreateServiceRouteBinding_FastPathResolvesAsync(t *testing.T) {
	var jobGets atomic.Int32
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_route_bindings" && r.Method == http.MethodPost:
			w.Header().Set("Location", "/v3/jobs/job-srb-1")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"guid":"job-srb-1","operation":"service_route_binding.create","state":"PROCESSING"}`))
		case r.URL.Path == "/v3/jobs/job-srb-1" && r.Method == http.MethodGet:
			jobGets.Add(1)
			_, _ = w.Write([]byte(`{"guid":"job-srb-1","operation":"service_route_binding.create","state":"COMPLETE"}`))
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

	body := `{"relationships":{"route":{"data":{"guid":"route-1"}},"service_instance":{"data":{"guid":"si-1"}}}}`
	c, rec := routeBindingCtx(http.MethodPost, "/pp/v1/cf/service_route_bindings/cnsi-1", body, []string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.createServiceRouteBinding(c))
	assert.Equal(t, http.StatusOK, rec.Code, "fast-path resolve should surface 200")
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, string(stratosjobs.JobStateComplete), resp["state"])
	assert.GreaterOrEqual(t, jobGets.Load(), int32(1))
}

// TestDeleteServiceRouteBinding_FastPathResolves covers the async delete path.
func TestDeleteServiceRouteBinding_FastPathResolves(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_route_bindings/srb-9" && r.Method == http.MethodDelete:
			w.Header().Set("Location", "/v3/jobs/job-del-1")
			w.WriteHeader(http.StatusAccepted)
		case r.URL.Path == "/v3/jobs/job-del-1" && r.Method == http.MethodGet:
			_, _ = w.Write([]byte(`{"guid":"job-del-1","operation":"service_route_binding.delete","state":"COMPLETE"}`))
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

	c, rec := routeBindingCtx(http.MethodDelete, "/pp/v1/cf/service_route_bindings/cnsi-1/srb-9", "",
		[]string{"cnsiGuid", "bindingGuid"}, []string{"cnsi-1", "srb-9"})

	require.NoError(t, plugin.deleteServiceRouteBinding(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, string(stratosjobs.JobStateComplete), resp["state"])
}

// TestGetNativeServiceRouteBindings_List verifies the list handler forwards
// filters and returns a paged envelope.
func TestGetNativeServiceRouteBindings_List(t *testing.T) {
	var gotQuery string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_route_bindings" && r.Method == http.MethodGet:
			gotQuery = r.URL.RawQuery
			_, _ = w.Write([]byte(`{"pagination":{"total_results":1,"total_pages":1},"resources":[{"guid":"srb-1"}]}`))
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

	c, rec := routeBindingCtx(http.MethodGet, "/pp/v1/cf/service_route_bindings/cnsi-1?service_instance_guids=si-1", "",
		[]string{"cnsiGuid"}, []string{"cnsi-1"})

	require.NoError(t, plugin.getNativeServiceRouteBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, gotQuery, "service_instance_guids=si-1")
	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	resources, ok := resp["resources"].([]interface{})
	require.True(t, ok)
	assert.Len(t, resources, 1)
}

// TestGetNativeServiceRouteBindingParameters returns the broker parameters.
func TestGetNativeServiceRouteBindingParameters(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_route_bindings/srb-1/parameters" && r.Method == http.MethodGet:
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

	c, rec := routeBindingCtx(http.MethodGet, "/pp/v1/cf/service_route_bindings/cnsi-1/srb-1/parameters", "",
		[]string{"cnsiGuid", "bindingGuid"}, []string{"cnsi-1", "srb-1"})

	require.NoError(t, plugin.getNativeServiceRouteBindingParameters(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "foo")
}
