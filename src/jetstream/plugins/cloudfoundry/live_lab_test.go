package cloudfoundry

// Live-foundation verification for endpoint capability detection (#5727).
// These exercise the real Info() and confirmCapabilityMetadata against an
// actual Cloud Foundry rather than a hand-built payload, because the defect
// they cover — a v2-disabled foundation still serving a 200 from /v2/info —
// was not reproducible from fixtures alone.
//
// Every test skips unless its foundation is named, so a normal `go test` run
// is unaffected:
//
//	STRATOS_LIVE_CF=https://api.<foundation>        v2-enabled, no behaviour change
//	STRATOS_LIVE_CF_V2OFF=https://api.<foundation>  genuinely v2-disabled
//
// Assertions are derived from what the foundation actually advertises, so
// these run against any foundation, not a particular lab.

import (
	"crypto/tls"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// insecureProbeProxy is capabilityProbeProxy with a TLS-skipping client for
// lab foundations on self-signed certs.
type insecureProbeProxy struct {
	capabilityProbeProxy
}

func (p *insecureProbeProxy) GetHttpClient(_ bool, _ string) http.Client {
	// #nosec G402 -- test-only: lab foundations run self-signed certs and this
	// client is reachable solely from a test whose env var names the target.
	return http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}}
}

// TestLiveLabV2DisabledFoundation runs the real Info() + re-probe against a
// genuine v2-disabled foundation named in STRATOS_LIVE_CF_V2OFF — the exact
// defect scenario of #5727, no simulation.
func TestLiveLabV2DisabledFoundation(t *testing.T) {
	target := os.Getenv("STRATOS_LIVE_CF_V2OFF")
	if target == "" {
		t.Skip("STRATOS_LIVE_CF_V2OFF not set")
	}

	c := &CloudFoundrySpecification{portalProxy: &insecureProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(target, true, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	v2 := endpointInfo.V2Info
	t.Logf("metadata: supportsV2=%v supportsV3=%v assumed=%v", meta.SupportsV2, meta.SupportsV3, meta.Assumed)
	t.Logf("cnsi: auth=%q token=%q doppler=%q", cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint, cnsi.DopplerLoggingEndpoint)
	t.Logf("v2info: apiVersion=%q auth=%q routing=%q", v2.APIVersion, v2.AuthorizationEndpoint, v2.RoutingEndpoint)
	t.Logf("v2info ssh: endpoint=%q oauthClient=%q fingerprint=%q minCLI=%q", v2.AppSSHEndpoint, v2.AppSSHOauthCLient, v2.AppSSHHostKeyFingerprint, v2.MinCLIVersion)

	assert.False(t, meta.SupportsV2, "a live v2-disabled foundation must not register as SupportsV2")
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)

	// cf push depends on this: version backfilled from root links
	assert.True(t, strings.HasPrefix(v2.APIVersion, "3."), "APIVersion %q should be the CC v3 meta version", v2.APIVersion)

	// registration + auth depend on these
	assert.NotEmpty(t, cnsi.AuthorizationEndpoint)
	assert.NotEmpty(t, cnsi.TokenEndpoint)
	assert.NotEmpty(t, cnsi.DopplerLoggingEndpoint)

	// app SSH depends on these surviving from the still-served /v2/info body
	assert.NotEmpty(t, v2.AppSSHEndpoint)
	assert.NotEmpty(t, v2.AppSSHOauthCLient)
	assert.NotEmpty(t, v2.AppSSHHostKeyFingerprint)

	// connect-time re-probe must agree
	apiURL, err := url.Parse(target)
	require.NoError(t, err)
	assumed, err := json.Marshal(api.CFEndpointMetadata{SupportsV2: true, Assumed: true})
	require.NoError(t, err)
	proxy := &insecureProbeProxy{}
	c2 := &CloudFoundrySpecification{portalProxy: proxy, endpointType: "cf"}
	c2.confirmCapabilityMetadata(api.CNSIRecord{GUID: "live-v2off", APIEndpoint: apiURL, Metadata: string(assumed)})
	require.Contains(t, proxy.updatedMetadata, "live-v2off")
	confirmed := decodeMetadata(t, proxy.updatedMetadata["live-v2off"])
	t.Logf("confirm re-probe: supportsV2=%v supportsV3=%v", confirmed.SupportsV2, confirmed.SupportsV3)
	assert.False(t, confirmed.SupportsV2)
	assert.True(t, confirmed.SupportsV3)
}

func TestLiveLabInfo(t *testing.T) {
	target := os.Getenv("STRATOS_LIVE_CF")
	if target == "" {
		t.Skip("STRATOS_LIVE_CF not set")
	}

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(target, false, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	t.Logf("metadata: supportsV2=%v supportsV3=%v assumed=%v", meta.SupportsV2, meta.SupportsV3, meta.Assumed)
	t.Logf("cnsi: auth=%q token=%q doppler=%q", cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint, cnsi.DopplerLoggingEndpoint)
	v2 := endpointInfo.V2Info
	t.Logf("v2info: apiVersion=%q auth=%q token=%q doppler=%q routing=%q", v2.APIVersion, v2.AuthorizationEndpoint, v2.TokenEndpoint, v2.DopplerLoggingEndpoint, v2.RoutingEndpoint)
	t.Logf("v2info ssh: endpoint=%q oauthClient=%q fingerprint=%q minCLI=%q", v2.AppSSHEndpoint, v2.AppSSHOauthCLient, v2.AppSSHHostKeyFingerprint, v2.MinCLIVersion)

	// This lab foundation serves a populated api_version — v2 enabled — so the
	// fix must produce no behaviour change: /v2/info stays the source of truth.
	assert.True(t, meta.SupportsV2)
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)
	assert.NotEmpty(t, v2.APIVersion)
	assert.NotEmpty(t, cnsi.AuthorizationEndpoint)
	assert.NotEmpty(t, cnsi.TokenEndpoint)
	assert.NotEmpty(t, v2.AppSSHEndpoint)
	assert.NotEmpty(t, v2.AppSSHOauthCLient)
	assert.NotEmpty(t, v2.AppSSHHostKeyFingerprint)

	// The connect-time re-probe must agree with registration.
	apiURL, err := url.Parse(target)
	require.NoError(t, err)
	assumed, err := json.Marshal(api.CFEndpointMetadata{SupportsV2: true, Assumed: true})
	require.NoError(t, err)
	proxy := &capabilityProbeProxy{}
	c2 := &CloudFoundrySpecification{portalProxy: proxy, endpointType: "cf"}
	c2.confirmCapabilityMetadata(api.CNSIRecord{GUID: "live-lab", APIEndpoint: apiURL, Metadata: string(assumed)})
	require.Contains(t, proxy.updatedMetadata, "live-lab")
	confirmed := decodeMetadata(t, proxy.updatedMetadata["live-lab"])
	t.Logf("confirm re-probe: supportsV2=%v supportsV3=%v", confirmed.SupportsV2, confirmed.SupportsV3)
	assert.Equal(t, meta.SupportsV2, confirmed.SupportsV2)
	assert.Equal(t, meta.SupportsV3, confirmed.SupportsV3)
}

// linkHref reads links.<name>.href from a root document.
func linkHref(t *testing.T, root map[string]interface{}, name string) string {
	t.Helper()
	links, ok := root["links"].(map[string]interface{})
	require.True(t, ok, "root document has no links")
	link, ok := links[name].(map[string]interface{})
	require.True(t, ok, "root links have no %s", name)
	href, _ := link["href"].(string)
	return href
}

// linkMeta reads links.<name>.meta.<field> from a root document.
func linkMeta(t *testing.T, root map[string]interface{}, name, field string) string {
	t.Helper()
	links, ok := root["links"].(map[string]interface{})
	require.True(t, ok, "root document has no links")
	link, ok := links[name].(map[string]interface{})
	require.True(t, ok, "root links have no %s", name)
	meta, ok := link["meta"].(map[string]interface{})
	require.True(t, ok, "%s link has no meta", name)
	value, _ := meta[field].(string)
	return value
}

// TestLiveLabInfoV2Disabled replays the lab foundation's real payloads through
// a local rewrite proxy that applies exactly the cloud_controller_ng#4280
// v2-disabled transform: /v2/info keeps 200 and every field except
// api_version:"" + support marker; the root document loses cloud_controller_v2.
// This exercises the defect scenario of #5727 with real-world payload shapes.
func TestLiveLabInfoV2Disabled(t *testing.T) {
	target := os.Getenv("STRATOS_LIVE_CF")
	if target == "" {
		t.Skip("STRATOS_LIVE_CF not set")
	}

	fetch := func(path string) map[string]interface{} {
		// #nosec G704 -- test-only: the URL is the foundation the operator
		// named in STRATOS_LIVE_CF, which is the whole point of the test; it is
		// not attacker-controlled input reaching a server.
		res, err := http.Get(target + path)
		require.NoError(t, err)
		defer func() { _ = res.Body.Close() }()
		require.Equal(t, 200, res.StatusCode)
		raw, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		var doc map[string]interface{}
		require.NoError(t, json.Unmarshal(raw, &doc))
		return doc
	}

	rootDoc := fetch("/")
	v2Doc := fetch("/v2/info")
	v3Doc := fetch("/v3/info")

	// What the foundation itself advertises, captured before the transform —
	// backfillFromRoot sources exactly these, so asserting against them keeps
	// the test true of any foundation rather than one lab's values.
	wantVersion := linkMeta(t, rootDoc, "cloud_controller_v3", "version")
	wantAuth := linkHref(t, rootDoc, "login")
	wantToken := linkHref(t, rootDoc, "uaa")
	wantSSH, _ := v2Doc["app_ssh_endpoint"].(string)
	wantSSHClient, _ := v2Doc["app_ssh_oauth_client"].(string)

	// Without this the comparisons below could pass by both sides being empty,
	// which would assert nothing at all.
	require.NotEmpty(t, wantVersion, "root must advertise a cloud_controller_v3 meta version")
	require.NotEmpty(t, wantAuth, "root must advertise a login link")
	require.NotEmpty(t, wantToken, "root must advertise a uaa link")
	require.NotEmpty(t, wantSSH, "/v2/info must carry app_ssh_endpoint")
	require.NotEmpty(t, wantSSHClient, "/v2/info must carry app_ssh_oauth_client")

	// The #4280 transform
	v2Doc["api_version"] = ""
	v2Doc["support"] = "CF API v2 is disabled"
	if links, ok := rootDoc["links"].(map[string]interface{}); ok {
		delete(links, "cloud_controller_v2")
	}

	proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/":
			_ = json.NewEncoder(w).Encode(rootDoc)
		case "/v2/info":
			_ = json.NewEncoder(w).Encode(v2Doc)
		case "/v3/info":
			_ = json.NewEncoder(w).Encode(v3Doc)
		default:
			http.NotFound(w, r)
		}
	}))
	defer proxy.Close()

	c := &CloudFoundrySpecification{portalProxy: &capabilityProbeProxy{}, endpointType: "cf"}
	cnsi, rawInfo, err := c.Info(proxy.URL, false, "")
	require.NoError(t, err)
	endpointInfo, ok := rawInfo.(api.EndpointInfo)
	require.True(t, ok)

	meta := decodeMetadata(t, cnsi.Metadata)
	v2 := endpointInfo.V2Info
	t.Logf("metadata: supportsV2=%v supportsV3=%v assumed=%v", meta.SupportsV2, meta.SupportsV3, meta.Assumed)
	t.Logf("cnsi: auth=%q token=%q", cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint)
	t.Logf("v2info: apiVersion=%q ssh=%q oauthClient=%q fingerprint=%q", v2.APIVersion, v2.AppSSHEndpoint, v2.AppSSHOauthCLient, v2.AppSSHHostKeyFingerprint)

	assert.False(t, meta.SupportsV2, "real payload with blanked api_version must read as v2 OFF")
	assert.True(t, meta.SupportsV3)
	assert.False(t, meta.Assumed)

	// Version + endpoints backfilled from the real root links
	assert.Equal(t, wantVersion, v2.APIVersion)
	assert.Equal(t, wantAuth, cnsi.AuthorizationEndpoint)
	assert.Equal(t, wantToken, cnsi.TokenEndpoint)

	// SSH fields survive from the still-served /v2/info body
	assert.Equal(t, wantSSH, v2.AppSSHEndpoint)
	assert.Equal(t, wantSSHClient, v2.AppSSHOauthCLient)
	assert.NotEmpty(t, v2.AppSSHHostKeyFingerprint)
}
