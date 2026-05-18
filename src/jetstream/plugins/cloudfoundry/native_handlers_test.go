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
	tokenInfo    *api.JWTUserTokenInfo
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

func (m *mockNativeCFProxy) GetUserTokenInfo(_ string) (*api.JWTUserTokenInfo, error) {
	if m.tokenInfo != nil {
		return m.tokenInfo, nil
	}
	return &api.JWTUserTokenInfo{UserGUID: "cf-user-default"}, nil
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

	var resp StratosPagedResponse[StOrg]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 1, resp.Pagination.TotalResults)
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

	var resp StratosPagedResponse[StApp]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 2, resp.Pagination.TotalResults)
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

// Slice 3.5 #4.5 — getNativeRouteCount must forward ?space_guids= to CF v3
// via the space_guids filter on the full-list branch. CF v3 docs (3.180.0):
// /v3/routes accepts space_guids as a comma-delimited filter. Without this
// the map-routes picker drains every route on the cnsi instead of just the
// app's space. The ?return=counts branch is intentionally cnsi-wide and
// does NOT honor space_guids — its consumers (home-page card, endpoint-data
// totals) never need a space-scoped count today, and adding the filter
// there would be dead code.
func TestGetNativeRouteCount_SpaceGuidsFilter(t *testing.T) {
	t.Run("counts branch ignores space_guids (cnsi-wide by design)", func(t *testing.T) {
		var seenQuery string
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			switch r.URL.Path {
			case "/v3":
				w.Write([]byte(`{"links":{}}`))
			case "/v3/routes":
				seenQuery = r.URL.RawQuery
				json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
					"resources":  []interface{}{},
				})
			default:
				http.NotFound(w, r)
			}
		}))
		defer ts.Close()

		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/routes/test-cnsi?return=counts&space_guids=space-1", nil)
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
		assert.NotContains(t, seenQuery, "space_guids", "counts branch is cnsi-wide; must NOT forward space_guids")
		assert.Contains(t, seenQuery, "per_page=1", "counts branch must request per_page=1")
	})

	t.Run("full-list branch forwards space_guids", func(t *testing.T) {
		var seenQuery string
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			switch r.URL.Path {
			case "/v3":
				w.Write([]byte(`{"links":{}}`))
			case "/v3/routes":
				seenQuery = r.URL.RawQuery
				json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 0, "total_pages": 1},
					"resources":  []interface{}{},
				})
			default:
				http.NotFound(w, r)
			}
		}))
		defer ts.Close()

		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/routes/test-cnsi?space_guids=space-1,space-2", nil)
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
		assert.Contains(t, seenQuery, "space_guids=space-1%2Cspace-2", "comma-delimited space_guids must be forwarded URL-encoded")
	})

	t.Run("no space_guids = unfiltered drain (legacy)", func(t *testing.T) {
		var seenQuery string
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			switch r.URL.Path {
			case "/v3":
				w.Write([]byte(`{"links":{}}`))
			case "/v3/routes":
				seenQuery = r.URL.RawQuery
				json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 0, "total_pages": 1},
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
		assert.NotContains(t, seenQuery, "space_guids", "absent space_guids must produce unfiltered drain")
	})
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

func TestGetNativeSpaceDetail(t *testing.T) {
	t.Run("populates allowSsh from features endpoint", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			switch r.URL.Path {
			case "/v3":
				w.Write([]byte(`{"links":{}}`))
			case "/v3/spaces/sp-1":
				json.NewEncoder(w).Encode(map[string]interface{}{
					"guid":       "sp-1",
					"name":       "dev",
					"created_at": "2024-01-01T00:00:00Z",
					"updated_at": "2024-01-02T00:00:00Z",
					"relationships": map[string]interface{}{
						"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
					},
				})
			case "/v3/spaces/sp-1/features/ssh":
				json.NewEncoder(w).Encode(map[string]interface{}{
					"name": "ssh", "enabled": true,
				})
			default:
				http.NotFound(w, r)
			}
		}))
		defer ts.Close()

		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/sp-1", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.SetParamNames("cnsiGuid", "spaceGuid")
		ctx.SetParamValues("cnsi-1", "sp-1")

		plugin := &CloudFoundrySpecification{
			testProxy: &mockNativeCFProxy{
				userID:      "user-1",
				cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
				tokenRecord: api.TokenRecord{AuthToken: "test-token"},
			},
		}

		require.NoError(t, plugin.getNativeSpaceDetail(ctx))
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp StSpaceDetail
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
		assert.Equal(t, "sp-1", resp.GUID)
		assert.Equal(t, "dev", resp.Name)
		assert.Equal(t, "org-1", resp.OrgGUID)
		assert.True(t, resp.AllowSSH)
	})

	t.Run("ssh feature failure leaves allowSsh false but succeeds", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			switch r.URL.Path {
			case "/v3":
				w.Write([]byte(`{"links":{}}`))
			case "/v3/spaces/sp-2":
				json.NewEncoder(w).Encode(map[string]interface{}{
					"guid":       "sp-2",
					"name":       "prod",
					"created_at": "2024-01-01T00:00:00Z",
					"updated_at": "2024-01-02T00:00:00Z",
					"relationships": map[string]interface{}{
						"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
					},
				})
			case "/v3/spaces/sp-2/features/ssh":
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"errors":[{"detail":"boom"}]}`))
			default:
				http.NotFound(w, r)
			}
		}))
		defer ts.Close()

		e := echo.New()
		req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/sp-2", nil)
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.SetParamNames("cnsiGuid", "spaceGuid")
		ctx.SetParamValues("cnsi-1", "sp-2")

		plugin := &CloudFoundrySpecification{
			testProxy: &mockNativeCFProxy{
				userID:      "user-1",
				cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(ts.URL)},
				tokenRecord: api.TokenRecord{AuthToken: "test-token"},
			},
		}

		require.NoError(t, plugin.getNativeSpaceDetail(ctx))
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp StSpaceDetail
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
		assert.Equal(t, "sp-2", resp.GUID)
		assert.False(t, resp.AllowSSH)
	})
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

	var resp StratosPagedResponse[StSpace]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 2, resp.Pagination.TotalResults)
	assert.Equal(t, "sp-1", resp.Resources[0].GUID)
	assert.Equal(t, "dev", resp.Resources[0].Name)
	assert.Equal(t, "org-1", resp.Resources[0].OrgGUID)
}

// TestGetNativeOrgs_OmitsPagingWhenAbsent verifies the V3-default
// passthrough: with no caller-supplied per_page/page, the upstream URL
// has neither key.
func TestGetNativeOrgs_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/organizations":
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/orgs/cnsi-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeOrgs(ctx))
	assert.False(t, sawPerPage, "per_page must be absent on upstream when caller omits it")
	assert.False(t, sawPage, "page must be absent on upstream when caller omits it")
}

// TestGetNativeApps_OmitsPagingWhenAbsent verifies the apps handler is a
// V3-default passthrough when the caller omits per_page/page.
func TestGetNativeApps_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetNativeSpaces_OmitsPagingWhenAbsent verifies the spaces handler
// is a V3-default passthrough when the caller omits per_page/page.
func TestGetNativeSpaces_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/spaces":
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSpaces(ctx))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetNativeOrgSpaces_OmitsPagingWhenAbsent — same contract for the
// per-org spaces endpoint.
func TestGetNativeOrgSpaces_OmitsPagingWhenAbsent(t *testing.T) {
	var sawPerPage, sawPage bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/spaces":
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1/spaces", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, plugin.getNativeOrgSpaces(ctx))
	assert.False(t, sawPerPage)
	assert.False(t, sawPage)
}

// TestGetNativeOrgSpaces_CountsFastPath verifies ?return=counts forwards
// per_page=1 plus the organization_guids filter and returns the flat
// count-shape envelope.
func TestGetNativeOrgSpaces_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/spaces", 23, "organization_guids")
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/org/cnsi-1/org-1/spaces?return=counts", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "orgGuid")
	ctx.SetParamValues("cnsi-1", "org-1")

	require.NoError(t, plugin.getNativeOrgSpaces(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)
	assert.Equal(t, "org-1", q.Filters["organization_guids"])

	var resp StSpacesResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 23, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeSpaces_OrganizationGuidsFilter verifies the spaces handler
// forwards ?organization_guids=g1,g2 verbatim as the V3 filter — the
// transport piece of the App Wall org-batched name resolver. Skipping
// per-space app/route enrichment is implicit (the resolver only needs
// names) so the test asserts no /v3/apps or /v3/routes traffic happened.
func TestGetNativeSpaces_OrganizationGuidsFilter(t *testing.T) {
	var spacesQuery url.Values
	var sawApps, sawRoutes bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/spaces":
			spacesQuery = r.URL.Query()
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "sp-a", "name": "alpha",
						"created_at": "2024-01-01T00:00:00Z", "updated_at": "2024-01-02T00:00:00Z",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
						},
					},
					{
						"guid": "sp-b", "name": "beta",
						"created_at": "2024-01-03T00:00:00Z", "updated_at": "2024-01-04T00:00:00Z",
						"relationships": map[string]interface{}{
							"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-2"}},
						},
					},
				},
			})
		case "/v3/apps":
			sawApps = true
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`))
		case "/v3/routes":
			sawRoutes = true
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1?organization_guids=org-1,org-2&per_page=500&page=1", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeSpaces(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "org-1,org-2", spacesQuery.Get("organization_guids"))
	assert.False(t, sawApps, "name-resolution path must skip app-count enrichment")
	assert.False(t, sawRoutes, "name-resolution path must skip route-count enrichment")

	var resp StratosPagedResponse[StSpace]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Len(t, resp.Resources, 2)
	assert.Equal(t, "sp-a", resp.Resources[0].GUID)
	assert.Equal(t, "sp-b", resp.Resources[1].GUID)
}

// TestGetNativeApps_GuidsFilter verifies the apps handler forwards
// ?guids=g1,g2 verbatim as the V3 filter — the transport piece of the
// slice-3 Routes-tab Apps-Attached column resolver. Skipping per-app
// process / space / route enrichment is implicit (the resolver only
// needs names) so the test asserts no /v3/processes, /v3/spaces, or
// /v3/routes traffic happened, and that the response is the flat
// StAppsResponse envelope.
func TestGetNativeApps_GuidsFilter(t *testing.T) {
	var appsQuery url.Values
	var sawProcesses, sawSpaces, sawRoutes bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/apps":
			appsQuery = r.URL.Query()
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
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
			sawProcesses = true
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`))
		case "/v3/spaces":
			sawSpaces = true
			_, _ = w.Write([]byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`))
		case "/v3/routes":
			sawRoutes = true
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
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/apps/cnsi-1?guids=app-1,app-2", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeApps(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "app-1,app-2", appsQuery.Get("guids"))
	assert.False(t, sawProcesses, "name-resolution path must skip process enrichment")
	assert.False(t, sawSpaces, "name-resolution path must skip space enrichment")
	assert.False(t, sawRoutes, "name-resolution path must skip route enrichment")

	var resp StAppsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 2, resp.TotalResults)
	assert.Len(t, resp.Resources, 2)
	assert.Equal(t, "app-1", resp.Resources[0].GUID)
	assert.Equal(t, "App One", resp.Resources[0].Name)
	assert.Equal(t, "app-2", resp.Resources[1].GUID)
	assert.Equal(t, "App Two", resp.Resources[1].Name)
}
