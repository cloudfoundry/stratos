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

// serviceBrokersTestServer returns an httptest.Server that serves
// enough CF v3 JSON to exercise the service-brokers handler.
func serviceBrokersTestServer(t *testing.T) *httptest.Server {
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

			_ = json.NewEncoder(w).Encode(map[string]interface{}{
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
				},
			})
		case "/v3/service_brokers/broker-77":
			_ = json.NewEncoder(w).Encode(brokerResource("broker-77", "single", "https://single-broker.example", ""))
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

func TestGetNativeServiceBrokers_DefaultPaginatedPage(t *testing.T) {
	ts := serviceBrokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Len(t, resp.Resources, 2, "default path returns a single CAPI page")
	assert.Equal(t, 4, resp.Pagination.TotalResults)
	assert.Equal(t, "broker-1", resp.Resources[0].GUID)
	assert.Equal(t, "global-broker", resp.Resources[0].Name)
	assert.Equal(t, "https://broker.example", resp.Resources[0].URL)
	assert.Equal(t, "", resp.Resources[0].SpaceGUID, "global brokers have no space relationship")
	assert.Equal(t, "test-cnsi", resp.Resources[0].CnsiGUID)
	assert.Equal(t, "space-99", resp.Resources[1].SpaceGUID, "space-scoped brokers carry SpaceGUID")
}

func TestGetNativeServiceBrokers_GuidsFilter(t *testing.T) {
	ts := serviceBrokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	ctx, rec := newServiceBrokersContext(e, "/pp/v1/cf/service_brokers/test-cnsi?guids=a,b")
	plugin := newServiceBrokersPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceBrokers(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StratosPagedResponse[StServiceBroker]
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Len(t, resp.Resources, 2)
	guids := []string{resp.Resources[0].GUID, resp.Resources[1].GUID}
	assert.ElementsMatch(t, []string{"a", "b"}, guids)
}

func TestGetNativeServiceBrokers_CountsFastPath(t *testing.T) {
	ts := serviceBrokersTestServer(t)
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

func TestGetNativeServiceBrokerDetail(t *testing.T) {
	ts := serviceBrokersTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_brokers/test-cnsi/broker-77", nil)
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
