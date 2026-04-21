package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
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
