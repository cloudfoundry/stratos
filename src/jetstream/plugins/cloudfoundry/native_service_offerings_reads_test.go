// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads_test.go
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

// serviceOfferingTestServer fakes /v3/service_offerings (list + get) and
// /v3/service_brokers (batch-by-guids join). lastListQuery captures the
// raw query string seen on the most recent list call so tests can assert
// per_page / page / include were forwarded correctly.
type serviceOfferingTestServer struct {
	*httptest.Server
	listHits      int
	brokerHits    int
	lastListQuery string
}

func newServiceOfferingTestServer(t *testing.T) *serviceOfferingTestServer {
	t.Helper()
	s := &serviceOfferingTestServer{}
	s.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case r.URL.Path == "/v3/service_offerings":
			s.listHits++
			s.lastListQuery = r.URL.RawQuery
			// v3 emits the `included` block only when the request asked
			// for it via ?include=. Mirror that so tests exercise the
			// handler's include-aware code path rather than the empty-
			// included fallback.
			body := map[string]interface{}{
				"pagination": map[string]interface{}{
					"total_results": 2, "total_pages": 1,
					"first": map[string]interface{}{"href": "/v3/service_offerings?page=1"},
					"last":  map[string]interface{}{"href": "/v3/service_offerings?page=1"},
				},
				"resources": []map[string]interface{}{
					{
						"guid":        "offering-1",
						"name":        "redis",
						"description": "Key/value store",
						"available":   true,
						"shareable":   false,
						"tags":        []string{"db", "kv"},
						"requires":    []string{"syslog_drain"},
						"created_at":  "2024-01-01T00:00:00Z",
						"updated_at":  "2024-01-02T00:00:00Z",
						"broker_catalog": map[string]interface{}{
							"id": "bc-1",
							"metadata": map[string]interface{}{
								"longDescription": "Redis 7",
							},
						},
						"relationships": map[string]interface{}{
							"service_broker": map[string]interface{}{
								"data": map[string]interface{}{"guid": "broker-1"},
							},
						},
					},
					{
						"guid":       "offering-2",
						"name":       "postgres",
						"available":  true,
						"created_at": "2024-01-03T00:00:00Z",
						"updated_at": "2024-01-04T00:00:00Z",
						"relationships": map[string]interface{}{
							"service_broker": map[string]interface{}{
								"data": map[string]interface{}{"guid": "broker-2"},
							},
						},
					},
				},
			}
			if strings.Contains(r.URL.RawQuery, "include=service_broker") {
				body["included"] = map[string]interface{}{
					"service_brokers": []map[string]interface{}{
						{"guid": "broker-1", "name": "redis-broker", "url": "https://broker-1.example"},
						{"guid": "broker-2", "name": "pg-broker", "url": "https://broker-2.example"},
					},
				}
			}
			_ = json.NewEncoder(w).Encode(body)
		case r.URL.Path == "/v3/service_offerings/offering-1":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":              "offering-1",
				"name":              "redis",
				"description":       "Key/value store",
				"available":         true,
				"shareable":         true,
				"tags":              []string{"db", "kv"},
				"requires":          []string{"syslog_drain"},
				"documentation_url": "https://docs.example/redis",
				"created_at":        "2024-01-01T00:00:00Z",
				"updated_at":        "2024-01-02T00:00:00Z",
				"broker_catalog": map[string]interface{}{
					"id": "bc-1",
					"metadata": map[string]interface{}{
						"longDescription": "Redis 7",
					},
				},
				"relationships": map[string]interface{}{
					"service_broker": map[string]interface{}{
						"data": map[string]interface{}{"guid": "broker-1"},
					},
				},
			})
		case r.URL.Path == "/v3/service_brokers":
			s.brokerHits++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 2, "total_pages": 1},
				"resources": []map[string]interface{}{
					{"guid": "broker-1", "name": "redis-broker", "url": "https://broker-1.example"},
					{"guid": "broker-2", "name": "pg-broker", "url": "https://broker-2.example"},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	return s
}

func newServiceOfferingPlugin(serverURL string) *CloudFoundrySpecification {
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

// listInvoke wires up echo.Context for the list handler with the given
// raw query string (no leading '?').
func listInvoke(plugin *CloudFoundrySpecification, query string) (*httptest.ResponseRecorder, error) {
	e := echo.New()
	url := "/pp/v1/cf/service_offerings/test-cnsi"
	if query != "" {
		url += "?" + query
	}
	req := httptest.NewRequest(http.MethodGet, url, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid")
	ctx.SetParamValues("test-cnsi")
	return rec, plugin.getNativeServiceOfferings(ctx)
}

// detailInvoke wires up the detail handler.
func detailInvoke(plugin *CloudFoundrySpecification, query string) (*httptest.ResponseRecorder, error) {
	e := echo.New()
	url := "/pp/v1/cf/service_offerings/test-cnsi/offering-1"
	if query != "" {
		url += "?" + query
	}
	req := httptest.NewRequest(http.MethodGet, url, nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "offeringGuid")
	ctx.SetParamValues("test-cnsi", "offering-1")
	return rec, plugin.getNativeServiceOfferingDetail(ctx)
}

// TestGetNativeServiceOfferings_Base asserts ?return=base (and the
// default no-?return=) emits guid+cnsiGuid+name+createdAt and nothing
// else. No broker fetch, no description/available/tags.
func TestGetNativeServiceOfferings_Base(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "return=base&per_page=25&page=1")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.listHits, "exactly one list call")
	assert.Equal(t, 0, srv.brokerHits, "base mode skips broker join")
	assert.NotContains(t, srv.lastListQuery, "include=", "base mode must not request include")

	var resp StratosPagedResponse[StServiceOffering]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	r0 := resp.Resources[0]
	assert.Equal(t, "offering-1", r0.GUID)
	assert.Equal(t, "test-cnsi", r0.CnsiGUID)
	assert.Equal(t, "redis", r0.Name)
	assert.NotEmpty(t, r0.CreatedAt)
	// All extended fields omitted at base.
	assert.Empty(t, r0.Description)
	assert.Nil(t, r0.Available)
	assert.Nil(t, r0.Shareable)
	assert.Nil(t, r0.Broker)
	assert.Empty(t, r0.Tags)
	assert.Empty(t, r0.Requires)
	assert.Empty(t, r0.DocumentationURL)
	assert.Empty(t, r0.BrokerCatalogMetadata)
}

// TestGetNativeServiceOfferings_DefaultIsBase asserts no ?return= falls
// back to ReturnBase (matches parseReturnMode's default).
func TestGetNativeServiceOfferings_DefaultIsBase(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, srv.brokerHits, "default mode is base — no broker fetch")

	var resp StratosPagedResponse[StServiceOffering]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	assert.Nil(t, resp.Resources[0].Broker)
	assert.Empty(t, resp.Resources[0].Description)
}

// TestGetNativeServiceOfferings_Summary asserts ?return=summary populates
// description, tags, available, and broker.{guid,name} but NOT details-tier
// fields (requires, documentationUrl, brokerCatalogMetadata, shareable, broker.URL).
func TestGetNativeServiceOfferings_Summary(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "return=summary&per_page=25&page=1")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.listHits, "exactly one list call")
	assert.Equal(t, 0, srv.brokerHits, "summary mode reads brokers from included; no second call")
	assert.Contains(t, srv.lastListQuery, "include=service_broker", "summary mode must request include")

	var resp StratosPagedResponse[StServiceOffering]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	r0 := resp.Resources[0]
	assert.Equal(t, "offering-1", r0.GUID)
	assert.Equal(t, "redis", r0.Name)
	assert.Equal(t, "Key/value store", r0.Description)
	assert.Equal(t, []string{"db", "kv"}, r0.Tags)
	require.NotNil(t, r0.Available)
	assert.True(t, *r0.Available)
	require.NotNil(t, r0.Broker)
	assert.Equal(t, "broker-1", r0.Broker.GUID)
	assert.Equal(t, "redis-broker", r0.Broker.Name)
	// Details-only fields stay empty at summary.
	assert.Empty(t, r0.Broker.URL)
	assert.Empty(t, r0.Requires)
	assert.Empty(t, r0.DocumentationURL)
	assert.Empty(t, r0.BrokerCatalogMetadata)
	assert.Nil(t, r0.Shareable)
}

// TestGetNativeServiceOfferings_Details asserts ?return=details deepens
// the summary shape with offering extended fields and a fully-populated
// broker ref (URL etc.).
func TestGetNativeServiceOfferings_Details(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "return=details&per_page=25&page=1")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, srv.brokerHits, "details mode reads brokers from included; no second call")
	assert.Contains(t, srv.lastListQuery, "include=service_broker")

	var resp StratosPagedResponse[StServiceOffering]
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Len(t, resp.Resources, 2)
	r0 := resp.Resources[0]
	require.NotNil(t, r0.Available)
	assert.True(t, *r0.Available)
	require.NotNil(t, r0.Shareable)
	assert.False(t, *r0.Shareable, "shareable surfaces at details tier (offering-1 fixture is shareable=false)")
	assert.Equal(t, []string{"syslog_drain"}, r0.Requires)
	require.NotNil(t, r0.BrokerCatalogMetadata)
	assert.Equal(t, "Redis 7", r0.BrokerCatalogMetadata["longDescription"])
	require.NotNil(t, r0.Broker)
	assert.Equal(t, "broker-1", r0.Broker.GUID)
	assert.Equal(t, "redis-broker", r0.Broker.Name)
	assert.Equal(t, "https://broker-1.example", r0.Broker.URL, "details mode expands broker URL")
}

// TestGetNativeServiceOfferings_PerPagePassthrough verifies per_page/page
// forward verbatim to the upstream call when present.
func TestGetNativeServiceOfferings_PerPagePassthrough(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "return=summary&per_page=25&page=2")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, srv.lastListQuery, "per_page=25")
	assert.Contains(t, srv.lastListQuery, "page=2")
}

// TestGetNativeServiceOfferings_OmitsPagingWhenAbsent asserts the upstream
// call carries no per_page/page when the caller omits them — keeps the
// passthrough true to the V3 default behaviour.
func TestGetNativeServiceOfferings_OmitsPagingWhenAbsent(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := listInvoke(plugin, "return=base")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.False(t, strings.Contains(srv.lastListQuery, "per_page="), "per_page must be absent on upstream when caller omits it")
	assert.False(t, strings.Contains(srv.lastListQuery, "page="), "page must be absent on upstream when caller omits it")
}

// TestGetNativeServiceOfferings_CountsFastPath uses the shared
// runCountsAssertion helper and the per_page=1 capture pattern.
func TestGetNativeServiceOfferings_CountsFastPath(t *testing.T) {
	srv, q := newCountsCapiServer(t, "/v3/service_offerings", 33)
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID:      "user-1",
			cnsiRecord:  api.CNSIRecord{GUID: "cnsi-1", APIEndpoint: mustParseURL(srv.URL)},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_offerings/cnsi-1?return=counts", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/service_offerings/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeServiceOfferings(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", q.PerPage)

	// Counts mode preserves the legacy flat envelope shape used by the
	// frontend counts probe — {resources: [], totalResults: N}.
	var resp struct {
		Resources    []StServiceOffering `json:"resources"`
		TotalResults int                 `json:"totalResults"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, 33, resp.TotalResults)
	assert.Empty(t, resp.Resources)
}

// TestGetNativeServiceOfferingDetail_Details asserts the single-resource
// endpoint at ?return=details emits a fully-expanded shape including the
// joined broker URL.
func TestGetNativeServiceOfferingDetail_Details(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := detailInvoke(plugin, "return=details")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 1, srv.brokerHits, "details mode runs the broker batch fetch")

	var resp StServiceOffering
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "offering-1", resp.GUID)
	assert.Equal(t, "redis", resp.Name)
	assert.Equal(t, "Key/value store", resp.Description)
	require.NotNil(t, resp.Available)
	assert.True(t, *resp.Available)
	require.NotNil(t, resp.Shareable)
	assert.True(t, *resp.Shareable, "detail fixture is shareable=true")
	assert.Equal(t, []string{"db", "kv"}, resp.Tags)
	assert.Equal(t, []string{"syslog_drain"}, resp.Requires)
	assert.Equal(t, "https://docs.example/redis", resp.DocumentationURL)
	require.NotNil(t, resp.BrokerCatalogMetadata)
	assert.Equal(t, "Redis 7", resp.BrokerCatalogMetadata["longDescription"])
	require.NotNil(t, resp.Broker)
	assert.Equal(t, "broker-1", resp.Broker.GUID)
	assert.Equal(t, "redis-broker", resp.Broker.Name)
	assert.Equal(t, "https://broker-1.example", resp.Broker.URL)
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
}

// TestGetNativeServiceOfferingDetail_Summary skips the URL field on the
// broker ref but still populates name.
func TestGetNativeServiceOfferingDetail_Summary(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := detailInvoke(plugin, "return=summary")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceOffering
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.NotNil(t, resp.Broker)
	assert.Equal(t, "redis-broker", resp.Broker.Name)
	assert.Empty(t, resp.Broker.URL, "summary tier omits broker.URL")
	assert.Nil(t, resp.Shareable)
	assert.Empty(t, resp.Requires)
	assert.Empty(t, resp.BrokerCatalogMetadata)
}

// TestGetNativeServiceOfferingDetail_Base emits only base fields on the
// single-resource path.
func TestGetNativeServiceOfferingDetail_Base(t *testing.T) {
	srv := newServiceOfferingTestServer(t)
	defer srv.Close()
	plugin := newServiceOfferingPlugin(srv.URL)

	rec, err := detailInvoke(plugin, "return=base")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, 0, srv.brokerHits, "base mode skips broker fetch on detail too")

	var resp StServiceOffering
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	assert.Equal(t, "offering-1", resp.GUID)
	assert.Nil(t, resp.Broker)
	assert.Nil(t, resp.Available)
	assert.Empty(t, resp.Description)
}
