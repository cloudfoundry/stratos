// src/jetstream/plugins/cloudfoundry/native_buildpacks_reads_test.go
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

// TestGetNativeBuildpacks_ReturnsMappedBuildpacks verifies the handler
// drives a CAPI Buildpacks().List call and maps capi.Buildpack resources
// onto flat StBuildpack DTOs. Buildpacks govern how source bundles get
// staged; the CF Buildpacks tab is read-only at this tier — uploads and
// reorders stay legacy until a use case warrants them.
func TestGetNativeBuildpacks_ReturnsMappedBuildpacks(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/buildpacks" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"bp-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"java_buildpack",
						"state":"READY",
						"filename":"java_buildpack-cached-cflinuxfs4-v4.50.tgz",
						"stack":"cflinuxfs4",
						"position":1,
						"lifecycle":"buildpack",
						"enabled":true,
						"locked":false
					},
					{
						"guid":"bp-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"go_buildpack",
						"state":"AWAITING_UPLOAD",
						"filename":null,
						"stack":null,
						"position":2,
						"lifecycle":"buildpack",
						"enabled":false,
						"locked":true
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StratosPagedResponse[StBuildpack]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

	b0 := resp.Resources[0]
	assert.Equal(t, "bp-1", b0.GUID)
	assert.Equal(t, "java_buildpack", b0.Name)
	assert.Equal(t, "READY", b0.State)
	assert.Equal(t, "java_buildpack-cached-cflinuxfs4-v4.50.tgz", b0.Filename)
	assert.Equal(t, "cflinuxfs4", b0.Stack)
	assert.Equal(t, 1, b0.Position)
	assert.Equal(t, "buildpack", b0.Lifecycle)
	assert.True(t, b0.Enabled)
	assert.False(t, b0.Locked)
	assert.Equal(t, "cnsi-1", b0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", b0.CreatedAt)

	b1 := resp.Resources[1]
	assert.Equal(t, "bp-2", b1.GUID)
	assert.Equal(t, "go_buildpack", b1.Name)
	assert.Equal(t, "AWAITING_UPLOAD", b1.State)
	assert.Equal(t, "", b1.Filename, "null filename must marshal as empty string")
	assert.Equal(t, "", b1.Stack, "null stack must marshal as empty string")
	assert.False(t, b1.Enabled)
	assert.True(t, b1.Locked)
}

// TestGetNativeBuildpacks_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no buildpacks.
func TestGetNativeBuildpacks_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/buildpacks" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, `"resources":[]`, "empty resources must marshal as [] not null")
}

// TestGetNativeBuildpacks_PerPagePassthrough verifies the handler is a
// single-page passthrough: caller's per_page+page forward verbatim to
// /v3/buildpacks and the response carries a V3-shape pagination
// envelope (no internal multi-page drain).
func TestGetNativeBuildpacks_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60,
			"total_pages": 3,
			"first": {"href":"/v3/buildpacks?page=1&per_page=25"},
			"last":  {"href":"/v3/buildpacks?page=3&per_page=25"},
			"next":  {"href":"/v3/buildpacks?page=3&per_page=25"},
			"previous": {"href":"/v3/buildpacks?page=1&per_page=25"}
		},
		"resources": [{"guid":"bp-1","name":"first","state":"READY","position":1,"lifecycle":"buildpack","enabled":true,"locked":false}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/buildpacks", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits, "single-page passthrough must issue exactly one CAPI call")
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StBuildpack]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
	assert.Equal(t, 3, resp.Pagination.TotalPages)
	assert.NotNil(t, resp.Pagination.First)
	assert.NotNil(t, resp.Pagination.Last)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeBuildpacks_OmitsPagingWhenAbsent asserts that with no
// caller-supplied per_page/page, the upstream URL carries neither key —
// V3 applies its server defaults rather than Stratos injecting them.
func TestGetNativeBuildpacks_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/buildpacks", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.False(t, q.PerPagePresent, "per_page must be absent on upstream when caller omits it")
	assert.False(t, q.PagePresent, "page must be absent on upstream when caller omits it")
}

// TestGetNativeBuildpacks_CountsFastPath verifies ?return=counts:
// upstream gets per_page=1 and the response is the flat {totalResults}
// shape consumed by home-page badges and endpoint-data summaries.
func TestGetNativeBuildpacks_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/buildpacks", 12)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/buildpacks/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/buildpacks/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeBuildpacks(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)

	var resp StBuildpacksResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 12, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
