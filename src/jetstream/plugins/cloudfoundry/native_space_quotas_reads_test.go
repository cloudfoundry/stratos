// src/jetstream/plugins/cloudfoundry/native_space_quotas_reads_test.go
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

// TestGetNativeSpaceQuotas_ReturnsMappedQuotas verifies the handler
// drives a CAPI SpaceQuotas().List call and maps capi.SpaceQuotaV3
// resources onto flat StSpaceQuota DTOs. Space quotas cap apps /
// services / routes within a single org, optionally bound to specific
// spaces. Read-only at this tier — create/update/delete and apply-to-
// spaces stay legacy until a use case warrants them.
//
// Mirrors the org-quota shape minus Domains (space quotas don't gate
// domains) plus an OrganizationGUID stamping the parent org.
func TestGetNativeSpaceQuotas_ReturnsMappedQuotas(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/space_quotas" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"sq-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"small",
						"apps":{"total_memory_in_mb":2048,"total_instance_memory_in_mb":1024,"total_instances":50,"total_app_tasks":25},
						"services":{"paid_services_allowed":true,"total_service_instances":10,"total_service_keys":10},
						"routes":{"total_routes":50,"total_reserved_ports":5},
						"relationships":{
							"organization":{"data":{"guid":"org-1"}},
							"spaces":{"data":[{"guid":"space-a"},{"guid":"space-b"}]}
						}
					},
					{
						"guid":"sq-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"unbounded",
						"apps":{},
						"services":{"paid_services_allowed":false},
						"routes":{},
						"relationships":{
							"organization":{"data":{"guid":"org-2"}},
							"spaces":{"data":[]}
						}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/space_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSpaceQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits)

	var resp StSpaceQuotasResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.TotalResults)

	q0 := resp.Resources[0]
	assert.Equal(t, "sq-1", q0.GUID)
	assert.Equal(t, "small", q0.Name)
	assert.Equal(t, 2048, q0.TotalMemoryInMB)
	assert.Equal(t, 1024, q0.TotalInstanceMemoryInMB)
	assert.Equal(t, 50, q0.TotalInstances)
	assert.Equal(t, 25, q0.TotalAppTasks)
	assert.True(t, q0.PaidServicesAllowed)
	assert.Equal(t, 10, q0.TotalServiceInstances)
	assert.Equal(t, 50, q0.TotalRoutes)
	assert.Equal(t, "org-1", q0.OrganizationGUID)
	assert.Equal(t, 2, q0.SpaceCount)
	assert.Equal(t, "cnsi-1", q0.CnsiGUID)

	q1 := resp.Resources[1]
	assert.Equal(t, "unbounded", q1.Name)
	assert.Equal(t, -1, q1.TotalMemoryInMB, "missing limit must coerce to -1 (Unlimited)")
	assert.Equal(t, -1, q1.TotalServiceInstances)
	assert.Equal(t, -1, q1.TotalRoutes)
	assert.False(t, q1.PaidServicesAllowed)
	assert.Equal(t, "org-2", q1.OrganizationGUID)
	assert.Equal(t, 0, q1.SpaceCount)
}

// TestGetNativeSpaceQuotas_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no space quotas.
func TestGetNativeSpaceQuotas_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/space_quotas" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/space_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSpaceQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"resources":[]`)
}

// TestGetNativeSpaceQuotas_DrainsAllPages confirms pagination drain.
func TestGetNativeSpaceQuotas_DrainsAllPages(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/space_quotas" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if r.URL.Query().Get("page") == "2" {
				w.Write([]byte(`{
					"pagination": {"total_results": 3, "total_pages": 2, "next": null},
					"resources": [{"guid":"sq-3","name":"third","apps":{},"services":{},"routes":{},"relationships":{"organization":{"data":{"guid":"org-1"}},"spaces":{"data":[]}}}]
				}`))
				return
			}
			w.Write([]byte(`{
				"pagination": {"total_results": 3, "total_pages": 2, "next": {"href": "/v3/space_quotas?page=2"}},
				"resources": [
					{"guid":"sq-1","name":"first","apps":{},"services":{},"routes":{},"relationships":{"organization":{"data":{"guid":"org-1"}},"spaces":{"data":[]}}},
					{"guid":"sq-2","name":"second","apps":{},"services":{},"routes":{},"relationships":{"organization":{"data":{"guid":"org-1"}},"spaces":{"data":[]}}}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/space_quotas/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/space_quotas/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSpaceQuotas(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 2, hits)

	var resp StSpaceQuotasResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 3)
}
