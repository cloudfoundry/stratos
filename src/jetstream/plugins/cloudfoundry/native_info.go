// src/jetstream/plugins/cloudfoundry/native_info.go
//
// V3-native CF info handler. Returns the data the frontend's CF Summary
// card needs, sourced from CF v3 only:
//
//   - /v3/info  → name, build, description, version, cli_version
//   - /         → unversioned API root with auth/uaa/logging/routing/SSH
//                 links plus per-link `meta` (host_key_fingerprint,
//                 oauth_client, cloud_controller_v3 semver)
//
// Replaces the legacy /pp/v1/proxy/v2/info passthrough from the
// frontend's cloud-foundry.effects.ts. The wire shape is preserved
// (snake_case, V2Info-equivalent fields) so consumers don't change.
package cloudfoundry

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
)

// StratosCFInfo is the JSON the /pp/v1/cf/info/{cnsiGuid} handler returns.
// Field names mirror the legacy /v2/info wire shape (snake_case) so the
// frontend cutover is a pure URL swap — existing consumers continue to
// read api_version, app_ssh_endpoint, etc. unchanged. The values come
// exclusively from V3 sources (/v3/info + / root with meta).
type StratosCFInfo struct {
	// Name is the CF foundation name (e.g. "Cloud Foundry (adept-ivy-dev)").
	Name string `json:"name"`
	// Build is the CCNG build identifier (free-form, e.g. "cf-genesis-kit v2.6.0").
	Build string `json:"build"`
	// Description is the operator-supplied free-form description string.
	Description string `json:"description"`
	// Version is the CF deployment version integer from /v3/info.
	Version int `json:"version"`
	// MinCLIVersion is the minimum cf-cli version the foundation accepts.
	MinCLIVersion string `json:"min_cli_version,omitempty"`
	// MinRecommendedCLIVersion is the cf-cli version the foundation recommends.
	MinRecommendedCLIVersion string `json:"min_recommended_cli_version,omitempty"`
	// APIVersion is the CF v3 API semver from /'s
	// links.cloud_controller_v3.meta.version (e.g. "3.180.0"). Replaces the
	// legacy /v2/info api_version (which was the v2 API semver, "2.245.0").
	APIVersion string `json:"api_version,omitempty"`
	// AuthorizationEndpoint is the UAA authorize URL (from / links.login.href).
	AuthorizationEndpoint string `json:"authorization_endpoint,omitempty"`
	// TokenEndpoint is the UAA base URL (from / links.uaa.href).
	TokenEndpoint string `json:"token_endpoint,omitempty"`
	// DopplerLoggingEndpoint is the loggregator websocket URL (from /
	// links.logging.href).
	DopplerLoggingEndpoint string `json:"doppler_logging_endpoint,omitempty"`
	// RoutingEndpoint is the routing API base URL (from / links.routing.href).
	RoutingEndpoint string `json:"routing_endpoint,omitempty"`
	// AppSSHEndpoint is the SSH proxy host:port (from / links.app_ssh.href).
	AppSSHEndpoint string `json:"app_ssh_endpoint,omitempty"`
	// AppSSHHostKeyFingerprint is the SSH proxy host key fingerprint, used
	// by clients to verify they're connecting to the legitimate proxy.
	// Sourced from / links.app_ssh.meta.host_key_fingerprint via the
	// capi.Link.Meta map (added in fw-capi v3.216.4-fix-apps-delete.7).
	AppSSHHostKeyFingerprint string `json:"app_ssh_host_key_fingerprint,omitempty"`
	// AppSSHOauthClient is the UAA client_id used to mint short-lived SSH
	// access codes (conventionally "ssh-proxy"). Sourced from /
	// links.app_ssh.meta.oauth_client.
	AppSSHOauthClient string `json:"app_ssh_oauth_client,omitempty"`
	// Links is the / root link map (key=resource name, value=href).
	// Frontend uses this to flag capability availability without re-probing.
	Links map[string]string `json:"links,omitempty"`
}

// getNativeCFInfo handles GET /pp/v1/cf/info/:cnsiGuid by calling
// /v3/info and the unversioned root / on the target CF (both via capi
// since fw-capi .7 added Link.Meta), and projecting the response into
// Stratos shape. Both calls run sequentially — payloads are small
// (<2 KiB combined) and parallelism would only save one RTT.
func (c *CloudFoundrySpecification) getNativeCFInfo(ctx echo.Context) error {
	cnsiGUID := ctx.Param("cnsiGuid")
	if cnsiGUID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing cnsiGuid")
	}

	userGUID, err := c.getUserGUID(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "could not determine user")
	}

	reqCtx := ctx.Request().Context()
	cfClient, err := newCapiClient(reqCtx, c.nativeProxy(), cnsiGUID, userGUID)
	if err != nil {
		return err
	}

	info, err := cfClient.GetInfo(reqCtx)
	if err != nil {
		return handleCapiError(ctx, err)
	}
	root, err := cfClient.GetRoot(reqCtx)
	if err != nil {
		return handleCapiError(ctx, err)
	}

	out := StratosCFInfo{
		Name:                     info.Name,
		Build:                    info.Build,
		Description:              info.Description,
		Version:                  info.Version,
		MinCLIVersion:            info.CLIVersion.Minimum,
		MinRecommendedCLIVersion: info.CLIVersion.Recommended,
		Links:                    flattenLinks(root.Links),
	}

	if cc, ok := root.Links["cloud_controller_v3"]; ok {
		out.APIVersion = stringFromMeta(cc.Meta, "version")
	}
	if login, ok := root.Links["login"]; ok {
		out.AuthorizationEndpoint = login.Href
	}
	if uaa, ok := root.Links["uaa"]; ok {
		out.TokenEndpoint = uaa.Href
	}
	if logging, ok := root.Links["logging"]; ok {
		out.DopplerLoggingEndpoint = logging.Href
	}
	if routing, ok := root.Links["routing"]; ok {
		out.RoutingEndpoint = routing.Href
	}
	if ssh, ok := root.Links["app_ssh"]; ok {
		out.AppSSHEndpoint = ssh.Href
		out.AppSSHHostKeyFingerprint = stringFromMeta(ssh.Meta, "host_key_fingerprint")
		out.AppSSHOauthClient = stringFromMeta(ssh.Meta, "oauth_client")
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}

// stringFromMeta extracts a string-valued field from a capi.Link.Meta map.
// Returns "" if the map is nil, the key is missing, or the value is not a
// string. Used to cherry-pick app_ssh.meta.host_key_fingerprint /
// oauth_client and cloud_controller_v3.meta.version into typed fields on
// StratosCFInfo without each callsite having to repeat the type assertion.
func stringFromMeta(meta map[string]interface{}, key string) string {
	if meta == nil {
		return ""
	}
	if s, ok := meta[key].(string); ok {
		return s
	}
	return ""
}

// flattenLinks projects a capi.Links map onto a {name: href} map. The
// `method` and `meta` sub-fields are dropped — the frontend reads the
// promoted top-level fields (AppSSHEndpoint, APIVersion, etc.) for
// data, and Links is kept as a presence-flag catalog.
func flattenLinks(in capi.Links) map[string]string {
	if len(in) == 0 {
		return nil
	}
	out := make(map[string]string, len(in))
	for k, v := range in {
		out[k] = v.Href
	}
	return out
}
