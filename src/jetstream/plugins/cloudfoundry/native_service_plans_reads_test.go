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

// servicePlansTestServer serves enough CF v3 JSON to exercise the four
// ?return= modes plus the guids-batch, service_offering filter, and
// counts fast paths. When the request carries
// `include=service_offering` (or ...service_broker), the server emits a
// top-level `included` block so the handler's offeringsFromIncluded /
// brokersFromIncluded decoders can resolve refs in one round-trip.
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
			include := r.URL.Query().Get("include")

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

			payload := map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 7,
					"total_pages":   2,
					"next":          map[string]interface{}{"href": "https://api.test/v3/service_plans?page=2&per_page=5"},
					"first":         map[string]interface{}{"href": "https://api.test/v3/service_plans?page=1&per_page=5"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/service_plans?page=2&per_page=5"},
				},
				"resources": []map[string]interface{}{
					planResource("plan-1", "small", "offering-1"),
					planResource("plan-2", "medium", "offering-2"),
				},
			}
			if strings.Contains(include, "service_offering") {
				included := map[string]interface{}{
					"service_offerings": []map[string]interface{}{
						{
							"guid": "offering-1", "name": "redis",
							"relationships": map[string]interface{}{
								"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-1"}},
							},
						},
						{
							"guid": "offering-2", "name": "postgres",
							"relationships": map[string]interface{}{
								"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-2"}},
							},
						},
					},
				}
				if strings.Contains(include, "service_broker") {
					included["service_brokers"] = []map[string]interface{}{
						{"guid": "broker-1", "name": "alpha-broker", "url": "https://alpha.example"},
						{"guid": "broker-2", "name": "beta-broker", "url": "https://beta.example"},
					}
				}
				payload["included"] = included
			}
			_ = json.NewEncoder(w).Encode(payload)
		case "/v3/service_plans/plan-99":
			res := planResource("plan-99", "premium", "offering-2")
			res["metadata"] = map[string]interface{}{
				"labels":      map[string]interface{}{"tier": "gold"},
				"annotations": map[string]interface{}{"owner": "alice"},
			}
			_ = json.NewEncoder(w).Encode(res)
		case "/v3/service_offerings/offering-2":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "offering-2", "name": "postgres",
				"relationships": map[string]interface{}{
					"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-2"}},
				},
			})
		case "/v3/service_brokers/broker-2":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "broker-2", "name": "beta-broker", "url": "https://beta.example",
			})
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

func TestGetNativeServicePlans_Base(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	assert.Equal(t, 7, resp.Pagination.TotalResults)
	first := resp.Resources[0]
	assert.Equal(t, "plan-1", first.GUID)
	assert.Equal(t, "small", first.Name)
	assert.Equal(t, "test-cnsi", first.CnsiGUID)
	require.NotNil(t, first.ServiceOffering, "base tier emits guid-only offering ref")
	assert.Equal(t, "offering-1", first.ServiceOffering.GUID)
	assert.Empty(t, first.ServiceOffering.Name, "name reserved for summary+")
	assert.Nil(t, first.Free, "base tier does not emit free")
	assert.Empty(t, first.Description, "base tier does not emit description")
	assert.Empty(t, first.Costs, "base tier does not emit costs")
}

func TestGetNativeServicePlans_Summary(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?return=summary")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	first := resp.Resources[0]
	assert.Equal(t, "small plan", first.Description)
	require.NotNil(t, first.Free)
	assert.False(t, *first.Free)
	require.NotNil(t, first.Available)
	assert.True(t, *first.Available)
	assert.Equal(t, "public", first.VisibilityType)
	require.NotNil(t, first.ServiceOffering)
	assert.Equal(t, "offering-1", first.ServiceOffering.GUID)
	assert.Equal(t, "redis", first.ServiceOffering.Name, "summary tier resolves offering name from include block")
	require.NotNil(t, first.ServiceOffering.Broker, "summary tier resolves broker via nested include chain")
	assert.Equal(t, "broker-1", first.ServiceOffering.Broker.GUID)
	assert.Equal(t, "alpha-broker", first.ServiceOffering.Broker.Name)
	assert.Empty(t, first.ServiceOffering.Broker.URL, "URL deferred to details")
	assert.Empty(t, first.Costs, "costs deferred to details")
}

func TestGetNativeServicePlans_Details(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?return=details")
	plugin := newServicePlansPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	first := resp.Resources[0]
	require.Len(t, first.Costs, 1)
	assert.Equal(t, "USD", first.Costs[0].Currency)
	require.NotNil(t, first.ServiceOffering)
	require.NotNil(t, first.ServiceOffering.Broker)
	assert.Equal(t, "https://alpha.example", first.ServiceOffering.Broker.URL, "details tier expands broker URL")
}

func TestGetNativeServicePlans_SoftFallbackWhenIncludedMissing(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_plans":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources":  []map[string]interface{}{planResource("plan-1", "small", "offering-1")},
				// No included block — handler should still emit guid-only refs.
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?return=summary")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 1)
	first := resp.Resources[0]
	require.NotNil(t, first.ServiceOffering)
	assert.Equal(t, "offering-1", first.ServiceOffering.GUID)
	assert.Empty(t, first.ServiceOffering.Name, "name absent when included block is missing")
	assert.Nil(t, first.ServiceOffering.Broker, "broker absent when included block is missing")
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

	require.Len(t, resp.Resources, 3)
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
	assert.Empty(t, resp.Resources)
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

	require.Len(t, resp.Resources, 1)
	assert.Equal(t, "plan-of-offering-7", resp.Resources[0].GUID)
	require.NotNil(t, resp.Resources[0].ServiceOffering)
	assert.Equal(t, "offering-7", resp.Resources[0].ServiceOffering.GUID)
}

func TestGetNativeServicePlanDetail_Details(t *testing.T) {
	ts := servicePlansTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_plans/test-cnsi/plan-99?return=details", nil)
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
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
	require.NotNil(t, resp.ServiceOffering)
	assert.Equal(t, "offering-2", resp.ServiceOffering.GUID)
	assert.Equal(t, "postgres", resp.ServiceOffering.Name, "details tier resolves offering name via per-detail follow-up")
	require.NotNil(t, resp.ServiceOffering.Broker)
	assert.Equal(t, "broker-2", resp.ServiceOffering.Broker.GUID)
	assert.Equal(t, "beta-broker", resp.ServiceOffering.Broker.Name)
	assert.Equal(t, "https://beta.example", resp.ServiceOffering.Broker.URL)
	assert.Equal(t, map[string]string{"tier": "gold"}, resp.Labels)
}

// TestGetNativeServicePlans_PerPagePassthrough verifies the handler is a
// single-page passthrough.
func TestGetNativeServicePlans_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60, "total_pages": 3,
			"first":{"href":"/v3/service_plans?page=1"},
			"last":{"href":"/v3/service_plans?page=3"},
			"next":{"href":"/v3/service_plans?page=3"},
			"previous":{"href":"/v3/service_plans?page=1"}
		},
		"resources": [{"guid":"plan-1","name":"small","relationships":{"service_offering":{"data":{"guid":"off-1"}}}}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/service_plans", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi?per_page=25&page=2")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits)
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
	assert.NotNil(t, resp.Pagination.Next)
	assert.NotNil(t, resp.Pagination.Previous)
}

// TestGetNativeServicePlans_OmitsPagingWhenAbsent — V3-default contract.
func TestGetNativeServicePlans_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/service_plans", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServicePlansContext(e, "/pp/v1/cf/service_plans/test-cnsi")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlans(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.False(t, q.PerPagePresent)
	assert.False(t, q.PagePresent)
}

// scopedPlansServer captures the service_broker_guids filter on /v3/service_plans
// so tests can assert path-derived broker scoping.
type scopedPlansCapture struct {
	BrokerGUIDs   []string
	OfferingGUIDs []string
	Hits          int
}

func newScopedPlansServer(t *testing.T, capture *scopedPlansCapture) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_plans":
			capture.Hits++
			capture.BrokerGUIDs = splitCSV(r.URL.Query().Get("service_broker_guids"))
			capture.OfferingGUIDs = splitCSV(r.URL.Query().Get("service_offering_guids"))
			perPage := r.URL.Query().Get("per_page")
			if perPage == "1" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 4, "total_pages": 4},
					"resources":  []interface{}{},
				})
				return
			}
			payload := map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					planResource("plan-1", "small", "off-1"),
				},
			}
			if include := r.URL.Query().Get("include"); strings.Contains(include, "service_offering") {
				payload["included"] = map[string]interface{}{
					"service_offerings": []map[string]interface{}{
						{
							"guid": "off-1", "name": "redis",
							"relationships": map[string]interface{}{
								"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-1"}},
							},
						},
					},
					"service_brokers": []map[string]interface{}{
						{"guid": "broker-1", "name": "alpha-broker", "url": "https://broker.example"},
					},
				}
			}
			_ = json.NewEncoder(w).Encode(payload)
		default:
			http.NotFound(w, r)
		}
	}))
}

func TestGetNativeServicePlansForBroker_AppliesBrokerFilter(t *testing.T) {
	capture := &scopedPlansCapture{}
	srv := newScopedPlansServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/test-cnsi/broker-1/plans?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("test-cnsi", "broker-1")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlansForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"broker-1"}, capture.BrokerGUIDs)
	assert.Equal(t, 1, capture.Hits, "summary mode is one CAPI call (include chain decoded server-side)")

	var resp StratosPagedResponse[StServicePlan]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)
	first := resp.Resources[0]
	require.NotNil(t, first.ServiceOffering)
	assert.Equal(t, "redis", first.ServiceOffering.Name, "include chain populated offering name")
	require.NotNil(t, first.ServiceOffering.Broker)
	assert.Equal(t, "alpha-broker", first.ServiceOffering.Broker.Name)
}

func TestGetNativeServicePlansForBroker_ComposesWithOfferingFilter(t *testing.T) {
	capture := &scopedPlansCapture{}
	srv := newScopedPlansServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/test-cnsi/broker-1/plans?service_offering=off-1,off-2", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("test-cnsi", "broker-1")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlansForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"broker-1"}, capture.BrokerGUIDs)
	assert.ElementsMatch(t, []string{"off-1", "off-2"}, capture.OfferingGUIDs, "broker scope and offering filter compose")
}

func TestGetNativeServicePlansForBroker_Counts(t *testing.T) {
	capture := &scopedPlansCapture{}
	srv := newScopedPlansServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/test-cnsi/broker-1/plans?return=counts", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("test-cnsi", "broker-1")
	plugin := newServicePlansPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServicePlansForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"broker-1"}, capture.BrokerGUIDs)

	var resp StServicePlansResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 4, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeServicePlansForBroker_RequiresBrokerGUID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/test-cnsi//plans", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("test-cnsi", "")
	plugin := newServicePlansPlugin("http://unused")

	err := plugin.getNativeServicePlansForBroker(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}
