// src/jetstream/plugins/cloudfoundry/native_feature_flags_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNativeFeatureFlags_ReturnsMappedFlags verifies the handler
// drives a CAPI FeatureFlags().List call and maps capi.FeatureFlag
// resources onto flat StFeatureFlag DTOs. Feature flags govern user-
// visible affordances (e.g. user_org_creation, app_bits_upload). They
// have no GUID — name is the identity. Read-only at this tier; toggling
// flags is a platform-admin operation not surfaced.
func TestGetNativeFeatureFlags_ReturnsMappedFlags(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/feature_flags" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"name":"user_org_creation",
						"enabled":true,
						"updated_at":"2026-04-22T12:00:00Z",
						"custom_error_message":null
					},
					{
						"name":"app_bits_upload",
						"enabled":false,
						"updated_at":null,
						"custom_error_message":"App bits uploads are temporarily disabled"
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/feature_flags/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/feature_flags/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeFeatureFlags(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StratosPagedResponse[StFeatureFlag]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

	f0 := resp.Resources[0]
	assert.Equal(t, "user_org_creation", f0.Name)
	assert.True(t, f0.Enabled)
	assert.Equal(t, "", f0.CustomErrorMessage, "null custom_error_message must marshal as empty string")
	assert.Equal(t, "cnsi-1", f0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", f0.UpdatedAt)

	f1 := resp.Resources[1]
	assert.Equal(t, "app_bits_upload", f1.Name)
	assert.False(t, f1.Enabled)
	assert.Equal(t, "App bits uploads are temporarily disabled", f1.CustomErrorMessage)
	assert.Equal(t, "", f1.UpdatedAt, "null updated_at must marshal as empty string")
}

// TestGetNativeFeatureFlags_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no feature flags.
func TestGetNativeFeatureFlags_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/feature_flags" && r.Method == http.MethodGet:
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 1, "next": null},"resources":[]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/feature_flags/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/feature_flags/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeFeatureFlags(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, `"resources":[]`, "empty resources must marshal as [] not null")
}

// TestGetNativeFeatureFlags_PerPagePassthrough verifies single-page passthrough:
// caller's per_page+page forward verbatim to /v3/feature_flags and the
// response carries a V3-shape pagination envelope.
func TestGetNativeFeatureFlags_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60,
			"total_pages": 3,
			"first": {"href":"/v3/feature_flags?page=1&per_page=25"},
			"last":  {"href":"/v3/feature_flags?page=3&per_page=25"},
			"next":  {"href":"/v3/feature_flags?page=3&per_page=25"},
			"previous": {"href":"/v3/feature_flags?page=1&per_page=25"}
		},
		"resources": [{"name":"first","enabled":true,"updated_at":null,"custom_error_message":null}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/feature_flags", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/feature_flags/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/feature_flags/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeFeatureFlags(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits, "single-page passthrough must issue exactly one CAPI call")
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StFeatureFlag]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
	assert.Equal(t, 3, resp.Pagination.TotalPages)
	assert.NotNil(t, resp.Pagination.First)
	assert.NotNil(t, resp.Pagination.Last)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeFeatureFlags_OmitsPagingWhenAbsent asserts that with no caller-supplied
// per_page/page, the upstream URL carries neither key.
func TestGetNativeFeatureFlags_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/feature_flags", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/feature_flags/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/feature_flags/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeFeatureFlags(c))
	assert.False(t, q.PerPagePresent, "per_page must be absent when caller omits it")
	assert.False(t, q.PagePresent, "page must be absent when caller omits it")
}

// TestGetNativeFeatureFlags_CountsFastPath verifies ?return=counts.
func TestGetNativeFeatureFlags_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/feature_flags", 16)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/feature_flags/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/feature_flags/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeFeatureFlags(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)

	var resp StFeatureFlagsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 16, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
