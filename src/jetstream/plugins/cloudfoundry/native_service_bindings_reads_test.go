// src/jetstream/plugins/cloudfoundry/native_service_bindings_reads_test.go
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

// bindingsTestServer is a single-fixture v3 stub for every per-tier test
// in this file. It captures the bindings list query so tests can assert
// upstream forwarding (per_page, page, app_guids, type, include),
// counts hits per upstream path, and emits a deterministic two-binding
// response with the included `apps` + `service_instances` blocks v3
// returns when ?include=app,service_instance is requested.
type bindingsTestServer struct {
	*httptest.Server
	listHits      int
	lastListQuery string
}

func newBindingsTestServer(t *testing.T) *bindingsTestServer {
	t.Helper()
	s := &bindingsTestServer{}
	s.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings":
			s.listHits++
			s.lastListQuery = r.URL.RawQuery
			body := map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 2, "total_pages": 1,
					"first": map[string]interface{}{"href": "/v3/service_credential_bindings?page=1"},
					"last":  map[string]interface{}{"href": "/v3/service_credential_bindings?page=1"},
				},
				"resources": []map[string]interface{}{
					{
						"guid":       "binding-1",
						"name":       "db-binding",
						"type":       "app",
						"created_at": "2026-04-22T12:00:00Z",
						"updated_at": "2026-04-22T12:00:00Z",
						"relationships": map[string]interface{}{
							"app":              map[string]interface{}{"data": map[string]interface{}{"guid": "app-1"}},
							"service_instance": map[string]interface{}{"data": map[string]interface{}{"guid": "si-1"}},
						},
					},
					{
						"guid":       "binding-2",
						"name":       "cache-binding",
						"type":       "app",
						"created_at": "2026-04-22T12:05:00Z",
						"updated_at": "2026-04-22T12:05:00Z",
						"relationships": map[string]interface{}{
							"app":              map[string]interface{}{"data": map[string]interface{}{"guid": "app-1"}},
							"service_instance": map[string]interface{}{"data": map[string]interface{}{"guid": "si-2"}},
						},
					},
				},
			}
			// v3 only emits the `included` block when the request asked
			// for it via ?include=. Mirror that so tests exercise both
			// the include-aware path and the fallback when no include is
			// requested.
			if strings.Contains(r.URL.RawQuery, "include=") {
				body["included"] = map[string]interface{}{
					"apps": []map[string]interface{}{
						{"guid": "app-1", "name": "my-app"},
					},
					"service_instances": []map[string]interface{}{
						{"guid": "si-1", "name": "primary-db", "type": "managed"},
						{"guid": "si-2", "name": "user-cache", "type": "user-provided"},
					},
				}
			}
			_ = json.NewEncoder(w).Encode(body)
		default:
			http.NotFound(w, r)
		}
	}))
	return s
}

func newBindingsPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "cnsi-1",
				APIEndpoint: mustParseURL(serverURL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

// bindingsInvoke wires up echo.Context for the bindings list handler.
func bindingsInvoke(plugin *CloudFoundrySpecification, query string) (*httptest.ResponseRecorder, error) {
	e := echo.New()
	url := "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings"
	if query != "" {
		url += "?" + query
	}
	req := httptest.NewRequest(http.MethodGet, url, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")
	err := plugin.getAppServiceBindings(c)
	return rec, err
}

// TestGetAppServiceBindings_Base — default mode (no ?return=) returns
// base shape: guid + cnsiGuid + type + serviceInstance.{guid} + app.{guid}
// + createdAt only. No name, no joined fields, no include= forwarded.
func TestGetAppServiceBindings_Base(t *testing.T) {
	srv := newBindingsTestServer(t)
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.listHits, "exactly one list call")
	assert.NotContains(t, srv.lastListQuery, "include=", "base mode does NOT forward include")

	var resp StratosPagedResponse[StServiceCredentialBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	r0 := resp.Resources[0]
	assert.Equal(t, "binding-1", r0.GUID)
	assert.Equal(t, "cnsi-1", r0.CnsiGUID)
	assert.Equal(t, "app", r0.Type)
	assert.Equal(t, "si-1", r0.ServiceInstance.GUID)
	require.NotNil(t, r0.App)
	assert.Equal(t, "app-1", r0.App.GUID)
	// Base omits the optional fields.
	assert.Empty(t, r0.Name)
	assert.Empty(t, r0.ServiceInstance.Name)
	assert.Empty(t, r0.ServiceInstance.Type)
	assert.Empty(t, r0.App.Name)
}

// TestGetAppServiceBindings_Summary — ?return=summary forwards
// ?include=app,service_instance, reads brokers+SI from the response's
// included block, and populates name + serviceInstance.{name,type} +
// app.name on each row.
func TestGetAppServiceBindings_Summary(t *testing.T) {
	srv := newBindingsTestServer(t)
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "return=summary&per_page=25&page=1")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.listHits, "summary mode is one CAPI call (include= inline)")
	assert.Contains(t, srv.lastListQuery, "include=app%2Cservice_instance",
		"summary mode must forward include=app,service_instance")

	var resp StratosPagedResponse[StServiceCredentialBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)

	byGUID := map[string]StServiceCredentialBinding{}
	for _, b := range resp.Resources {
		byGUID[b.GUID] = b
	}

	b1 := byGUID["binding-1"]
	assert.Equal(t, "db-binding", b1.Name)
	assert.Equal(t, "si-1", b1.ServiceInstance.GUID)
	assert.Equal(t, "primary-db", b1.ServiceInstance.Name)
	assert.Equal(t, "managed", b1.ServiceInstance.Type)
	require.NotNil(t, b1.App)
	assert.Equal(t, "app-1", b1.App.GUID)
	assert.Equal(t, "my-app", b1.App.Name)

	b2 := byGUID["binding-2"]
	assert.Equal(t, "user-cache", b2.ServiceInstance.Name)
	assert.Equal(t, "user-provided", b2.ServiceInstance.Type)
}

// TestGetAppServiceBindings_SoftFallbackWhenIncludedMissing — when the
// upstream omits the included block (or it's malformed), summary mode
// falls back to the binding's own Name on the serviceInstance ref so
// rows still render.
func TestGetAppServiceBindings_SoftFallbackWhenIncludedMissing(t *testing.T) {
	// Custom server that omits the included block even when ?include=
	// is forwarded — simulates an upstream gap.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings":
			_, _ = w.Write([]byte(`{
				"pagination": {"total_results": 1, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid": "binding-1", "name": "db-binding", "type": "app",
						"created_at": "2026-04-22T12:00:00Z", "updated_at": "2026-04-22T12:00:00Z",
						"relationships": {
							"app": {"data": {"guid": "app-1"}},
							"service_instance": {"data": {"guid": "si-1"}}
						}
					}
				]
			}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "return=summary")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceCredentialBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	r0 := resp.Resources[0]
	// Fall back to binding's own name when SI lookup misses.
	assert.Equal(t, "db-binding", r0.ServiceInstance.Name)
	assert.Empty(t, r0.ServiceInstance.Type)
}

// TestGetAppServiceBindings_EmptyReturnsEmptyArray — no bindings yields
// `"resources":[]` (not null) — frontend iterates without a nil guard.
func TestGetAppServiceBindings_EmptyReturnsEmptyArray(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings":
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":1,"next":null},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"resources":[]`)
}

// TestGetAppServiceBindings_PerPagePassthrough verifies the primary
// fetch is a single-page passthrough: caller's per_page+page forward
// verbatim to /v3/service_credential_bindings.
func TestGetAppServiceBindings_PerPagePassthrough(t *testing.T) {
	srv := newBindingsTestServer(t)
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "per_page=25&page=2")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.listHits)
	assert.Contains(t, srv.lastListQuery, "per_page=25")
	assert.Contains(t, srv.lastListQuery, "page=2")
}

// TestGetAppServiceBindings_OmitsPagingWhenAbsent — V3-default contract.
func TestGetAppServiceBindings_OmitsPagingWhenAbsent(t *testing.T) {
	srv := newBindingsTestServer(t)
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	_, err := bindingsInvoke(plugin, "")
	require.NoError(t, err)
	assert.NotContains(t, srv.lastListQuery, "per_page=")
	assert.NotContains(t, srv.lastListQuery, "page=")
}

// TestGetAppServiceBindings_CountsFastPath verifies ?return=counts:
// per_page=1 plus the app_guids+type=app filters, returning the legacy
// flat envelope shape (preserved for existing counts probes).
func TestGetAppServiceBindings_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/service_credential_bindings", 4, "app_guids", "type")
	defer srv.Close()
	plugin := newBindingsPlugin(srv.URL)

	rec, err := bindingsInvoke(plugin, "return=counts")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)
	assert.Equal(t, "app-1", q.Filters["app_guids"])
	assert.Equal(t, "app", q.Filters["type"])

	// Counts ships the legacy flat envelope shape.
	var resp struct {
		Resources    []StServiceCredentialBinding `json:"resources"`
		TotalResults int                          `json:"totalResults"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 4, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
