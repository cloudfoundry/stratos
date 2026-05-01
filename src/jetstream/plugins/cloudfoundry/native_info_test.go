// src/jetstream/plugins/cloudfoundry/native_info_test.go
package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetNativeCFInfo_HappyPath verifies the handler issues GET /v3/info
// and GET /v3/ on the target CF and projects the response into Stratos
// shape (camelCase keys, flattened root links).
func TestGetNativeCFInfo_HappyPath(t *testing.T) {
	var infoCalls, rootCalls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/v3":
			// cfclient.NewWithToken probes /v3 on init for FetchAPILinksOnInit;
			// the response shape doesn't matter for this test.
			_, _ = w.Write([]byte(`{"links":{}}`))
		case "/":
			// fetchAPIRoot hits / — the unversioned root that returns
			// auth, SSH (with meta), logging, and v2/v3 dispatch links.
			rootCalls++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"links": map[string]interface{}{
					"self": map[string]interface{}{"href": "https://cf.example.com"},
					"cloud_controller_v3": map[string]interface{}{
						"href": "https://cf.example.com/v3",
						"meta": map[string]string{"version": "3.180.0"},
					},
					"login":   map[string]interface{}{"href": "https://login.example.com"},
					"uaa":     map[string]interface{}{"href": "https://uaa.example.com"},
					"logging": map[string]interface{}{"href": "wss://doppler.example.com:443"},
					"routing": map[string]interface{}{"href": "https://cf.example.com/routing"},
					"app_ssh": map[string]interface{}{
						"href": "ssh.example.com:2222",
						"meta": map[string]string{
							"host_key_fingerprint": "AAAA-FINGERPRINT-BBBB",
							"oauth_client":         "ssh-proxy",
						},
					},
				},
			})
		case "/v3/info":
			infoCalls++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"build":       "cf-genesis-kit v2.6.0",
				"name":        "Cloud Foundry (adept-ivy-dev)",
				"description": "Use `genesis info` on environment file",
				"version":     44,
				"cli_version": map[string]string{
					"minimum":     "6.23.0",
					"recommended": "6.23.0",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{
			userID: "user-1",
			cnsiRecord: api.CNSIRecord{
				GUID:        "cnsi-1",
				APIEndpoint: mustParseURL(srv.URL),
			},
			tokenRecord: api.TokenRecord{AuthToken: "test-token"},
		},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/info/cnsi-1", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/info/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("cnsi-1")

	require.NoError(t, plugin.getNativeCFInfo(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "1", rec.Header().Get("X-Stratos-Schema-Version"))
	// cfclient.NewWithToken probes /v3 once on init, plus our explicit call → 2.
	assert.GreaterOrEqual(t, rootCalls, 1)
	assert.Equal(t, 1, infoCalls)

	var body StratosCFInfo
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, "Cloud Foundry (adept-ivy-dev)", body.Name)
	assert.Equal(t, "cf-genesis-kit v2.6.0", body.Build)
	assert.Equal(t, "Use `genesis info` on environment file", body.Description)
	assert.Equal(t, 44, body.Version)
	assert.Equal(t, "6.23.0", body.MinCLIVersion)
	assert.Equal(t, "6.23.0", body.RecommendedCLIVersion)
	assert.Equal(t, "https://cf.example.com/v3", body.Links["cloud_controller_v3"])
	assert.Equal(t, "ssh.example.com:2222", body.Links["app_ssh"])
	assert.Equal(t, "wss://doppler.example.com:443", body.Links["logging"])

	// Promoted top-level fields (V2Info parity from / root meta).
	assert.Equal(t, "3.180.0", body.APIVersion)
	assert.Equal(t, "https://login.example.com", body.AuthorizationEndpoint)
	assert.Equal(t, "https://uaa.example.com", body.TokenEndpoint)
	assert.Equal(t, "wss://doppler.example.com:443", body.DopplerLoggingEndpoint)
	assert.Equal(t, "https://cf.example.com/routing", body.RoutingEndpoint)
	assert.Equal(t, "ssh.example.com:2222", body.AppSSHEndpoint)
	assert.Equal(t, "AAAA-FINGERPRINT-BBBB", body.AppSSHHostKeyFingerprint)
	assert.Equal(t, "ssh-proxy", body.AppSSHOauthClient)
}

// TestGetNativeCFInfo_RejectsMissingCnsiGuid guards the param validation
// at the handler boundary.
func TestGetNativeCFInfo_RejectsMissingCnsiGuid(t *testing.T) {
	plugin := &CloudFoundrySpecification{
		testProxy: &mockNativeCFProxy{userID: "user-1"},
	}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/cf/info/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/cf/info/:cnsiGuid")
	c.SetParamNames("cnsiGuid")
	c.SetParamValues("")

	err := plugin.getNativeCFInfo(c)
	require.Error(t, err)
	httpErr, ok := err.(*echo.HTTPError)
	require.True(t, ok)
	assert.Equal(t, http.StatusBadRequest, httpErr.Code)
}

// TestFlattenLinks_DropsMethodAndHandlesEmpty checks the link projection
// helper: drops the `method` sub-field, returns nil for empty input,
// preserves the href under each key.
func TestFlattenLinks_DropsMethodAndHandlesEmpty(t *testing.T) {
	assert.Nil(t, flattenLinks(nil))

	out := flattenLinks(capi.Links{
		"apps":    {Href: "https://cf.example.com/v3/apps", Method: "GET"},
		"app_ssh": {Href: "ssh.example.com:2222"},
	})
	assert.Equal(t, "https://cf.example.com/v3/apps", out["apps"])
	assert.Equal(t, "ssh.example.com:2222", out["app_ssh"])
}
