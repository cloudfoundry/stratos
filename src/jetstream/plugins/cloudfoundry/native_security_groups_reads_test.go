// src/jetstream/plugins/cloudfoundry/native_security_groups_reads_test.go
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

// TestGetNativeSecurityGroups_ReturnsMappedGroups verifies the handler
// drives a CAPI SecurityGroups().List call and maps capi.SecurityGroup
// resources onto flat StSecurityGroup DTOs. Security groups are
// foundation-level: they govern egress traffic from app containers and
// can be flagged globally enabled for running and/or staging. Read-only
// at this tier — create/update/delete and space bindings stay legacy
// until a use case warrants them.
func TestGetNativeSecurityGroups_ReturnsMappedGroups(t *testing.T) {
	hits := 0
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/security_groups" && r.Method == http.MethodGet:
			hits++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"pagination": {"total_results": 2, "total_pages": 1, "next": null},
				"resources": [
					{
						"guid":"sg-1",
						"created_at":"2026-04-22T12:00:00Z",
						"updated_at":"2026-04-22T12:00:00Z",
						"name":"public_networks",
						"globally_enabled":{"running":true,"staging":false},
						"rules":[
							{"protocol":"tcp","destination":"0.0.0.0/0","ports":"443"},
							{"protocol":"udp","destination":"0.0.0.0/0","ports":"53"}
						],
						"relationships":{
							"running_spaces":{"data":[{"guid":"space-r-1"}]},
							"staging_spaces":{"data":[]}
						}
					},
					{
						"guid":"sg-2",
						"created_at":"2026-04-22T12:05:00Z",
						"updated_at":"2026-04-22T12:05:00Z",
						"name":"dns",
						"globally_enabled":{"running":true,"staging":true},
						"rules":[],
						"relationships":{
							"running_spaces":{"data":[]},
							"staging_spaces":{"data":[]}
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/security_groups/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/security_groups/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSecurityGroups(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, hits, "should make exactly one list call when single page")

	var resp StratosPagedResponse[StSecurityGroup]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 2, resp.Pagination.TotalResults)

	g0 := resp.Resources[0]
	assert.Equal(t, "sg-1", g0.GUID)
	assert.Equal(t, "public_networks", g0.Name)
	assert.True(t, g0.GloballyEnabledRunning)
	assert.False(t, g0.GloballyEnabledStaging)
	assert.Equal(t, 2, g0.RuleCount, "rule_count surfaces aggregate rule count for list-row rendering")
	assert.Equal(t, 1, g0.RunningSpaceCount, "running_space_count surfaces bound running spaces")
	assert.Equal(t, 0, g0.StagingSpaceCount)
	assert.Equal(t, "cnsi-1", g0.CnsiGUID)
	assert.Equal(t, "2026-04-22T12:00:00Z", g0.CreatedAt)

	g1 := resp.Resources[1]
	assert.Equal(t, "sg-2", g1.GUID)
	assert.True(t, g1.GloballyEnabledRunning)
	assert.True(t, g1.GloballyEnabledStaging)
	assert.Equal(t, 0, g1.RuleCount, "empty rules array maps to 0 rule count")
}

// TestGetNativeSecurityGroups_EmptyResult ensures the resources slice
// marshals as `[]` (not null) when CF returns no security groups.
func TestGetNativeSecurityGroups_EmptyResult(t *testing.T) {
	capiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/v3":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/security_groups" && r.Method == http.MethodGet:
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/security_groups/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/security_groups/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSecurityGroups(c))
	assert.Equal(t, http.StatusOK, rec.Code)

	body := rec.Body.String()
	assert.Contains(t, body, `"resources":[]`, "empty resources must marshal as [] not null")
}

// TestGetNativeSecurityGroups_PerPagePassthrough verifies single-page passthrough:
// caller's per_page+page forward verbatim to /v3/security_groups and the
// response carries a V3-shape pagination envelope.
func TestGetNativeSecurityGroups_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60,
			"total_pages": 3,
			"first": {"href":"/v3/security_groups?page=1&per_page=25"},
			"last":  {"href":"/v3/security_groups?page=3&per_page=25"},
			"next":  {"href":"/v3/security_groups?page=3&per_page=25"},
			"previous": {"href":"/v3/security_groups?page=1&per_page=25"}
		},
		"resources": [{"guid":"sg-1","name":"first","globally_enabled":{"running":false,"staging":false},"rules":[],"relationships":{"running_spaces":{"data":[]},"staging_spaces":{"data":[]}}}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/security_groups", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/security_groups/cnsi-1?per_page=25&page=2", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/security_groups/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSecurityGroups(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits, "single-page passthrough must issue exactly one CAPI call")
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StSecurityGroup]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
	assert.Equal(t, 3, resp.Pagination.TotalPages)
	assert.NotNil(t, resp.Pagination.First)
	assert.NotNil(t, resp.Pagination.Last)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeSecurityGroups_OmitsPagingWhenAbsent asserts that with no caller-supplied
// per_page/page, the upstream URL carries neither key.
func TestGetNativeSecurityGroups_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination": {"total_results": 0, "total_pages": 0, "next": null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/security_groups", body)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/security_groups/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/security_groups/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSecurityGroups(c))
	assert.False(t, q.PerPagePresent, "per_page must be absent when caller omits it")
	assert.False(t, q.PagePresent, "page must be absent when caller omits it")
}

// TestGetNativeSecurityGroups_CountsFastPath verifies ?return=counts.
func TestGetNativeSecurityGroups_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/security_groups", 9)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/security_groups/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/security_groups/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSecurityGroups(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)

	var resp StSecurityGroupsResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 9, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}
