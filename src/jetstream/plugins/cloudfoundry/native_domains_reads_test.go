// src/jetstream/plugins/cloudfoundry/native_domains_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func domainsTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/domains":
			perPage := r.URL.Query().Get("per_page")
			guids := r.URL.Query().Get("guids")

			if perPage == "1" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 5, "total_pages": 5},
					"resources":  []interface{}{},
				})
				return
			}

			if guids != "" {
				wanted := strings.Split(guids, ",")
				resources := []map[string]interface{}{}
				for _, g := range wanted {
					resources = append(resources, domainResource(g, "d-"+g+".example.com", false, "", nil))
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": len(wanted), "total_pages": 1},
					"resources":  resources,
				})
				return
			}

			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 5,
					"total_pages":   2,
					"first":         map[string]interface{}{"href": "https://api.test/v3/domains?page=1&per_page=3"},
					"next":          map[string]interface{}{"href": "https://api.test/v3/domains?page=2&per_page=3"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/domains?page=2&per_page=3"},
				},
				"resources": []map[string]interface{}{
					domainResource("dom-1", "shared.example.com", false, "", []string{"org-shared-1"}),
					domainResource("dom-2", "private.example.com", false, "org-owner", nil),
					domainResource("dom-3", "internal.local", true, "", nil),
				},
			})
		case "/v3/domains/dom-99":
			_ = json.NewEncoder(w).Encode(domainResource("dom-99", "single.example.com", false, "", nil))
		default:
			http.NotFound(w, r)
		}
	}))
}

func domainResource(guid, name string, internal bool, owningOrgGUID string, sharedOrgGUIDs []string) map[string]interface{} {
	rel := map[string]interface{}{}
	if owningOrgGUID != "" {
		rel["organization"] = map[string]interface{}{
			"data": map[string]interface{}{"guid": owningOrgGUID},
		}
	} else {
		rel["organization"] = map[string]interface{}{"data": nil}
	}
	if len(sharedOrgGUIDs) > 0 {
		shared := []map[string]interface{}{}
		for _, s := range sharedOrgGUIDs {
			shared = append(shared, map[string]interface{}{"guid": s})
		}
		rel["shared_organizations"] = map[string]interface{}{"data": shared}
	}
	return map[string]interface{}{
		"guid":                guid,
		"name":                name,
		"internal":            internal,
		"supported_protocols": []string{"http"},
		"created_at":          "2024-01-01T00:00:00Z",
		"updated_at":          "2024-01-02T00:00:00Z",
		"relationships":       rel,
	}
}

func newDomainsContext(e *echo.Echo, target string) (*echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "test-cnsi"}})
	return ctx, rec
}

func newOrgDomainsContext(e *echo.Echo, target, orgGUID string) (*echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "test-cnsi"}, {Name: "orgGuid", Value: orgGUID}})
	return ctx, rec
}

// orgDomainsTestServer mimics what CF v3 actually returns for
// `/v3/organizations/:guid/domains` — every domain available to the
// org: its own private domain, a domain explicitly shared with the org
// (owned by a different org), and a global shared domain (no owning
// org at all). It also includes a domain privately owned by a
// different org, which CF would not normally return here, to prove
// the handler still excludes it defensively.
//
// It deliberately does NOT serve `/v3/domains`: querying that with an
// `organization_guids` filter was the original #5523 mistake — the
// filter matches *owning* org only, so on a real CF it silently
// returns zero rows for orgs that rely on shared/global domains.
func orgDomainsTestServer(t *testing.T, orgGUID string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/organizations/" + orgGUID + "/domains":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 4, "total_pages": 1},
				"resources": []map[string]interface{}{
					domainResource("dom-global-shared", "apps.example.com", false, "", nil),
					domainResource("dom-owned", "owned.example.com", false, orgGUID, nil),
					domainResource("dom-shared-with-org", "shared-in.example.com", false, "org-other", []string{orgGUID}),
					domainResource("dom-owned-other", "other-owner.example.com", false, "org-other", nil),
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
}

func newDomainsPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "test-cnsi",
				APIEndpoint: mustParseURL(serverURL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func TestGetNativeDomains_DefaultPaginatedPage(t *testing.T) {
	ts := domainsTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newDomainsContext(e, "/pp/v1/cf/domains/test-cnsi")
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StDomain]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 3)
	assert.Equal(t, 5, resp.Pagination.TotalResults)

	// Shared (non-internal, no owning org, has shared list)
	assert.Equal(t, "dom-1", resp.Resources[0].GUID)
	assert.Equal(t, "shared.example.com", resp.Resources[0].Name)
	assert.False(t, resp.Resources[0].Internal)
	assert.Equal(t, "", resp.Resources[0].OwningOrgGUID, "shared domains have no owning org")
	assert.ElementsMatch(t, []string{"org-shared-1"}, resp.Resources[0].SharedOrgGUIDs)

	// Private (org-owned)
	assert.Equal(t, "org-owner", resp.Resources[1].OwningOrgGUID)
	assert.Empty(t, resp.Resources[1].SharedOrgGUIDs)

	// Internal
	assert.True(t, resp.Resources[2].Internal)
	assert.Equal(t, "test-cnsi", resp.Resources[2].CnsiGUID)
}

func TestGetNativeDomains_GuidsFilter(t *testing.T) {
	ts := domainsTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newDomainsContext(e, "/pp/v1/cf/domains/test-cnsi?guids=x,y")
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StDomain]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Len(t, resp.Resources, 2)
	guids := []string{resp.Resources[0].GUID, resp.Resources[1].GUID}
	assert.ElementsMatch(t, []string{"x", "y"}, guids)
}

func TestGetNativeDomains_CountsFastPath(t *testing.T) {
	ts := domainsTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newDomainsContext(e, "/pp/v1/cf/domains/test-cnsi?return=counts")
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StDomainsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, 5, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeDomainDetail(t *testing.T) {
	ts := domainsTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/domains/test-cnsi/dom-99", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetPathValues(echo.PathValues{{Name: "cnsiGuid", Value: "test-cnsi"}, {Name: "domainGuid", Value: "dom-99"}})
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeDomainDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StDomain
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "dom-99", resp.GUID)
	assert.Equal(t, "single.example.com", resp.Name)
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
}

// TestGetNativeDomains_PerPagePassthrough verifies single-page passthrough.
func TestGetNativeDomains_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60, "total_pages": 3,
			"first":{"href":"/v3/domains?page=1"},
			"last":{"href":"/v3/domains?page=3"},
			"next":{"href":"/v3/domains?page=3"},
			"previous":{"href":"/v3/domains?page=1"}
		},
		"resources": [{"guid":"dom-1","name":"x.example.com","internal":false}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/domains", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newDomainsContext(e, "/pp/v1/cf/domains/test-cnsi?per_page=25&page=2")
	plugin := newDomainsPlugin(srv.URL)

	require.NoError(t, plugin.getNativeDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits)
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StDomain]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
}

// TestGetNativeDomains_OmitsPagingWhenAbsent — V3-default contract.
func TestGetNativeDomains_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/domains", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newDomainsContext(e, "/pp/v1/cf/domains/test-cnsi")
	plugin := newDomainsPlugin(srv.URL)

	require.NoError(t, plugin.getNativeDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.False(t, q.PerPagePresent)
	assert.False(t, q.PagePresent)
}

// TestGetNativeOrgDomains_KeepsSharedAndGlobalDomains is a regression
// test for #5523: the Add Route domain dropdown was always empty.
// Two mistakes stacked up: the handler discarded everything except
// domains privately owned by the requested org, and it queried
// `/v3/domains?organization_guids=` — whose filter matches owning org
// only, so shared/global domains never even arrived. The mock serves
// only the org-scoped `/v3/organizations/:guid/domains` endpoint, so
// this test fails if the handler regresses to the filter query.
func TestGetNativeOrgDomains_KeepsSharedAndGlobalDomains(t *testing.T) {
	const orgGUID = "org-1"
	ts := orgDomainsTestServer(t, orgGUID)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newOrgDomainsContext(e, "/pp/v1/cf/org/test-cnsi/"+orgGUID+"/private_domains", orgGUID)
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeOrgDomains(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StDomain]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	guids := make([]string, 0, len(resp.Resources))
	for _, d := range resp.Resources {
		guids = append(guids, d.GUID)
	}

	// The global shared domain and the org's own private domain must
	// survive — this is the #5523 bug.
	assert.Contains(t, guids, "dom-global-shared", "global shared domain (no owning org) must be kept")
	assert.Contains(t, guids, "dom-owned", "domain owned by the requested org must be kept")
	assert.Contains(t, guids, "dom-shared-with-org", "domain explicitly shared with the requested org must be kept")

	// A domain privately owned by a *different* org must still be excluded.
	assert.NotContains(t, guids, "dom-owned-other", "domain owned by a different org must be excluded")

	assert.Len(t, resp.Resources, 3)
}
