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
type mockNativeCFProxy struct {
	userID      string
	cnsiRecord  api.CNSIRecord
	tokenRecord api.TokenRecord
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

	var resp StOrgsResponse
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, 1, resp.TotalResults)
	assert.Len(t, resp.Resources, 1)
	assert.Equal(t, "org-guid-1", resp.Resources[0].GUID)
	assert.Equal(t, "My Org", resp.Resources[0].Name)
	assert.Equal(t, "active", resp.Resources[0].Status)
	assert.Equal(t, "prod", resp.Resources[0].Labels["env"])
}
