// src/jetstream/plugins/cloudfoundry/native_service_plans_reads_test.go
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

// servicePlansTestServer returns an httptest.Server that serves enough
// CF v3 JSON to exercise the service-plans handler.
func servicePlansTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_plans":
			perPage := r.URL.Query().Get("per_page")
			guids := r.URL.Query().Get("guids")
			offeringGuids := r.URL.Query().Get("service_offering_guids")
			page := r.URL.Query().Get("page")

			if offeringGuids != "" {
				wanted := strings.Split(offeringGuids, ",")
				resources := []map[string]interface{}{}
				for _, og := range wanted {
					resources = append(resources, planResource("plan-of-"+og, "from-"+og, og))
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": len(wanted), "total_pages": 1},
					"resources":  resources,
				})
				return
			}

			if perPage == "1" {
				// counts fast-path probe
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 7, "total_pages": 7},
					"resources":  []interface{}{},
				})
				return
			}

			if guids != "" {
				wanted := strings.Split(guids, ",")
				resources := []map[string]interface{}{}
				for _, g := range wanted {
					resources = append(resources, planResource(g, "plan-"+g, "offering-1"))
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": len(wanted), "total_pages": 1},
					"resources":  resources,
				})
				return
			}

			// default list path — return one page with two plans
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 7,
					"total_pages":   2,
					"next":          map[string]interface{}{"href": "https://api.test/v3/service_plans?page=2&per_page=5"},
					"first":         map[string]interface{}{"href": "https://api.test/v3/service_plans?page=1&per_page=5"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/service_plans?page=2&per_page=5"},
				},
				"resources": []map[string]interface{}{
					planResource("plan-1", "small", "offering-1"),
					planResource("plan-2", "medium", "offering-1"),
				},
			})
			_ = page
		case "/v3/service_plans/plan-99":
			_ = json.NewEncoder(w).Encode(planResource("plan-99", "premium", "offering-2"))
		default:
			http.NotFound(w, r)
		}
	}))
}

func planResource(guid, name, offeringGUID string) map[string]interface{} {
	return map[string]interface{}{
		"guid":            guid,
		"name":            name,
		"description":     name + " plan",
		"available":       true,
		"free":            false,
		"visibility_type": "public",
		"created_at":      "2024-01-01T00:00:00Z",
		"updated_at":      "2024-01-02T00:00:00Z",
		"costs": []map[string]interface{}{
			{"amount": 9.99, "currency": "USD", "unit": "MONTHLY"},
		},
		"relationships": map[string]interface{}{
			"service_offering": map[string]interface{}{
				"data": map[string]interface{}{"guid": offeringGUID},
			},
		},
	}
}

func newServicePlansContext(e *echo.Echo, target string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	return ctx, rec
}

func newServicePlansPlugin(serverURL string) *CloudFoundrySpecification {
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

func TestGetNativeServicePlans_DefaultPaginatedPage(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Len(t, resp.Resources, 2, "default path should return one CAPI page, not drain")
	assert.Equal(t, 7, resp.Pagination.TotalResults)
	assert.Equal(t, "plan-1", resp.Resources[0].GUID)
	assert.Equal(t, "small", resp.Resources[0].Name)
	assert.Equal(t, "offering-1", resp.Resources[0].ServiceOfferingGUID)
	assert.True(t, resp.Resources[0].Available)
	assert.False(t, resp.Resources[0].Free)
	assert.Equal(t, "public", resp.Resources[0].VisibilityType)
	assert.Equal(t, "test-cnsi", resp.Resources[0].CnsiGUID)
	require.Len(t, resp.Resources[0].Costs, 1)
	assert.Equal(t, "USD", resp.Resources[0].Costs[0].Currency)
}

func TestGetNativeServicePlans_GuidsFilter(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?guids=a,b,c")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Len(t, resp.Resources, 3, "guids filter narrows to the requested set")
	guids := []string{resp.Resources[0].GUID, resp.Resources[1].GUID, resp.Resources[2].GUID}
	assert.ElementsMatch(t, []string{"a", "b", "c"}, guids)
}

func TestGetNativeServicePlans_CountsFastPath(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?return=counts")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServicePlansResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, 7, resp.TotalResults)
	assert.Empty(t, resp.Resources, "counts fast-path skips the resource body")
}

func TestGetNativeServicePlans_ServiceOfferingFilter(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?service_offering=offering-7")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 1, "service_offering filter narrows to plans for the requested offering")
	assert.Equal(t, "plan-of-offering-7", resp.Resources[0].GUID)
	assert.Equal(t, "offering-7", resp.Resources[0].ServiceOfferingGUID)
}

func TestGetNativeServicePlanDetail(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_plans/test-cnsi/plan-99", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "planGuid")
	ctx.SetParamValues("test-cnsi", "plan-99")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlanDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServicePlan
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "plan-99", resp.GUID)
	assert.Equal(t, "premium", resp.Name)
	assert.Equal(t, "offering-2", resp.ServiceOfferingGUID)
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
}
