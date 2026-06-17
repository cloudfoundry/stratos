package cloudfoundry

import (
	"encoding/json"
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// A v3-only CF (V2 API disabled) still exposes auth/uaa/logging/routing and
// the CC API version through the unversioned root `/` links. deriveEndpointsFromRoot
// must read them so registration + push work without /v2/info.
func TestDeriveEndpointsFromRoot_V3OnlyLinks(t *testing.T) {
	rootJSON := `{
		"links": {
			"cloud_controller_v3": {"href": "https://cf.example.com/v3", "meta": {"version": "3.180.0"}},
			"login":     {"href": "https://login.example.com"},
			"uaa":       {"href": "https://uaa.example.com"},
			"logging":   {"href": "wss://doppler.example.com:443"},
			"routing":   {"href": "https://cf.example.com/routing"},
			"log_cache": {"href": "https://log-cache.example.com"}
		}
	}`
	var root api.ApiRoot
	require.NoError(t, json.Unmarshal([]byte(rootJSON), &root))

	ep := deriveEndpointsFromRoot(root)

	assert.Equal(t, "https://login.example.com", ep.AuthorizationEndpoint)
	assert.Equal(t, "https://uaa.example.com", ep.TokenEndpoint)
	assert.Equal(t, "wss://doppler.example.com:443", ep.DopplerLoggingEndpoint)
	assert.Equal(t, "https://cf.example.com/routing", ep.RoutingEndpoint)
	assert.Equal(t, "3.180.0", ep.APIVersion)
}

// When the root carries no auth links (pre-targeting / unreachable), the
// derived endpoints are empty rather than panicking.
func TestDeriveEndpointsFromRoot_EmptyLinks(t *testing.T) {
	var root api.ApiRoot
	require.NoError(t, json.Unmarshal([]byte(`{"links":{}}`), &root))

	ep := deriveEndpointsFromRoot(root)

	assert.Empty(t, ep.AuthorizationEndpoint)
	assert.Empty(t, ep.TokenEndpoint)
	assert.Empty(t, ep.APIVersion)
}

// On a v3-only CF (/v2/info absent → supportsV2 false), backfillFromRoot fills
// the CNSI record's token/auth endpoints (needed for token refresh) and the
// V2Info struct (consumed by cfapppush) from the root links.
func TestBackfillFromRoot_V3OnlyPopulatesCNSIAndV2Info(t *testing.T) {
	var root api.ApiRoot
	require.NoError(t, json.Unmarshal([]byte(`{"links":{
		"cloud_controller_v3": {"href": "https://cf.example.com/v3", "meta": {"version": "3.180.0"}},
		"login":   {"href": "https://login.example.com"},
		"uaa":     {"href": "https://uaa.example.com"},
		"logging": {"href": "wss://doppler.example.com:443"},
		"routing": {"href": "https://cf.example.com/routing"}
	}}`), &root))

	var cnsi api.CNSIRecord
	var v2 api.V2Info
	backfillFromRoot(&cnsi, &v2, root, false /* supportsV2 */)

	assert.Equal(t, "https://login.example.com", cnsi.AuthorizationEndpoint)
	assert.Equal(t, "https://uaa.example.com", cnsi.TokenEndpoint)
	assert.Equal(t, "wss://doppler.example.com:443", cnsi.DopplerLoggingEndpoint)
	assert.Equal(t, "https://login.example.com", v2.AuthorizationEndpoint)
	assert.Equal(t, "https://uaa.example.com", v2.TokenEndpoint)
	assert.Equal(t, "https://cf.example.com/routing", v2.RoutingEndpoint)
	assert.Equal(t, "3.180.0", v2.APIVersion)
}

// When /v2/info responded (supportsV2 true), it stays the source of truth —
// backfillFromRoot must not clobber the V2-supplied endpoints with root links.
func TestBackfillFromRoot_V2PresentDoesNotOverwrite(t *testing.T) {
	var root api.ApiRoot
	require.NoError(t, json.Unmarshal([]byte(`{"links":{"login":{"href":"https://root-login.example.com"}}}`), &root))

	cnsi := api.CNSIRecord{AuthorizationEndpoint: "https://v2-auth.example.com"}
	v2 := api.V2Info{AuthorizationEndpoint: "https://v2-auth.example.com"}
	backfillFromRoot(&cnsi, &v2, root, true /* supportsV2 */)

	assert.Equal(t, "https://v2-auth.example.com", cnsi.AuthorizationEndpoint)
	assert.Equal(t, "https://v2-auth.example.com", v2.AuthorizationEndpoint)
}
