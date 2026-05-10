// src/jetstream/plugins/cloudfoundry/native_service_brokers_reads_test.go
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

// brokersTestServer returns an httptest.Server that serves enough CF v3
// JSON to exercise the four ?return= modes plus the guids-batch and
// counts fast paths. /v3/service_brokers itself never includes spaces
// (CAPI 3.180.0 rejects ?include= and ?fields[] on this endpoint), so
// summary+ resolves space refs via a follow-up batch List against
// /v3/spaces?guids=… — handled by the case below.
func brokersTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_brokers":
			perPage := r.URL.Query().Get("per_page")
			guids := r.URL.Query().Get("guids")

			if perPage == "1" {
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": 4, "total_pages": 4},
					"resources":  []interface{}{},
				})
				return
			}

			if guids != "" {
				wanted := strings.Split(guids, ",")
				resources := []map[string]interface{}{}
				for _, g := range wanted {
					resources = append(resources, brokerResource(g, "broker-"+g, "https://broker-"+g+".example", ""))
				}
				_ = json.NewEncoder(w).Encode(map[string]interface{}{
					"pagination": map[string]interface{}{"total_results": len(wanted), "total_pages": 1},
					"resources":  resources,
				})
				return
			}

			payload := map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 4,
					"total_pages":   2,
					"first":         map[string]interface{}{"href": "https://api.test/v3/service_brokers?page=1&per_page=2"},
					"next":          map[string]interface{}{"href": "https://api.test/v3/service_brokers?page=2&per_page=2"},
					"last":          map[string]interface{}{"href": "https://api.test/v3/service_brokers?page=2&per_page=2"},
				},
				"resources": []map[string]interface{}{
					brokerResource("broker-1", "global-broker", "https://broker.example", ""),
					brokerResource("broker-2", "space-broker", "https://space-broker.example", "space-99"),
					brokerResource("broker-3", "labelled-broker", "https://labelled.example", "space-77"),
				},
			}
			_ = json.NewEncoder(w).Encode(payload)
		case "/v3/spaces":
			// Used by batchFetchBrokerSpaces. Echoes back whichever guids
			// were requested with stable test names.
			wanted := strings.Split(r.URL.Query().Get("guids"), ",")
			names := map[string]string{"space-99": "alpha", "space-77": "beta"}
			resources := []map[string]interface{}{}
			for _, g := range wanted {
				if g == "" {
					continue
				}
				resources = append(resources, map[string]interface{}{
					"guid": g, "name": names[g],
				})
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": len(resources), "total_pages": 1},
				"resources":  resources,
			})
		case "/v3/service_brokers/broker-77":
			res := brokerResource("broker-77", "single", "https://single-broker.example", "space-77")
			res["metadata"] = map[string]interface{}{
				"labels":      map[string]interface{}{"team": "platform"},
				"annotations": map[string]interface{}{"owner": "alice"},
			}
			_ = json.NewEncoder(w).Encode(res)
		case "/v3/spaces/space-77":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid": "space-77", "name": "beta",
			})
		default:
			http.NotFound(w, r)
		}
	}))
}

func brokerResource(guid, name, url, spaceGUID string) map[string]interface{} {
	res := map[string]interface{}{
		"guid":          guid,
		"name":          name,
		"url":           url,
		"created_at":    "2024-01-01T00:00:00Z",
		"updated_at":    "2024-01-02T00:00:00Z",
		"relationships": map[string]interface{}{},
	}
	if spaceGUID != "" {
		res["relationships"] = map[string]interface{}{
			"space": map[string]interface{}{
				"data": map[string]interface{}{"guid": spaceGUID},
			},
		}
	}
	return res
}

func newServiceBrokersContext(e *echo.Echo, target string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, target, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	return ctx, rec
}

func newServiceBrokersPlugin(serverURL string) *CloudFoundrySpecification {
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

func TestGetNativeServiceBrokers_Base(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 3)
	assert.Equal(t, 4, resp.Pagination.TotalResults)
	first := resp.Resources[0]
	assert.Equal(t, "broker-1", first.GUID)
	assert.Equal(t, "global-broker", first.Name)
	assert.Equal(t, "https://broker.example", first.URL)
	assert.Equal(t, "test-cnsi", first.CnsiGUID)
	assert.Nil(t, first.Space, "base tier does not populate space ref")
	assert.Empty(t, first.Labels, "base tier does not populate labels")
	require.NotNil(t, first.Meta, "base tier carries _meta.unavailable for authUsername")
	assert.Equal(t, []string{"authUsername"}, first.Meta.Unavailable)
}

func TestGetNativeServiceBrokers_Summary(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?return=summary")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 3)
	// Global broker has no space relationship — Space stays nil.
	assert.Nil(t, resp.Resources[0].Space)
	// Space-scoped brokers populate Space.{guid,name} from the included block.
	require.NotNil(t, resp.Resources[1].Space)
	assert.Equal(t, "space-99", resp.Resources[1].Space.GUID)
	assert.Equal(t, "alpha", resp.Resources[1].Space.Name)
	require.NotNil(t, resp.Resources[2].Space)
	assert.Equal(t, "space-77", resp.Resources[2].Space.GUID)
	assert.Equal(t, "beta", resp.Resources[2].Space.Name)
	// _meta.unavailable still present at summary
	require.NotNil(t, resp.Resources[0].Meta)
	assert.Equal(t, []string{"authUsername"}, resp.Resources[0].Meta.Unavailable)
}

func TestGetNativeServiceBrokers_SoftFallbackWhenIncludedMissing(t *testing.T) {
	// Same server but strip the included block on the include path so we
	// exercise the "?include= asked, no included block returned" branch.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_brokers":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					brokerResource("broker-1", "space-broker", "https://broker.example", "space-missing"),
				},
				// no included block
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?return=summary")
	plugin := newServiceBrokersPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 1)
	require.NotNil(t, resp.Resources[0].Space, "GUID-only space ref still emitted")
	assert.Equal(t, "space-missing", resp.Resources[0].Space.GUID)
	assert.Empty(t, resp.Resources[0].Space.Name, "name absent when included block is missing")
}

func TestGetNativeServiceBrokers_Details(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?return=details")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 3)
	// details inherits everything summary populates plus labels/annotations.
	require.NotNil(t, resp.Resources[2].Space)
	assert.Equal(t, "beta", resp.Resources[2].Space.Name)
	require.NotNil(t, resp.Resources[2].Meta)
	assert.Equal(t, []string{"authUsername"}, resp.Resources[2].Meta.Unavailable)
}

func TestGetNativeServiceBrokers_GuidsFilter(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?guids=a,b")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	require.Len(t, resp.Resources, 2)
	guids := []string{resp.Resources[0].GUID, resp.Resources[1].GUID}
	assert.ElementsMatch(t, []string{"a", "b"}, guids)
}

func TestGetNativeServiceBrokers_CountsFastPath(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?return=counts")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceBrokersResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, 4, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

func TestGetNativeServiceBrokerDetail_Details(t *testing.T) {
	ts := brokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_brokers/test-cnsi/broker-77?return=details", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "brokerGuid")
	ctx.SetParamValues("test-cnsi", "broker-77")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokerDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceBroker
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "broker-77", resp.GUID)
	assert.Equal(t, "single", resp.Name)
	assert.Equal(t, "https://single-broker.example", resp.URL)
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
	require.NotNil(t, resp.Space, "details tier resolves space via single-resource Spaces.Get")
	assert.Equal(t, "space-77", resp.Space.GUID)
	assert.Equal(t, "beta", resp.Space.Name)
	assert.Equal(t, map[string]string{"team": "platform"}, resp.Labels)
	assert.Equal(t, map[string]string{"owner": "alice"}, resp.Annotations)
	require.NotNil(t, resp.Meta)
	assert.Equal(t, []string{"authUsername"}, resp.Meta.Unavailable)
}

// TestGetNativeServiceBrokers_PerPagePassthrough verifies single-page
// passthrough.
func TestGetNativeServiceBrokers_PerPagePassthrough(t *testing.T) {
	body := []byte(`{
		"pagination": {
			"total_results": 60, "total_pages": 3,
			"first":{"href":"/v3/service_brokers?page=1"},
			"last":{"href":"/v3/service_brokers?page=3"},
			"next":{"href":"/v3/service_brokers?page=3"},
			"previous":{"href":"/v3/service_brokers?page=1"}
		},
		"resources": [{"guid":"b-1","name":"alpha","url":"https://broker"}]
	}`)
	srv, q := newPagingCapiServer(t, "/v3/service_brokers", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?per_page=25&page=2")
	plugin := newServiceBrokersPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, q.Hits)
	assert.Equal(t, "25", q.PerPage)
	assert.Equal(t, "2", q.Page)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 60, resp.Pagination.TotalResults)
}

// TestGetNativeServiceBrokers_OmitsPagingWhenAbsent — V3-default contract.
func TestGetNativeServiceBrokers_OmitsPagingWhenAbsent(t *testing.T) {
	body := []byte(`{"pagination":{"total_results":0,"total_pages":0,"next":null},"resources":[]}`)
	srv, q := newPagingCapiServer(t, "/v3/service_brokers", body)
	defer srv.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi")
	plugin := newServiceBrokersPlugin(srv.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.False(t, q.PerPagePresent)
	assert.False(t, q.PagePresent)
}
