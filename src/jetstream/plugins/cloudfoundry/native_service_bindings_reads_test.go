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

// TestGetAppServiceBindings_JoinsNamesFromServiceInstances verifies the
// two-step join: list app-type bindings filtered to the app, then batch-fetch
// the referenced service instances and populate serviceInstanceName /
// serviceInstanceType on each StServiceBinding.
func TestGetAppServiceBindings_JoinsNamesFromServiceInstances(t *testing.T) {
	bindingsHits := 0
	instancesHits := 0
	var bindingsQuery string
	var instancesQuery string
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodGet:
			bindingsHits++
			bindingsQuery = r.URL.RawQuery
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid": "binding-1",
						"created_at": "2026-04-22T12:00:00Z",
						"updated_at": "2026-04-22T12:00:00Z",
						"name": "db-binding",
						"type": "app",
						"relationships": {
							"app": {"data": {"guid": "app-1"}},
							"service_instance": {"data": {"guid": "si-1"}}
						}
					},
					{
						"guid": "binding-2",
						"created_at": "2026-04-22T12:05:00Z",
						"updated_at": "2026-04-22T12:05:00Z",
						"name": "cache-binding",
						"type": "app",
						"relationships": {
							"app": {"data": {"guid": "app-1"}},
							"service_instance": {"data": {"guid": "si-2"}}
						}
					}
				]
			}`))
		case r.URL.Path == "/v3/service_instances" && r.Method == http.MethodGet:
			instancesHits++
			instancesQuery = r.URL.RawQuery
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid": "si-1",
						"created_at": "2026-04-22T11:00:00Z",
						"updated_at": "2026-04-22T11:00:00Z",
						"name": "primary-db",
						"type": "managed",
						"relationships": {}
					},
					{
						"guid": "si-2",
						"created_at": "2026-04-22T11:10:00Z",
						"updated_at": "2026-04-22T11:10:00Z",
						"name": "user-cache",
						"type": "user-provided",
						"relationships": {}
					}
				]
			}`))
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
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, bindingsHits)
	assert.Equal(t, 1, instancesHits)
	assert.Contains(t, bindingsQuery, "app_guids=app-1")
	// CF v3 accepts the singular `type` filter on /v3/service_credential_bindings,
	// not `types`. Regression guard: a plural typo here silently produces a
	// 400 "Unknown query parameter(s): 'types'" and the picker stays empty.
	assert.Contains(t, bindingsQuery, "type=app")
	assert.NotContains(t, bindingsQuery, "types=app")
	assert.Contains(t, instancesQuery, "guids=")

	var resp StratosPagedResponse[StServiceBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

	byBindingGUID := map[string]StServiceBinding{}
	for _, b := range resp.Resources {
		byBindingGUID[b.GUID] = b
	}

	b1 := byBindingGUID["binding-1"]
	assert.Equal(t, "app-1", b1.AppGUID)
	assert.Equal(t, "si-1", b1.ServiceInstanceGUID)
	assert.Equal(t, "primary-db", b1.ServiceInstanceName)
	assert.Equal(t, "managed", b1.ServiceInstanceType)
	assert.Equal(t, "app", b1.BindingType)

	b2 := byBindingGUID["binding-2"]
	assert.Equal(t, "si-2", b2.ServiceInstanceGUID)
	assert.Equal(t, "user-cache", b2.ServiceInstanceName)
	assert.Equal(t, "user-provided", b2.ServiceInstanceType)
}

// TestGetAppServiceBindings_EmptyReturnsEmptyArray ensures no bindings
// yields `"resources":[]` (not null) — the frontend iterates without a
// nil guard.
func TestGetAppServiceBindings_EmptyReturnsEmptyArray(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":1,"next":null},"resources":[]}`))
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
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.True(t, strings.Contains(rec.Body.String(), `"resources":[]`), "expected empty array, got: %s", rec.Body.String())
}

// TestGetAppServiceBindings_SoftFallbackWhenInstanceFetchFails verifies the
// picker still renders even when the service-instance batch fetch fails —
// each StServiceBinding falls back to the binding's own Name.
func TestGetAppServiceBindings_SoftFallbackWhenInstanceFetchFails(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_credential_bindings" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{
				"pagination": {"total_results": 1, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid": "binding-1",
						"created_at": "2026-04-22T12:00:00Z",
						"updated_at": "2026-04-22T12:00:00Z",
						"name": "db-binding",
						"type": "app",
						"relationships": {
							"app": {"data": {"guid": "app-1"}},
							"service_instance": {"data": {"guid": "si-1"}}
						}
					}
				]
			}`))
		case r.URL.Path == "/v3/service_instances" && r.Method == http.MethodGet:
			// Upstream error on the name-lookup leg. The handler should still
			// return 200 for the bindings and fall back to the binding name.
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"errors":[{"code":500,"title":"CF-Boom","detail":"nope"}]}`))
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
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	// Fallback uses the binding's own Name when SI fetch fails.
	assert.Equal(t, "db-binding", resp.Resources[0].ServiceInstanceName)
	assert.Equal(t, "", resp.Resources[0].ServiceInstanceType)
}

// TestGetAppServiceBindings_PerPagePassthrough verifies the primary
// fetch is a single-page passthrough: caller's per_page+page forward
// verbatim to /v3/service_credential_bindings.
func TestGetAppServiceBindings_PerPagePassthrough(t *testing.T) {
	var hits int
	var lastPerPage, lastPage string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_credential_bindings":
			hits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			_, _ = w.Write([]byte(`{"pagination":{"total_results":7,"total_pages":1},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits)
	assert.Equal(t, "25", lastPerPage)
	assert.Equal(t, "2", lastPage)

	var resp StratosPagedResponse[StServiceBinding]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 7, resp.Pagination.TotalResults)
}

// TestGetAppServiceBindings_OmitsPagingWhenAbsent — V3-default contract.
func TestGetAppServiceBindings_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_credential_bindings":
			_, sawPerPage = r.URL.Query()["per_page"]
			_, sawPage = r.URL.Query()["page"]
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetAppServiceBindings_CountsFastPath verifies ?return=counts:
// per_page=1 plus the app_guids+type=app filters.
func TestGetAppServiceBindings_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/service_credential_bindings", 4, "app_guids", "type")
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1/app-1/service_bindings?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/apps/:cnsiGuid/:appGuid/service_bindings")
	c.SetParamNames("cnsiGuid", "appGuid")
	c.SetParamValues("cnsi-1", "app-1")

	require.NoError(t, plugin.getAppServiceBindings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)
	assert.Equal(t, "app-1", q.Filters["app_guids"])
	assert.Equal(t, "app", q.Filters["type"])

	var resp StAppServiceBindingsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 4, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
