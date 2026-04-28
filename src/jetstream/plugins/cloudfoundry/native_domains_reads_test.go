// src/jetstream/plugins/cloudfoundry/native_domains_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
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

func newDomainsContext(e *echo.Echo, target string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	return ctx, rec
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
	ctx.SetParamNames("cnsiGuid", "domainGuid")
	ctx.SetParamValues("test-cnsi", "dom-99")
	plugin := newDomainsPlugin(ts.URL)

	require.NoError(t, plugin.getNativeDomainDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StDomain
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "dom-99", resp.GUID)
	assert.Equal(t, "single.example.com", resp.Name)
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
}
