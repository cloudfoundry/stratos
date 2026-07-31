package cloudfoundry

import "github.com/cloudfoundry/stratos/src/jetstream/api"

// rootEndpoints holds the CF endpoints discoverable from the unversioned
// root `/` links — the v3-only equivalent of the /v2/info fields.
type rootEndpoints struct {
	AuthorizationEndpoint  string
	TokenEndpoint          string
	DopplerLoggingEndpoint string
	RoutingEndpoint        string
	APIVersion             string
}

// deriveEndpointsFromRoot extracts the auth/uaa/logging/routing endpoints and
// the CC API version from the CF root `/` links. It is the fallback source used
// when /v2/info is absent or the V2 API is disabled, so endpoint registration
// and cf push remain functional on a v3-only foundation.
func deriveEndpointsFromRoot(root api.ApiRoot) rootEndpoints {
	return rootEndpoints{
		AuthorizationEndpoint:  root.Links.Login.Href,
		TokenEndpoint:          root.Links.Uaa.Href,
		DopplerLoggingEndpoint: root.Links.Logging.Href,
		RoutingEndpoint:        root.Links.Routing.Href,
		APIVersion:             root.Links.CloudControllerV3.Meta.Version,
	}
}

// backfillFromRoot populates the CNSI record's auth/token/doppler endpoints and
// the V2Info struct from the root `/` links when the V2 API is disabled or
// /v2/info is absent. When /v2/info proved v2 enabled (supportsV2), it remains
// the source of truth and this is a no-op so v2-enabled foundations keep their
// existing behavior. Fields root cannot supply (app_ssh_*, min_cli_version)
// are left as /v2/info served them — a v2-disabled foundation still populates
// those, and cfappssh depends on them.
func backfillFromRoot(newCNSI *api.CNSIRecord, v2Info *api.V2Info, root api.ApiRoot, supportsV2 bool) {
	if supportsV2 {
		return
	}

	ep := deriveEndpointsFromRoot(root)

	newCNSI.AuthorizationEndpoint = ep.AuthorizationEndpoint
	newCNSI.TokenEndpoint = ep.TokenEndpoint
	newCNSI.DopplerLoggingEndpoint = ep.DopplerLoggingEndpoint

	v2Info.AuthorizationEndpoint = ep.AuthorizationEndpoint
	v2Info.TokenEndpoint = ep.TokenEndpoint
	v2Info.DopplerLoggingEndpoint = ep.DopplerLoggingEndpoint
	v2Info.RoutingEndpoint = ep.RoutingEndpoint
	v2Info.APIVersion = ep.APIVersion
}
