// src/jetstream/plugins/cloudfoundry/native_handlers_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockNativeCFProxy implements nativeCFProxy for handler unit tests.
// Tests spin up an httptest.Server and put its URL into cnsiRecord.APIEndpoint
// so the capi client calls the test server instead of a real CF instance.
//
// proxyRequest, if set, is invoked for DoProxySingleRequestWithToken so
// restageApp's v2 passthrough can be unit-tested without a real CF. If
// nil, DoProxySingleRequestWithToken returns a zero CNSIRequest so the
// tests that don't exercise the v2 path don't need to stub it.
type mockNativeCFProxy struct {
	userID       string
	cnsiRecord   api.CNSIRecord
	tokenRecord  api.TokenRecord
	proxyRequest func(cnsiGUID string, token *api.TokenRecord, method, requestURL string, headers http.Header, body []byte) (*api.CNSIRequest, error)
}

func (m *mockNativeCFProxy) GetCNSIRecord(_ string) (api.CNSIRecord, error) {
	return m.cnsiRecord, nil
}

func (m *mockNativeCFProxy) GetCNSITokenRecord(_, _ string) (api.TokenRecord, bool) {
	return m.tokenRecord, true
}

func (m *mockNativeCFProxy) GetSessionStringValue(_ echo.Context, key string) (string, error) {
	if key == "user_id" {
		return m.userID, nil
	}
	return "", nil
}

func (m *mockNativeCFProxy) RefreshOAuthToken(_ bool, _, _, _, _, _ string) (api.TokenRecord, error) {
	return m.tokenRecord, nil
}

func (m *mockNativeCFProxy) DoProxySingleRequestWithToken(cnsiGUID string, token *api.TokenRecord, method, requestURL string, headers http.Header, body []byte) (*api.CNSIRequest, error) {
	if m.proxyRequest != nil {
		return m.proxyRequest(cnsiGUID, token, method, requestURL, headers, body)
	}
	return &api.CNSIRequest{}, nil
}

// mustParseURL parses a URL and panics on error — for test setup only.
func mustParseURL(raw string) *url.URL {
	u, err := url.Parse(raw)
	if err != nil {
		panic(err)
	}
	return u
}

func TestGetNativeOrgs(t *testing.T) {
	// Serve CF v3 JSON from a local test server.
	// GET /v3 is required because cfclient.New sets FetchAPILinksOnInit=true.
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/organizations":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{{
					"guid":       "org-guid-1",
					"name":       "My Org",
					"created_at": "2024-01-01T00:00:00Z",
					"updated_at": "2024-01-02T00:00:00Z",
					"metadata":   map[string]interface{}{"labels": map[string]interface{}{"env": "prod"}, "annotations": map[string]interface{}{}},
				}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/orgs/test-cnsi", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(ts.URL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeOrgs(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", rec.Header().Get("X-Stratos-Schema-Version"))

	var resp StOrgsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 1, resp.TotalResults)
	assert.Len(t, resp.Resources, 1)
	assert.Equal(t, "org-guid-1", resp.Resources[0].GUID)
	assert.Equal(t, "My Org", resp.Resources[0].Name)
	assert.Equal(t, "active", resp.Resources[0].Status)
	assert.Equal(t, "prod", resp.Resources[0].Labels["env"])
}

func TestGetNativeOrgs_PerPagePassthrough(t *testing.T) {
	// ?per_page=N&page=M should issue a SINGLE bounded /v3/organizations
	// call (no internal multi-page drain) and return a Stratos-shape paged
	// response so the frontend's loadNames doesn't hit the gorouter ceiling
	// on slow CFs with many orgs.
	var orgsListCalls int
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/organizations":
			orgsListCalls++
			perPage := r.URL.Query().Get("per_page")
			require.Equal(t, "2", perPage, "handler must pass through per_page to CAPI")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 5,
					"total_pages":   3,
					"first":         map[string]interface{}{"href": "https://api.test/v3/organizations?page=1&per_page=2"},
					"next":          map[string]interface{}{"href": "https://api.test/v3/organizations?page=2&per_page=2"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/organizations?page=3&per_page=2"},
				},
				"resources": []map[string]interface{}{
					{"guid": "org-1", "name": "First", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z"},
					{"guid": "org-2", "name": "Second", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/orgs/test-cnsi?per_page=2&page=1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(ts.URL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeOrgs(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, orgsListCalls, "per_page path must issue a single CAPI call")

	var resp StratosPagedResponse[StOrg]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Len(t, resp.Resources, 2)
	assert.Equal(t, 5, resp.Pagination.TotalResults)
	assert.Equal(t, "org-1", resp.Resources[0].GUID)
}

func TestGetNativeApps(t *testing.T) {
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
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi", nil)
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

	var resp StAppsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 2, resp.TotalResults)
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	assert.Equal(t, "STARTED", resp.Resources[0].State)
	assert.Equal(t, "space-1", resp.Resources[0].SpaceGUID)
}

func TestGetNativeApps_PerPagePassthrough(t *testing.T) {
	// ?per_page=N&page=M without ?return= should issue a SINGLE bounded
	// /v3/apps call (no internal multi-page drain) and return a
	// Stratos-shape paged response — used by EndpointDataService.loadDetails
	// for the home card on slow CFs.
	var appsListCalls int
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			appsListCalls++
			perPage := r.URL.Query().Get("per_page")
			require.Equal(t, "3", perPage, "handler must pass through per_page to CAPI")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 9,
					"total_pages":   3,
					"first":         map[string]interface{}{"href": "https://api.test/v3/apps?page=1&per_page=3"},
					"next":          map[string]interface{}{"href": "https://api.test/v3/apps?page=2&per_page=3"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/apps?page=3&per_page=3"},
				},
				"resources": []map[string]interface{}{
					{"guid": "app-1", "name": "First", "state": "STARTED", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z"},
					{"guid": "app-2", "name": "Second", "state": "STOPPED", "created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/test-cnsi?per_page=3&page=1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(ts.URL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, appsListCalls, "per_page path must issue a single CAPI call")

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Len(t, resp.Resources, 2)
	assert.Equal(t, 9, resp.Pagination.TotalResults)
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
}

func TestGetNativeRouteCount(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/routes":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 42, "total_pages": 1},
				"resources":  []interface{}{},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/routes/test-cnsi", nil)
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

	require.NoError(t, plugin.getNativeRouteCount(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StRoutesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 42, resp.TotalResults)
}

func TestGetNativeOrgDetail(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/organizations/org-1":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":       "org-1",
				"name":       "My Org",
				"created_at": "2024-01-01T00:00:00Z",
				"updated_at": "2024-01-02T00:00:00Z",
				"metadata":   map[string]interface{}{"labels": map[string]interface{}{"env": "prod"}, "annotations": map[string]interface{}{}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeOrgDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StOrgDetail
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "org-1", resp.GUID)
	assert.Equal(t, "My Org", resp.Name)
	assert.Equal(t, "prod", resp.Labels["env"])
	assert.Equal(t, []StSpace{}, resp.Spaces)
}

func TestGetNativeOrgSpaces(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			w.Write([]byte(`{"links":{}}`))
		case "/v3/spaces":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "sp-1", "name": "dev",
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
					},
					{
						"guid": "sp-2", "name": "prod",
						"created_at": "2024-01-03T00:00:00Z", "updated_at": "2024-01-04T00:00:00Z",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1/spaces", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	require.NoError(t, plugin.getNativeOrgSpaces(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StSpacesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 2, resp.TotalResults)
	assert.Equal(t, "sp-1", resp.Resources[0].GUID)
	assert.Equal(t, "dev", resp.Resources[0].Name)
	assert.Equal(t, "org-1", resp.Resources[0].OrgGUID)
}
