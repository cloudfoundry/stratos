package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseSummaryQueryParams_Defaults(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, 1, params.Page)
	assert.Equal(t, 50, params.PerPage)
	assert.Empty(t, params.OrderBy)
	assert.Empty(t, params.Filters)
}

func TestParseSummaryQueryParams_PageAndPerPage(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&page=3&per_page=25", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, 3, params.Page)
	assert.Equal(t, 25, params.PerPage)
}

func TestParseSummaryQueryParams_SortAscending(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&order_by=name", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, "name", params.OrderBy, "direction omitted should be asc (no minus prefix)")
}

func TestParseSummaryQueryParams_SortAscExplicit(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&order_by=name&direction=asc", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, "name", params.OrderBy)
}

func TestParseSummaryQueryParams_SortDescending(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&order_by=created_at&direction=desc", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, "-created_at", params.OrderBy, "direction=desc should prepend minus")
}

func TestParseSummaryQueryParams_FilterPassthrough(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&names=app-a,app-b&states=STARTED", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, []string{"app-a", "app-b"}, params.Filters["names"])
	assert.Equal(t, []string{"STARTED"}, params.Filters["states"])
}

func TestParseSummaryQueryParams_ReservedParamsExcludedFromFilters(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&page=2&per_page=10&order_by=name&direction=asc&names=foo", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	for _, reserved := range []string{"page", "per_page", "order_by", "direction", "return"} {
		_, ok := params.Filters[reserved]
		assert.False(t, ok, "%s should not leak into Filters", reserved)
	}
	assert.Equal(t, []string{"foo"}, params.Filters["names"])
}

func TestParseSummaryQueryParams_InvalidPageFallsBackToDefault(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&page=abc&per_page=-5", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	params := parseSummaryQueryParams(ctx)

	assert.Equal(t, 1, params.Page, "invalid page should fall back to default 1")
	assert.Equal(t, 50, params.PerPage, "non-positive per_page should fall back to default 50")
}

func TestGetNativeAppsSummary_ReturnsStratosPagedEnvelope(t *testing.T) {
	var capturedQuery url.Values
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			capturedQuery = r.URL.Query()
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 52, "total_pages": 6},
				"resources": []map[string]interface{}{
					{
						"guid": "app-1", "name": "App One", "state": "STARTED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/processes":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		case "/v3/spaces":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "space-1", "name": "Space One",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/routes":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&page=1&per_page=10&order_by=name&direction=asc&states=STARTED", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	// CAPI received the correctly-translated query params
	assert.Equal(t, "1", capturedQuery.Get("page"))
	assert.Equal(t, "10", capturedQuery.Get("per_page"))
	assert.Equal(t, "name", capturedQuery.Get("order_by"), "direction=asc: no minus prefix")
	assert.Equal(t, "STARTED", capturedQuery.Get("states"), "filter passed through to CAPI")

	// Response body is StratosPagedResponse shape, not legacy StAppsResponse
	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	assert.Equal(t, 52, resp.Pagination.TotalResults)
	assert.Equal(t, 6, resp.Pagination.TotalPages)
	require.NotNil(t, resp.Pagination.First)
	require.NotNil(t, resp.Pagination.Last)
	require.NotNil(t, resp.Pagination.Next)
	assert.Nil(t, resp.Pagination.Previous, "page 1 has no previous")
	assert.True(t, strings.Contains(resp.Pagination.Next.Href, "page=2"))
	assert.True(t, strings.Contains(resp.Pagination.Last.Href, "page=6"))
}

func TestGetNativeAppsSummary_DescendingSortTranslatesToMinusPrefix(t *testing.T) {
	var capturedQuery url.Values
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			capturedQuery = r.URL.Query()
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&order_by=created_at&direction=desc", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, "-created_at", capturedQuery.Get("order_by"))
}

func TestGetNativeAppsSummary_EmptyResultSet(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Empty(t, resp.Resources)
	assert.Equal(t, 0, resp.Pagination.TotalResults)
	assert.Equal(t, 0, resp.Pagination.TotalPages)
	assert.Nil(t, resp.Pagination.First)
	assert.Nil(t, resp.Pagination.Last)
	assert.Nil(t, resp.Pagination.Next)
	assert.Nil(t, resp.Pagination.Previous)
}

// --- WU 3b: /v3/processes composition ---

func TestGetNativeAppsSummary_PopulatesMemoryDiskInstancesFromProcesses(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "app-1", "name": "App One", "state": "STARTED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
					{
						"guid": "app-2", "name": "App Two", "state": "STOPPED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-2"}},
						},
						"created_at": "2024-01-03T00:00:00Z", "updated_at": "2024-01-04T00:00:00Z",
					},
				},
			})
		case "/v3/processes":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "proc-1", "type": "web",
						"instances": 3, "memory_in_mb": 512, "disk_in_mb": 1024,
						"relationships": map[string]interface{}{
							"app": map[string]interface{}{"data": map[string]interface{}{"guid": "app-1"}},
						},
					},
					{
						"guid": "proc-2", "type": "web",
						"instances": 1, "memory_in_mb": 256, "disk_in_mb": 512,
						"relationships": map[string]interface{}{
							"app": map[string]interface{}{"data": map[string]interface{}{"guid": "app-2"}},
						},
					},
				},
			})
		case "/v3/spaces":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "space-1", "name": "Space One",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
					{
						"guid": "space-2", "name": "Space Two",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-2"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/routes":
			// Two routes: route-1 mapped to app-1, route-2 mapped to app-2.
			// Verifies the destinations-walk bucketing.
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "route-1", "url": "app-one.example.com",
						"destinations": []map[string]interface{}{
							{"guid": "dest-1", "app": map[string]interface{}{"guid": "app-1"}},
						},
					},
					{
						"guid": "route-2", "url": "app-two.example.com",
						"destinations": []map[string]interface{}{
							{"guid": "dest-2", "app": map[string]interface{}{"guid": "app-2"}},
						},
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 2)

	// app-1: memory 512, disk 1024, instances 3, orgGuid from space-1 → org-1,
	// routes from /v3/routes (route-1 destination → app-1)
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	require.NotNil(t, resp.Resources[0].Memory, "Memory should be populated")
	assert.Equal(t, 512, *resp.Resources[0].Memory)
	require.NotNil(t, resp.Resources[0].DiskQuota)
	assert.Equal(t, 1024, *resp.Resources[0].DiskQuota)
	assert.Equal(t, 3, resp.Resources[0].Instances)
	require.NotNil(t, resp.Resources[0].OrgGUID, "OrgGUID should be populated via space→org")
	assert.Equal(t, "org-1", *resp.Resources[0].OrgGUID)
	require.Len(t, resp.Resources[0].Routes, 1, "route-1 mapped to app-1")
	assert.Equal(t, "route-1", resp.Resources[0].Routes[0].GUID)
	assert.Equal(t, "app-one.example.com", resp.Resources[0].Routes[0].URL)
	assert.Nil(t, resp.Resources[0].Meta, "no _meta on success")

	// app-2: memory 256, disk 512, instances 1, orgGuid from space-2 → org-2
	assert.Equal(t, "app-2", resp.Resources[1].GUID)
	require.NotNil(t, resp.Resources[1].Memory)
	assert.Equal(t, 256, *resp.Resources[1].Memory)
	assert.Equal(t, 1, resp.Resources[1].Instances)
	require.NotNil(t, resp.Resources[1].OrgGUID)
	assert.Equal(t, "org-2", *resp.Resources[1].OrgGUID)
	require.Len(t, resp.Resources[1].Routes, 1, "route-2 mapped to app-2")
	assert.Equal(t, "route-2", resp.Resources[1].Routes[0].GUID)

	// Envelope has no error meta when everything succeeds
	assert.Nil(t, resp.Meta)
}

// --- WU 3d: derived-field sort fallback ---

func TestIsDerivedSortField(t *testing.T) {
	cases := []struct {
		in      string
		derived bool
		field   string
		desc    bool
	}{
		{"", false, "", false},
		{"name", false, "name", false},
		{"-name", false, "name", true},
		{"memory", true, "memory", false},
		{"-memory", true, "memory", true},
		{"diskQuota", true, "diskQuota", false},
		{"-diskQuota", true, "diskQuota", true},
		{"instances", true, "instances", false},
		{"-instances", true, "instances", true},
		{"created_at", false, "created_at", false},
		{"-created_at", false, "created_at", true},
	}
	for _, c := range cases {
		d, f, desc := isDerivedSortField(c.in)
		assert.Equal(t, c.derived, d, "input=%q: derived", c.in)
		assert.Equal(t, c.field, f, "input=%q: field", c.in)
		assert.Equal(t, c.desc, desc, "input=%q: desc", c.in)
	}
}

func TestSortStAppsByDerivedField_MemoryAscending(t *testing.T) {
	mk := func(mem int) StApp { v := mem; return StApp{GUID: "app-" + strconv.Itoa(mem), Memory: &v} }
	apps := []StApp{mk(512), mk(128), mk(1024), mk(256)}
	sortStAppsByDerivedField(apps, "memory", false)
	var got []int
	for _, a := range apps {
		got = append(got, *a.Memory)
	}
	assert.Equal(t, []int{128, 256, 512, 1024}, got)
}

func TestSortStAppsByDerivedField_MemoryDescending(t *testing.T) {
	mk := func(mem int) StApp { v := mem; return StApp{GUID: "app-" + strconv.Itoa(mem), Memory: &v} }
	apps := []StApp{mk(512), mk(128), mk(1024), mk(256)}
	sortStAppsByDerivedField(apps, "memory", true)
	var got []int
	for _, a := range apps {
		got = append(got, *a.Memory)
	}
	assert.Equal(t, []int{1024, 512, 256, 128}, got)
}

func TestSortStAppsByDerivedField_NilsSortToEndRegardlessOfDirection(t *testing.T) {
	mk := func(mem *int, guid string) StApp { return StApp{GUID: guid, Memory: mem} }
	val := func(v int) *int { return &v }

	for _, desc := range []bool{false, true} {
		apps := []StApp{mk(val(512), "a"), mk(nil, "b"), mk(val(128), "c"), mk(nil, "d")}
		sortStAppsByDerivedField(apps, "memory", desc)
		// Last two should be the nil-valued rows (order of nils not asserted, but they're at the end)
		assert.Nil(t, apps[2].Memory, "nil-valued row at index 2 (desc=%v)", desc)
		assert.Nil(t, apps[3].Memory, "nil-valued row at index 3 (desc=%v)", desc)
		assert.NotNil(t, apps[0].Memory)
		assert.NotNil(t, apps[1].Memory)
	}
}

func TestSortStAppsByDerivedField_Instances(t *testing.T) {
	apps := []StApp{
		{GUID: "a", Instances: 3},
		{GUID: "b", Instances: 1},
		{GUID: "c", Instances: 5},
	}
	sortStAppsByDerivedField(apps, "instances", false)
	assert.Equal(t, []int{1, 3, 5}, []int{apps[0].Instances, apps[1].Instances, apps[2].Instances})
}

func TestGetNativeAppsSummary_DerivedSortFetchesAllAndPaginatesInMemory(t *testing.T) {
	// Serve 5 apps across 2 CAPI pages; /v3/processes supplies distinct memory
	// per app so memory sort produces a predictable global order.
	appsByPage := map[string][]map[string]interface{}{
		"1": {
			{
				"guid": "app-a", "name": "A", "state": "STARTED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			},
			{
				"guid": "app-b", "name": "B", "state": "STARTED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			},
			{
				"guid": "app-c", "name": "C", "state": "STARTED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			},
		},
		"2": {
			{
				"guid": "app-d", "name": "D", "state": "STARTED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			},
			{
				"guid": "app-e", "name": "E", "state": "STARTED",
				"relationships": map[string]interface{}{
					"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
				},
				"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
			},
		},
	}
	memByGuid := map[string]int{"app-a": 512, "app-b": 128, "app-c": 1024, "app-d": 256, "app-e": 768}

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			page := r.URL.Query().Get("page")
			if page == "" {
				page = "1"
			}
			apps, ok := appsByPage[page]
			if !ok {
				apps = []map[string]interface{}{}
			}
			nextLink := map[string]interface{}{"href": "next"}
			pagination := map[string]interface{}{"total_results": 5, "total_pages": 2}
			if page == "1" {
				pagination["next"] = nextLink
			}
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": pagination,
				"resources":  apps,
			})
		case "/v3/processes":
			procs := []map[string]interface{}{}
			for g, mem := range memByGuid {
				procs = append(procs, map[string]interface{}{
					"guid": "proc-" + g, "type": "web",
					"instances": 1, "memory_in_mb": mem, "disk_in_mb": 1024,
					"relationships": map[string]interface{}{
						"app": map[string]interface{}{"data": map[string]interface{}{"guid": g}},
					},
				})
			}
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": len(procs), "total_pages": 1},
				"resources":  procs,
			})
		case "/v3/spaces":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "space-1", "name": "Space One",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/routes":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	// Request page 1 with per_page=2, sorted by memory ascending
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary&order_by=memory&direction=asc&page=1&per_page=2", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 2)

	// Globally sorted ascending by memory: 128, 256, 512, 768, 1024
	// Page 1 of per_page=2 → 128 (app-b), 256 (app-d)
	assert.Equal(t, "app-b", resp.Resources[0].GUID, "page 1 item 0: memory 128")
	assert.Equal(t, 128, *resp.Resources[0].Memory)
	assert.Equal(t, "app-d", resp.Resources[1].GUID, "page 1 item 1: memory 256")
	assert.Equal(t, 256, *resp.Resources[1].Memory)
	assert.Equal(t, 5, resp.Pagination.TotalResults, "total count reflects full set, not page")
	assert.Equal(t, 3, resp.Pagination.TotalPages, "5 items at per_page=2 = 3 pages")
}

func TestGetNativeAppsSummary_SpacesFetchFailureSurfacesOrgGuidTristate(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "app-1", "name": "App One", "state": "STARTED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/processes":
			// Processes succeeds so the test isolates the spaces failure
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "proc-1", "type": "web",
						"instances": 2, "memory_in_mb": 256, "disk_in_mb": 512,
						"relationships": map[string]interface{}{
							"app": map[string]interface{}{"data": map[string]interface{}{"guid": "app-1"}},
						},
					},
				},
			})
		case "/v3/spaces":
			http.Error(w, `{"errors":[{"title":"Unavailable"}]}`, http.StatusServiceUnavailable)
		case "/v3/routes":
			// Routes succeeds so the test isolates the spaces failure
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)

	// Row still has app-level + process-derived fields
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	require.NotNil(t, resp.Resources[0].Memory, "Memory still set (processes succeeded)")
	assert.Equal(t, 256, *resp.Resources[0].Memory)
	// spaceName + orgGuid absent because spaces fetch failed
	assert.Empty(t, resp.Resources[0].SpaceName)
	assert.Nil(t, resp.Resources[0].OrgGUID)
	require.NotNil(t, resp.Resources[0].Meta)
	assert.ElementsMatch(t, []string{"spaceName", "orgGuid"}, resp.Resources[0].Meta.Unavailable)

	// Envelope has the SPACES_FETCH_FAILED error
	require.NotNil(t, resp.Meta)
	require.Len(t, resp.Meta.Errors, 1)
	assert.Equal(t, "SPACES_FETCH_FAILED", resp.Meta.Errors[0].Code)
	assert.Equal(t, "envelope", resp.Meta.Errors[0].Scope)
	assert.ElementsMatch(t, []string{"spaceName", "orgGuid"}, resp.Meta.Errors[0].Affected)
}

func TestGetNativeAppsSummary_BothCompositionFetchesFailMultiError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "app-1", "name": "App One", "state": "STARTED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/processes":
			http.Error(w, `{"errors":[{"title":"Unavailable"}]}`, http.StatusServiceUnavailable)
		case "/v3/spaces":
			http.Error(w, `{"errors":[{"title":"Unavailable"}]}`, http.StatusServiceUnavailable)
		case "/v3/routes":
			http.Error(w, `{"errors":[{"title":"Unavailable"}]}`, http.StatusServiceUnavailable)
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)

	// Row has none of the composition-derived fields; app-level survives
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	assert.Nil(t, resp.Resources[0].Memory)
	assert.Nil(t, resp.Resources[0].OrgGUID)
	require.NotNil(t, resp.Resources[0].Meta)
	assert.ElementsMatch(t, []string{"memory", "diskQuota", "instances", "spaceName", "orgGuid", "routes"}, resp.Resources[0].Meta.Unavailable)

	// Envelope has three distinct errors — multi-error by design
	require.NotNil(t, resp.Meta)
	require.Len(t, resp.Meta.Errors, 3)
	codes := []string{resp.Meta.Errors[0].Code, resp.Meta.Errors[1].Code, resp.Meta.Errors[2].Code}
	assert.ElementsMatch(t, []string{"PROCESSES_FETCH_FAILED", "SPACES_FETCH_FAILED", "ROUTES_FETCH_FAILED"}, codes)
}

func TestGetNativeAppsSummary_ProcessesFetchFailureSurfacesTristate(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "app-1", "name": "App One", "state": "STARTED",
						"relationships": map[string]interface{}{
							"space": map[string]interface{}{"data": map[string]interface{}{"guid": "space-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/processes":
			// Simulate CAPI failure on processes fetch
			http.Error(w, `{"errors":[{"title":"Unavailable"}]}`, http.StatusServiceUnavailable)
		case "/v3/spaces":
			// Spaces succeeds so the test isolates the processes failure
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "space-1", "name": "Space One",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
					},
				},
			})
		case "/v3/routes":
			// Routes succeeds so the test isolates the processes failure
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	// HTTP 200 — the payload is valid, it describes partial failure
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)

	// Row still present with app-level fields; process-derived absent
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	assert.Equal(t, "STARTED", resp.Resources[0].State)
	assert.Nil(t, resp.Resources[0].Memory, "Memory absent when processes fetch fails")
	assert.Nil(t, resp.Resources[0].DiskQuota, "DiskQuota absent when processes fetch fails")
	require.NotNil(t, resp.Resources[0].Meta, "row should carry _meta.unavailable")
	assert.ElementsMatch(t, []string{"memory", "diskQuota", "instances"}, resp.Resources[0].Meta.Unavailable)

	// Envelope has the envelope-level error
	require.NotNil(t, resp.Meta)
	require.Len(t, resp.Meta.Errors, 1)
	err := resp.Meta.Errors[0]
	assert.Equal(t, "envelope", err.Scope)
	assert.Equal(t, "PROCESSES_FETCH_FAILED", err.Code)
	assert.ElementsMatch(t, []string{"memory", "diskQuota", "instances"}, err.Affected)
	assert.ElementsMatch(t, []string{"app-1"}, err.AffectedGuids)
}

func TestGetNativeAppsSummary_EmptyAppListSkipsProcessesCall(t *testing.T) {
	processesCalled := false
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		case "/v3/processes":
			processesCalled = true
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 0, "total_pages": 0},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.False(t, processesCalled, "empty app list should skip processes call")

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Empty(t, resp.Resources)
	assert.Nil(t, resp.Meta, "no error meta when everything succeeded trivially")
}

func TestGetNativeApps_LegacyReturnCountsUnchanged(t *testing.T) {
	// Backwards-compat guard: counts tier response shape must stay
	// StAppsResponse (not StratosPagedResponse) for FWT-934 home-page card.
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 52, "total_pages": 52},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=counts", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StAppsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 52, resp.TotalResults)
}

// A.#1: per-org and per-space scoping on the counts tier. Used by
// CloudFoundryEndpointService.fetchAppCount(orgGuid?, spaceGuid?) to
// replace the V2 ngrx-pagination count helper without paying for a
// full apps drain.
func TestGetNativeApps_ReturnCountsHonorsOrgGuidsFilter(t *testing.T) {
	var capturedQuery string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			capturedQuery = r.URL.RawQuery
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 7, "total_pages": 7},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=counts&organization_guids=org-A", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StAppsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 7, resp.TotalResults)
	assert.Contains(t, capturedQuery, "organization_guids=org-A")
}

func TestGetNativeApps_ReturnCountsHonorsSpaceGuidsFilter(t *testing.T) {
	var capturedQuery string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			capturedQuery = r.URL.RawQuery
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 3, "total_pages": 3},
				"resources":  []map[string]interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?return=counts&space_guids=space-X", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "test-cnsi", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))

	var resp StAppsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 3, resp.TotalResults)
	assert.Contains(t, capturedQuery, "space_guids=space-X")
}
