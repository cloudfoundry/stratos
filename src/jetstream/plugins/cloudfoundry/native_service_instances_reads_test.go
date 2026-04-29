// src/jetstream/plugins/cloudfoundry/native_service_instances_reads_test.go
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

// TestGetNativeServiceInstances_PerPagePassthrough verifies the handler
// is a single-page passthrough: caller's per_page+page forward verbatim
// to /v3/service_instances and the response is a V3-shape paged
// envelope. The per-page plan→offering join only resolves names for the
// instances on the current page (one bounded plans + one bounded
// offerings call).
func TestGetNativeServiceInstances_PerPagePassthrough(t *testing.T) {
	var siHits, planHits, offHits int
	var lastPerPage, lastPage string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_instances":
			siHits++
			lastPerPage = r.URL.Query().Get("per_page")
			lastPage = r.URL.Query().Get("page")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 17, "total_pages": 2,
					"first": map[string]interface{}{"href": "/v3/service_instances?page=1"},
					"last":  map[string]interface{}{"href": "/v3/service_instances?page=2"},
					"next":  map[string]interface{}{"href": "/v3/service_instances?page=2"},
				},
				"resources": []map[string]interface{}{
					{
						"guid": "si-1", "name": "redis-instance", "type": "managed",
						"relationships": map[string]interface{}{
							"space":        map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
							"service_plan": map[string]interface{}{"data": map[string]interface{}{"guid": "plan-1"}},
						},
					},
				},
			})
		case "/v3/service_plans":
			planHits++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "plan-1", "name": "small",
						"relationships": map[string]interface{}{
							"service_offering": map[string]interface{}{"data": map[string]interface{}{"guid": "off-1"}},
						},
					},
				},
			})
		case "/v3/service_offerings":
			offHits++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{"guid": "off-1", "name": "redis"},
				},
			})
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_instances/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeServiceInstances(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, siHits, "single-page passthrough must issue exactly one /v3/service_instances call")
	assert.Equal(t, "25", lastPerPage)
	assert.Equal(t, "2", lastPage)
	assert.Equal(t, 1, planHits, "per-page plan join expected")
	assert.Equal(t, 1, offHits, "per-page offering join expected")

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, "redis", resp.Resources[0].ServiceOfferingName)
	assert.Equal(t, 17, resp.Pagination.TotalResults)
}

// TestGetNativeServiceInstances_OmitsPagingWhenAbsent verifies the
// V3-default behaviour: with no caller-supplied per_page/page, the
// upstream URL has neither.
func TestGetNativeServiceInstances_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_instances":
			_, sawPerPage = r.URL.Query()["per_page"]
			_, sawPage = r.URL.Query()["page"]
			_, _ = w.Write([]byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`))
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_instances/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeServiceInstances(c))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetNativeServiceInstances_CountsFastPath verifies ?return=counts:
// per_page=1 only on /v3/service_instances; the plan/offering joins
// don't run on the counts path.
func TestGetNativeServiceInstances_CountsFastPath(t *testing.T) {
	planHits, offHits := 0, 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/service_instances":
			perPage := r.URL.Query().Get("per_page")
			body := `{"pagination":{"total_results":18,"total_pages":1,"next":null},"resources":[],"_per_page_seen":"` + perPage + `"}`
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(body))
		case "/v3/service_plans":
			planHits++
			http.NotFound(w, r)
		case "/v3/service_offerings":
			offHits++
			http.NotFound(w, r)
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_instances/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_instances/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeServiceInstances(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, planHits, "counts path must skip the plan join")
	assert.Equal(t, 0, offHits, "counts path must skip the offering join")

	var resp StServiceInstancesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 18, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
