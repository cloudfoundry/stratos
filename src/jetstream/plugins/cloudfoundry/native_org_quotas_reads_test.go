// src/jetstream/plugins/cloudfoundry/native_org_quotas_reads_test.go
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

// TestGetNativeOrgQuotas_ReturnsMappedQuotas verifies the handler drives
// a CAPI OrganizationQuotas().List call and maps capi.OrganizationQuota
// resources onto flat StOrgQuota DTOs. Org quotas cap apps / services /
// routes / domains across all spaces in an organization. Read-only at
// this tier — create/update/delete and apply-to-org stay legacy until a
// use case warrants them.
//
// Quota limits are nullable in v3 (a null int = "no limit"). We coerce
// nil → -1 server-side so the wire shape stays flat ints and the
// frontend can render -1 as "Unlimited" without null-guarding every cell.
func TestGetNativeOrgQuotas_ReturnsMappedQuotas(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/organization_quotas" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"q-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"default",
						"apps":{"total_memory_in_mb":102400,"per_process_memory_in_mb":2048,"total_instances":1000,"per_app_tasks":500},
						"services":{"paid_services_allowed":true,"total_service_instances":250,"total_service_keys":250},
						"routes":{"total_routes":1000,"total_reserved_ports":100},
						"domains":{"total_domains":10},
						"relationships":{"organizations":{"data":[{"guid":"org-1"},{"guid":"org-2"}]}}
					},
					{
						"guid":"q-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"unlimited",
						"apps":{},
						"services":{"paid_services_allowed":false},
						"routes":{},
						"domains":{},
						"relationships":{"organizations":{"data":[]}}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/organization_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StratosPagedResponse[StOrgQuota]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

	q0 := resp.Resources[0]
	assert.Equal(t, "q-1", q0.GUID)
	assert.Equal(t, "default", q0.Name)
	assert.Equal(t, 102400, q0.TotalMemoryInMB)
	assert.Equal(t, 2048, q0.TotalInstanceMemoryInMB)
	assert.Equal(t, 1000, q0.TotalInstances)
	assert.Equal(t, 500, q0.TotalAppTasks)
	assert.True(t, q0.PaidServicesAllowed)
	assert.Equal(t, 250, q0.TotalServiceInstances)
	assert.Equal(t, 250, q0.TotalServiceKeys)
	assert.Equal(t, 1000, q0.TotalRoutes)
	assert.Equal(t, 100, q0.TotalReservedPorts)
	assert.Equal(t, 10, q0.TotalDomains)
	assert.Equal(t, 2, q0.OrganizationCount)
	assert.Equal(t, "cnsi-1", q0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", q0.CreatedAt)

	q1 := resp.Resources[1]
	assert.Equal(t, "unlimited", q1.Name)
	assert.Equal(t, -1, q1.TotalMemoryInMB, "missing limit must coerce to -1 (Unlimited)")
	assert.Equal(t, -1, q1.TotalInstances)
	assert.Equal(t, -1, q1.TotalServiceInstances)
	assert.Equal(t, -1, q1.TotalRoutes)
	assert.Equal(t, -1, q1.TotalDomains)
	assert.False(t, q1.PaidServicesAllowed)
	assert.Equal(t, 0, q1.OrganizationCount)
}

// TestGetNativeOrgQuotas_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no quotas.
func TestGetNativeOrgQuotas_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/organization_quotas" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/organization_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"resources":[]`)
}

// TestGetNativeOrgQuotas_PerPagePassthrough verifies single-page passthrough:
// caller's per_page+page forward verbatim to /v3/organization_quotas and the
// response carries a V3-shape pagination envelope.
func TestGetNativeOrgQuotas_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60,
			"total_pages": 3,
			"first": {"href":"/v3/organization_quotas?page=1&per_page=25"},
			"last":  {"href":"/v3/organization_quotas?page=3&per_page=25"},
			"next":  {"href":"/v3/organization_quotas?page=3&per_page=25"},
			"previous": {"href":"/v3/organization_quotas?page=1&per_page=25"}
		},
		"resources": [{"guid":"oq-1","name":"first"}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/organization_quotas", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/organization_quotas/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits, "single-page passthrough must issue exactly one CAPI call")
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StOrgQuota]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
	assert.Equal(t, 3, resp.Pagination.TotalPages)
	assert.NotNil(t, resp.Pagination.First)
	assert.NotNil(t, resp.Pagination.Last)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeOrgQuotas_OmitsPagingWhenAbsent asserts that with no caller-supplied
// per_page/page, the upstream URL carries neither key.
func TestGetNativeOrgQuotas_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/organization_quotas", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/organization_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgQuotas(c))
	assert.False(t, q.PerPagePresent, "per_page must be absent when caller omits it")
	assert.False(t, q.PagePresent, "page must be absent when caller omits it")
}

// TestGetNativeOrgQuotas_CountsFastPath verifies ?return=counts.
func TestGetNativeOrgQuotas_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/organization_quotas", 5)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/organization_quotas/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/organization_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)

	var resp StOrgQuotasResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 5, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
