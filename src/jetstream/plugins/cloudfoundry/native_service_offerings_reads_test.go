// src/jetstream/plugins/cloudfoundry/native_service_offerings_reads_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func serviceOfferingDetailTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/v3/service_offerings/offering-99":
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"guid":              "offering-99",
				"name":              "premium-db",
				"description":       "Premium database offering",
				"available":         true,
				"tags":              []string{"db", "sql"},
				"documentation_url": "https://docs.example/premium-db",
				"created_at":        "2024-01-01T00:00:00Z",
				"updated_at":        "2024-01-02T00:00:00Z",
				"broker_catalog": map[string]interface{}{
					"id": "broker-catalog-id-123",
					"metadata": map[string]interface{}{
						"longDescription":      "Premium database with SLA guarantees",
						"providerDisplayName":  "Premium Co",
						"supportUrl":           "https://support.example",
					},
					"features": map[string]interface{}{},
				},
				"relationships": map[string]interface{}{
					"service_broker": map[string]interface{}{
						"data": map[string]interface{}{"guid": "broker-7"},
					},
				},
			})
		case "/v3/service_brokers":
			// Batch broker fetch for the join — return broker-7 with a name.
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"pagination": map[string]interface{}{"total_results": 1, "total_pages": 1},
				"resources": []map[string]interface{}{
					{
						"guid": "broker-7",
						"name": "premium-broker",
						"url":  "https://broker-7.example",
					},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
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

func TestGetNativeServiceOfferingDetail(t *testing.T) {
	ts := serviceOfferingDetailTestServer(t)
	defer ts.Close()

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/service_offerings/test-cnsi/offering-99", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.SetParamNames("cnsiGuid", "offeringGuid")
	ctx.SetParamValues("test-cnsi", "offering-99")
	plugin := newServiceOfferingPlugin(ts.URL)

	require.NoError(t, plugin.getNativeServiceOfferingDetail(ctx))
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp StServiceOffering
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))

	assert.Equal(t, "offering-99", resp.GUID)
	assert.Equal(t, "premium-db", resp.Name)
	assert.Equal(t, "Premium database offering", resp.Description)
	assert.Equal(t, "premium-broker", resp.BrokerName, "detail endpoint should join the broker name like the list does")
	assert.Equal(t, "broker-7", resp.ServiceBrokerGUID, "broker guid surfaced for navigation/extra lookups")
	assert.Equal(t, "https://docs.example/premium-db", resp.DocumentationURL)
	require.NotNil(t, resp.BrokerCatalogMetadata)
	assert.Equal(t, "Premium database with SLA guarantees", resp.BrokerCatalogMetadata["longDescription"])
	assert.Equal(t, "Premium Co", resp.BrokerCatalogMetadata["providerDisplayName"])
	assert.Equal(t, "https://support.example", resp.BrokerCatalogMetadata["supportUrl"])
	assert.Equal(t, "test-cnsi", resp.CnsiGUID)
	assert.True(t, resp.Public)
}
