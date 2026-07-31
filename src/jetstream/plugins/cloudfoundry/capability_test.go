package cloudfoundry

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// capabilityProbeProxy satisfies api.PortalProxy for Info() /
// confirmCapabilityMetadata tests by embedding the interface — only the two
// methods those paths call are implemented; anything else panics, which is
// the desired failure mode for a probe test reaching further than expected.
type capabilityProbeProxy struct {
	api.PortalProxy
	updatedMetadata map[string]string
}

func (p *capabilityProbeProxy) GetHttpClient(_ bool, _ string) http.Client {
	return *http.DefaultClient
}

func (p *capabilityProbeProxy) UpdateEndpointMetadata(guid string, metadata string) error {
	if p.updatedMetadata == nil {
		p.updatedMetadata = map[string]string{}
	}
	p.updatedMetadata[guid] = metadata
	return nil
}

// v2-disabled foundation, per cloud_controller_ng#4280: /v2/info stays up and
// returns 200 with every endpoint field populated; only api_version is blanked
// (plus support carrying the disabled marker). The endpoint values deliberately
// differ from the root-link values below so assertions can tell which source
// each field came from.
const v2DisabledInfoJSON = `{
	"name": "",
	"support": "CF API v2 is disabled",
	"authorization_endpoint": "https://v2-login.example.com",
	"token_endpoint": "https://v2-uaa.example.com",
	"min_cli_version": "6.23.0",
	"app_ssh_endpoint": "ssh.example.com:2222",
	"app_ssh_host_key_fingerprint": "aa:bb:cc:dd",
	"app_ssh_oauth_client": "ssh-proxy",
	"doppler_logging_endpoint": "wss://v2-doppler.example.com:443",
	"routing_endpoint": "https://v2-api.example.com/routing",
	"api_version": ""
}`

const v2EnabledInfoJSON = `{
	"authorization_endpoint": "https://v2-login.example.com",
	"token_endpoint": "https://v2-uaa.example.com",
	"min_cli_version": "6.23.0",
	"app_ssh_endpoint": "ssh.example.com:2222",
	"app_ssh_host_key_fingerprint": "aa:bb:cc:dd",
	"app_ssh_oauth_client": "ssh-proxy",
	"doppler_logging_endpoint": "wss://v2-doppler.example.com:443",
	"routing_endpoint": "https://v2-api.example.com/routing",
	"api_version": "2.264.0"
}`

const rootLinksJSON = `{
	"links": {
		"cloud_controller_v3": {"href": "https://api.example.com/v3", "meta": {"version": "3.195.0"}},
		"login":     {"href": "https://root-login.example.com"},
		"uaa":       {"href": "https://root-uaa.example.com"},
		"logging":   {"href": "wss://root-doppler.example.com:443"},
		"routing":   {"href": "https://root-api.example.com/routing"},
		"log_cache": {"href": "https://log-cache.example.com"}
	}
}`

const v3InfoJSON = `{
	"links": {"self": {"href": "https://api.example.com/v3/info"}}
}`

// newCFServer serves a fake CF API: the root document, /v3/info, and whatever
// /v2/info body the test supplies (empty string → 404, the pre-#4280 shape).
func newCFServer(t *testing.T, v2InfoBody string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/":
			_, _ = w.Write([]byte(rootLinksJSON))
		case "/v2/info":
			if v2InfoBody == "" {
				http.NotFound(w, r)
				return
			}
			_, _ = w.Write([]byte(v2InfoBody))
		case "/v3/info":
			_, _ = w.Write([]byte(v3InfoJSON))
		default:
			http.NotFound(w, r)
		}
	}))
}

func decodeMetadata(t *testing.T, raw string) api.CFEndpointMetadata {
	t.Helper()
	var m api.CFEndpointMetadata
	require.NoError(t, json.Unmarshal([]byte(raw), &m))
	return m
}

// On a v2-disabled foundation /v2/info answers 200 with a populated
// authorization_endpoint and api_version:"" — the probe must read that as
// v2 OFF, while still keeping the served body for the fields (app_ssh_*,
// min_cli_version) that the root document cannot supply.
func TestInfo_V2DisabledFoundation(t *testing.T) {
	ts := newCFServer(t, v2DisabledInfoJSON)
	defer ts.Close()

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(ts.URL, true, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	assert.False(t, meta.SupportsV2, "v2-disabled foundation must not register as SupportsV2")
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)

	// backfillFromRoot must have run: version + endpoints come from root links
	assert.Equal(t, "3.195.0", endpointInfo.V2Info.APIVersion)
	assert.Equal(t, "https://root-login.example.com", cnsi.AuthorizationEndpoint)
	assert.Equal(t, "https://root-uaa.example.com", cnsi.TokenEndpoint)
	assert.Equal(t, "wss://root-doppler.example.com:443", cnsi.DopplerLoggingEndpoint)
	assert.Equal(t, "https://root-login.example.com", endpointInfo.V2Info.AuthorizationEndpoint)
	assert.Equal(t, "https://root-uaa.example.com", endpointInfo.V2Info.TokenEndpoint)
	assert.Equal(t, "https://root-api.example.com/routing", endpointInfo.V2Info.RoutingEndpoint)

	// ...while the fields only /v2/info carries survive from the served body
	assert.Equal(t, "ssh.example.com:2222", endpointInfo.V2Info.AppSSHEndpoint)
	assert.Equal(t, "ssh-proxy", endpointInfo.V2Info.AppSSHOauthCLient)
	assert.Equal(t, "aa:bb:cc:dd", endpointInfo.V2Info.AppSSHHostKeyFingerprint)
	assert.Equal(t, "6.23.0", endpointInfo.V2Info.MinCLIVersion)
}

// A v2-enabled foundation (api_version populated) keeps today's behaviour:
// SupportsV2, and /v2/info stays the source of truth for every field.
func TestInfo_V2EnabledFoundation(t *testing.T) {
	ts := newCFServer(t, v2EnabledInfoJSON)
	defer ts.Close()

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(ts.URL, true, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	assert.True(t, meta.SupportsV2)
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)

	assert.Equal(t, "2.264.0", endpointInfo.V2Info.APIVersion)
	assert.Equal(t, "https://v2-login.example.com", cnsi.AuthorizationEndpoint)
	assert.Equal(t, "https://v2-uaa.example.com", cnsi.TokenEndpoint)
	assert.Equal(t, "wss://v2-doppler.example.com:443", cnsi.DopplerLoggingEndpoint)
	assert.Equal(t, "https://v2-login.example.com", endpointInfo.V2Info.AuthorizationEndpoint)
	assert.Equal(t, "https://v2-api.example.com/routing", endpointInfo.V2Info.RoutingEndpoint)
}

// Pre-#4280 shape: /v2/info genuinely 404s. Same observable outcome as
// v2-disabled except the /v2/info-only fields are unavailable.
func TestInfo_V2InfoAbsent(t *testing.T) {
	ts := newCFServer(t, "")
	defer ts.Close()

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(ts.URL, true, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	assert.False(t, meta.SupportsV2)
	assert.True(t, meta.SupportsV3)

	assert.Equal(t, "3.195.0", endpointInfo.V2Info.APIVersion)
	assert.Equal(t, "https://root-login.example.com", cnsi.AuthorizationEndpoint)
	assert.Empty(t, endpointInfo.V2Info.AppSSHEndpoint)
}

// When the root document answers but both info probes fail, Info() assumes v2
// with Assumed=true. An assumed v2 is not a proven v2: the backfill must still
// run so the CNSI record registers with the root-link endpoints instead of
// nothing, and the connect-time re-probe can correct the flags later.
func TestInfo_ProbesInconclusiveBackfillsFromRoot(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(rootLinksJSON))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(ts.URL, true, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	assert.True(t, meta.Assumed)
	assert.True(t, meta.SupportsV2)

	assert.Equal(t, "https://root-login.example.com", cnsi.AuthorizationEndpoint)
	assert.Equal(t, "https://root-uaa.example.com", cnsi.TokenEndpoint)
	assert.Equal(t, "3.195.0", endpointInfo.V2Info.APIVersion)
}

// confirmCapabilityMetadata re-probes independently of Info() and must reach
// the same conclusion on a v2-disabled foundation.
func TestConfirmCapabilityMetadata_V2DisabledFoundation(t *testing.T) {
	ts := newCFServer(t, v2DisabledInfoJSON)
	defer ts.Close()

	assumed, err := json.Marshal(api.CFEndpointMetadata{SupportsV2: true, Assumed: true})
	require.NoError(t, err)
	apiURL, err := url.Parse(ts.URL)
	require.NoError(t, err)

	proxy := &capabilityProbeProxy{}
	c := &CloudFoundrySpecification{portalProxy: proxy, endpointType: "cf"}
	c.confirmCapabilityMetadata(api.CNSIRecord{
		GUID:        "cnsi-guid",
		APIEndpoint: apiURL,
		Metadata:    string(assumed),
	})

	require.Contains(t, proxy.updatedMetadata, "cnsi-guid")
	meta := decodeMetadata(t, proxy.updatedMetadata["cnsi-guid"])
	assert.False(t, meta.SupportsV2, "re-probe must not confirm SupportsV2 on a v2-disabled foundation")
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)
}
