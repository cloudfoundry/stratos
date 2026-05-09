// src/jetstream/plugins/cloudfoundry/native_service_instances_reads_test.go
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

// instancesTestServer serves enough CF v3 JSON to exercise the four
// ?return= modes. When the request carries the include chain
// (`include=service_plan,service_plan.service_offering,
// service_plan.service_offering.service_broker,space,space.organization`)
// the server emits a top-level `included` block populated for plans,
// offerings, brokers, spaces, and organizations.
func instancesTestServer(t *testing.T) (*httptest.Server, *int) {
	t.Helper()
	siHits := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_instances":
			siHits++
			perPage := r.URL.Query().Get("per_page")
			include := r.URL.Query().Get("include")
			if perPage == "1" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 17, "total_pages": 17},
					"resources":  []interface{}{},
				})
				return
			}

			payload := map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 17, "total_pages": 2,
					"first": map[string]interface{}{"href": "/v3/service_instances?page=1"},
					"last":  map[string]interface{}{"href": "/v3/service_instances?page=2"},
					"next":  map[string]interface{}{"href": "/v3/service_instances?page=2"},
				},
				"resources": []map[string]interface{}{
					instanceResource("si-1", "redis-instance", "managed", "space-1", "plan-1", nil),
					instanceResource("si-2", "external-db", "user-provided", "space-1", "", &upsBlock{
						SyslogDrainURL:  "https://drain.example",
						RouteServiceURL: "https://route.example",
					}),
				},
			}
			if strings.Contains(include, "service_plan") {
				payload["included"] = map[string]interface{}{
					"service_plans": []map[string]interface{}{
						{
							"guid": "plan-1", "name": "small", "free": true,
							"relationships": map[string]interface{}{
								"service_offering": map[string]interface{}{"data": map[string]interface{}{"guid": "off-1"}},
							},
						},
					},
					"service_offerings": []map[string]interface{}{
						{
							"guid": "off-1", "name": "redis", "description": "in-memory store",
							"relationships": map[string]interface{}{
								"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-1"}},
							},
						},
					},
					"service_brokers": []map[string]interface{}{
						{"guid": "broker-1", "name": "alpha-broker", "url": "https://broker.example"},
					},
					"spaces": []map[string]interface{}{
						{
							"guid": "space-1", "name": "engineering",
							"relationships": map[string]interface{}{
								"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
							},
						},
					},
					"organizations": []map[string]interface{}{
						{"guid": "org-1", "name": "acme"},
					},
				}
			}
			_ = json.NewEncoder(w).Encode(payload)
		case "/v3/service_instances/si-77":
			res := instanceResource("si-77", "premium-db", "managed", "space-1", "plan-2", nil)
			res["metadata"] = map[string]interface{}{
				"labels":      map[string]interface{}{"tier": "gold"},
				"annotations": map[string]interface{}{"owner": "alice"},
			}
			res["upgrade_available"] = true
			res["maintenance_info"] = map[string]interface{}{"version": "1.2.3", "description": "fix"}
			_ = json.NewEncoder(w).Encode(res)
		case "/v3/service_plans/plan-2":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "plan-2", "name": "premium", "free": false,
				"relationships": map[string]interface{}{
					"service_offering": map[string]interface{}{"data": map[string]interface{}{"guid": "off-2"}},
				},
			})
		case "/v3/service_offerings/off-2":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "off-2", "name": "postgres",
				"relationships": map[string]interface{}{
					"service_broker": map[string]interface{}{"data": map[string]interface{}{"guid": "broker-2"}},
				},
			})
		case "/v3/service_brokers/broker-2":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "broker-2", "name": "beta-broker", "url": "https://broker2.example",
			})
		case "/v3/spaces/space-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "space-1", "name": "engineering",
				"relationships": map[string]interface{}{
					"organization": map[string]interface{}{"data": map[string]interface{}{"guid": "org-1"}},
				},
			})
		case "/v3/organizations/org-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"guid": "org-1", "name": "acme"})
		default:
			http.NotFound(w, r)
		}
	}))
	return srv, &siHits
}

type upsBlock struct {
	SyslogDrainURL  string
	RouteServiceURL string
}

func instanceResource(guid, name, instanceType, spaceGUID, planGUID string, ups *upsBlock) map[string]interface{} {
	res := map[string]interface{}{
		"guid":       guid,
		"name":       name,
		"type":       instanceType,
		"tags":       []string{"redis", "cache"},
		"created_at": "2024-01-01T00:00:00Z",
		"updated_at": "2024-01-02T00:00:00Z",
		"last_operation": map[string]interface{}{
			"type":        "create",
			"state":       "succeeded",
			"description": "ok",
			"updated_at":  "2024-01-02T00:00:00Z",
			"created_at":  "2024-01-01T00:00:00Z",
		},
		"relationships": map[string]interface{}{
			"space": map[string]interface{}{"data": map[string]interface{}{"guid": spaceGUID}},
		},
	}
	if planGUID != "" {
		res["relationships"].(map[string]interface{})["service_plan"] = map[string]interface{}{
			"data": map[string]interface{}{"guid": planGUID},
		}
	}
	if ups != nil {
		res["syslog_drain_url"] = ups.SyslogDrainURL
		res["route_service_url"] = ups.RouteServiceURL
	} else {
		res["dashboard_url"] = "https://dashboard.example/" + guid
	}
	return res
}

func newServiceInstancesContext(e *echo.Echo, target string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("cnsi-1")
	return ctx, rec
}

func newServiceInstancesPlugin(serverURL string) *CloudFoundrySpecification {
	return &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(serverURL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}
}

func TestGetNativeServiceInstances_Base(t *testing.T) {
	srv, siHits := instancesTestServer(t)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, *siHits, "base mode is one CAPI call (no include drain)")

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	first := resp.Resources[0]
	assert.Equal(t, "si-1", first.GUID)
	assert.Equal(t, "redis-instance", first.Name)
	assert.Equal(t, "managed", first.Type)
	assert.Equal(t, []string{"redis", "cache"}, first.Tags)
	require.NotNil(t, first.Space, "base tier emits guid-only space ref")
	assert.Equal(t, "space-1", first.Space.GUID)
	assert.Empty(t, first.Space.Name, "name reserved for summary+")
	require.NotNil(t, first.ServicePlan)
	assert.Equal(t, "plan-1", first.ServicePlan.GUID)
	assert.Empty(t, first.ServicePlan.Name)
	assert.Empty(t, first.DashboardURL, "dashboardUrl deferred to summary+")
	assert.Empty(t, first.SyslogDrainURL, "syslogDrainUrl deferred to summary+")
	require.NotNil(t, first.LastOperation)
	assert.Equal(t, "succeeded", first.LastOperation.State)

	// UPS row has no servicePlan
	ups := resp.Resources[1]
	assert.Equal(t, "user-provided", ups.Type)
	assert.Nil(t, ups.ServicePlan, "UPS rows must not carry servicePlan")
}

func TestGetNativeServiceInstances_Summary(t *testing.T) {
	srv, _ := instancesTestServer(t)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=summary")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	first := resp.Resources[0]
	require.NotNil(t, first.Space)
	assert.Equal(t, "space-1", first.Space.GUID)
	assert.Equal(t, "engineering", first.Space.Name)
	require.NotNil(t, first.Space.Organization)
	assert.Equal(t, "org-1", first.Space.Organization.GUID)
	assert.Equal(t, "acme", first.Space.Organization.Name)
	require.NotNil(t, first.ServicePlan)
	assert.Equal(t, "small", first.ServicePlan.Name)
	require.NotNil(t, first.ServicePlan.Free)
	assert.True(t, *first.ServicePlan.Free)
	require.NotNil(t, first.ServicePlan.ServiceOffering)
	assert.Equal(t, "redis", first.ServicePlan.ServiceOffering.Name)
	require.NotNil(t, first.ServicePlan.ServiceOffering.Broker)
	assert.Equal(t, "alpha-broker", first.ServicePlan.ServiceOffering.Broker.Name)
	assert.Empty(t, first.ServicePlan.ServiceOffering.Broker.URL, "broker URL reserved for details")
	assert.Equal(t, "https://dashboard.example/si-1", first.DashboardURL)

	ups := resp.Resources[1]
	assert.Equal(t, "https://drain.example", ups.SyslogDrainURL)
	assert.Equal(t, "https://route.example", ups.RouteServiceURL)
	assert.Empty(t, ups.DashboardURL, "UPS rows have no broker dashboard")
}

func TestGetNativeServiceInstances_SoftFallbackWhenIncludedMissing(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_instances":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					instanceResource("si-1", "redis", "managed", "space-1", "plan-1", nil),
				},
				// no included block
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=summary")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 1)
	first := resp.Resources[0]
	require.NotNil(t, first.Space, "guid-only ref still emitted")
	assert.Equal(t, "space-1", first.Space.GUID)
	assert.Empty(t, first.Space.Name, "name absent without included block")
	assert.Nil(t, first.Space.Organization, "organization ref absent without included block")
	require.NotNil(t, first.ServicePlan)
	assert.Empty(t, first.ServicePlan.Name)
	assert.Nil(t, first.ServicePlan.ServiceOffering, "offering ref absent without included block")
}

func TestGetNativeServiceInstances_CountsFastPath(t *testing.T) {
	srv, _ := instancesTestServer(t)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=counts")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceInstancesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 17, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeServiceInstances_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60, "total_pages": 3,
			"first":{"href":"/v3/service_instances?page=1"},
			"last":{"href":"/v3/service_instances?page=3"},
			"next":{"href":"/v3/service_instances?page=3"},
			"previous":{"href":"/v3/service_instances?page=1"}
		},
		"resources": [{"guid":"si-1","name":"x","type":"managed","tags":[],"last_operation":{"state":"succeeded"},"relationships":{"space":{"data":{"guid":"sp-1"}}}}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/service_instances", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?per_page=25&page=2")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits, "base mode is single-page passthrough")
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
}

func TestGetNativeServiceInstances_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/service_instances", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.False(t, q.PerPagePresent)
	assert.False(t, q.PagePresent)
}

func TestGetNativeServiceInstanceDetail_Details(t *testing.T) {
	srv, _ := instancesTestServer(t)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_instances/cnsi-1/si-77?return=details", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "instanceGuid")
	ctx.SetParamValues("cnsi-1", "si-77")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstanceDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceInstance
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "si-77", resp.GUID)
	assert.Equal(t, "premium-db", resp.Name)
	require.NotNil(t, resp.MaintenanceInfo)
	assert.Equal(t, "1.2.3", resp.MaintenanceInfo.Version)
	require.NotNil(t, resp.UpgradeAvailable)
	assert.True(t, *resp.UpgradeAvailable)
	assert.Equal(t, map[string]string{"tier": "gold"}, resp.Labels)
	require.NotNil(t, resp.Space)
	assert.Equal(t, "engineering", resp.Space.Name)
	require.NotNil(t, resp.Space.Organization)
	assert.Equal(t, "acme", resp.Space.Organization.Name)
	require.NotNil(t, resp.ServicePlan)
	assert.Equal(t, "premium", resp.ServicePlan.Name)
	require.NotNil(t, resp.ServicePlan.ServiceOffering)
	assert.Equal(t, "postgres", resp.ServicePlan.ServiceOffering.Name)
	require.NotNil(t, resp.ServicePlan.ServiceOffering.Broker)
	assert.Equal(t, "https://broker2.example", resp.ServicePlan.ServiceOffering.Broker.URL, "details tier expands broker URL")
}

// scopedInstancesTestServer captures the filter parameters CF v3 receives
// (space_guids / service_plan_guids / service_broker_guids) so the tests can
// assert on them. Returns a one-row instances response on the instances path
// and a configurable plans response on the plans path (used by the broker
// scope's two-step composition).
type scopedInstancesCapture struct {
	InstancesSpaceGUIDs []string
	InstancesPlanGUIDs  []string
	InstancesOrgGUIDs   []string
	InstancesGUIDs      []string
	InstancesType       string
	PlansBrokerGUIDs    []string
	PlanGUIDsToReturn   []string
	InstancesHits       int
	PlansHits           int
}

func newScopedInstancesServer(t *testing.T, capture *scopedInstancesCapture) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_plans":
			capture.PlansHits++
			capture.PlansBrokerGUIDs = splitCSV(r.URL.Query().Get("service_broker_guids"))
			plans := make([]map[string]interface{}, 0, len(capture.PlanGUIDsToReturn))
			for _, g := range capture.PlanGUIDsToReturn {
				plans = append(plans, map[string]interface{}{"guid": g, "name": g + "-name"})
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": len(plans), "total_pages": 1},
				"resources":  plans,
			})
		case "/v3/service_instances":
			capture.InstancesHits++
			capture.InstancesSpaceGUIDs = splitCSV(r.URL.Query().Get("space_guids"))
			capture.InstancesPlanGUIDs = splitCSV(r.URL.Query().Get("service_plan_guids"))
			capture.InstancesOrgGUIDs = splitCSV(r.URL.Query().Get("organization_guids"))
			capture.InstancesGUIDs = splitCSV(r.URL.Query().Get("guids"))
			capture.InstancesType = r.URL.Query().Get("type")
			perPage := r.URL.Query().Get("per_page")
			if perPage == "1" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 5, "total_pages": 5},
					"resources":  []interface{}{},
				})
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					instanceResource("si-1", "redis-instance", "managed", "space-A", "plan-A", nil),
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
}

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	return strings.Split(s, ",")
}

func TestGetNativeServiceInstancesForSpace_AppliesSpaceFilter(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/space-A/service_instances?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "space-A")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForSpace(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"space-A"}, capture.InstancesSpaceGUIDs, "path-derived space filter applied")
	assert.Empty(t, capture.InstancesPlanGUIDs, "broker scope must not leak into space scope")
	assert.Equal(t, 0, capture.PlansHits, "space scope is one CAPI call (no plans probe)")
	assert.Equal(t, 1, capture.InstancesHits)

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)
	assert.Equal(t, "si-1", resp.Resources[0].GUID)
}

func TestGetNativeServiceInstancesForSpace_Counts(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/space-A/service_instances?return=counts", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "space-A")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForSpace(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"space-A"}, capture.InstancesSpaceGUIDs, "counts mode still scoped by space")

	var resp StServiceInstancesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 5, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeServiceInstancesForSpace_RequiresSpaceGUID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1//service_instances", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "")
	plugin := newServiceInstancesPlugin("http://unused")

	err := plugin.getNativeServiceInstancesForSpace(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

func TestGetNativeServiceInstancesForBroker_TwoStepComposition(t *testing.T) {
	capture := &scopedInstancesCapture{
		PlanGUIDsToReturn: []string{"plan-A", "plan-B"},
	}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/cnsi-1/broker-1/service_instances?return=summary", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("cnsi-1", "broker-1")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, capture.PlansHits, "broker scope probes plans first")
	assert.Equal(t, []string{"broker-1"}, capture.PlansBrokerGUIDs)
	assert.Equal(t, 1, capture.InstancesHits, "instances list narrowed by plan filter")
	assert.ElementsMatch(t, []string{"plan-A", "plan-B"}, capture.InstancesPlanGUIDs)
	assert.Empty(t, capture.InstancesSpaceGUIDs, "broker scope must not leak into space scope")

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	require.Len(t, resp.Resources, 1)
}

func TestGetNativeServiceInstancesForBroker_BrokerWithNoPlansShortCircuits(t *testing.T) {
	capture := &scopedInstancesCapture{
		PlanGUIDsToReturn: nil, // broker has no plans
	}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/cnsi-1/broker-empty/service_instances", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("cnsi-1", "broker-empty")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, capture.PlansHits)
	assert.Equal(t, 0, capture.InstancesHits, "no instances call when broker has no plans")

	var resp StratosPagedResponse[StServiceInstance]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Empty(t, resp.Resources)
	assert.Equal(t, 0, resp.Pagination.TotalResults)
}

func TestGetNativeServiceInstancesForBroker_CountsShortCircuitsWhenNoPlans(t *testing.T) {
	capture := &scopedInstancesCapture{
		PlanGUIDsToReturn: nil,
	}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/cnsi-1/broker-empty/service_instances?return=counts", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("cnsi-1", "broker-empty")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForBroker(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, capture.InstancesHits, "counts on empty broker is zero CAPI calls beyond the plans probe")

	var resp StServiceInstancesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 0, resp.TotalResults)
}

func TestGetNativeServiceInstancesForBroker_RequiresBrokerGUID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/brokers/cnsi-1//service_instances", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("cnsi-1", "")
	plugin := newServiceInstancesPlugin("http://unused")

	err := plugin.getNativeServiceInstancesForBroker(ctx)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

// Stage 9e — caller-supplied filters (`?type=`, `?organization_guids=`,
// `?space_guids=`, `?guids=`) are passed through to CF v3 by both the
// cnsi-wide and the path-scoped (space) handlers. The UPS-only count
// paths and the picker rely on this passthrough.

func TestGetNativeServiceInstances_TypeFilterPassthrough_Counts(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=counts&type=user-provided")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "user-provided", capture.InstancesType)

	var resp StServiceInstancesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 5, resp.TotalResults)
}

func TestGetNativeServiceInstances_OrgFilterPassthrough_Counts(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=counts&type=user-provided&organization_guids=org-7")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"org-7"}, capture.InstancesOrgGUIDs)
	assert.Equal(t, "user-provided", capture.InstancesType)
}

func TestGetNativeServiceInstances_SpaceFilterPassthrough_List(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=base&space_guids=space-A,space-B")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.ElementsMatch(t, []string{"space-A", "space-B"}, capture.InstancesSpaceGUIDs)
}

func TestGetNativeServiceInstances_GuidsFilterPassthrough(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceInstancesContext(e, "/pp/v1/cf/service_instances/cnsi-1?return=base&guids=si-7,si-8")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstances(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.ElementsMatch(t, []string{"si-7", "si-8"}, capture.InstancesGUIDs)
}

func TestGetNativeServiceInstancesForSpace_TypeFilterLayered_Counts(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/space-A/service_instances?return=counts&type=user-provided", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "space-A")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForSpace(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"space-A"}, capture.InstancesSpaceGUIDs, "path-derived space filter still applied")
	assert.Equal(t, "user-provided", capture.InstancesType, "type filter layered on top of space scope")

	var resp StServiceInstancesResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 5, resp.TotalResults)
}

func TestGetNativeServiceInstancesForSpace_TypeFilterLayered_List(t *testing.T) {
	capture := &scopedInstancesCapture{}
	srv := newScopedInstancesServer(t, capture)
	defer srv.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/spaces/cnsi-1/space-A/service_instances?return=summary&type=user-provided", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "spaceGuid")
	ctx.SetParamValues("cnsi-1", "space-A")
	plugin := newServiceInstancesPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceInstancesForSpace(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, []string{"space-A"}, capture.InstancesSpaceGUIDs)
	assert.Equal(t, "user-provided", capture.InstancesType)
}
