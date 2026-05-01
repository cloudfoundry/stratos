// src/jetstream/plugins/cloudfoundry/native_info.go
//
// V3-native CF info handler. Returns the data the frontend's CF Summary
// card needs, sourced from CF v3 only:
//
//   - GET /v3/info  → name, build, description, version, cli_version
//   - GET /v3/      → resource links (used by the frontend to flag
//                     capability availability — apps, deployments, etc.)
//
// Replaces the legacy /pp/v1/proxy/v2/info call from the frontend's
// cloud-foundry.effects.ts. The legacy path returned the CF /v2/info
// envelope verbatim; this handler returns a Stratos-shape projection
// because /v3/info is structured differently (no api_version semver, no
// app_ssh_endpoint at root). Fields the v3 surface doesn't carry on the
// target CF (e.g. SSH endpoint on CFs older than ~3.190) are returned
// as zero values; the frontend degrades that section gracefully rather
// than rendering misleading data.
package cloudfoundry

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

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
	// Sourced from / links.app_ssh.meta.host_key_fingerprint — capi's
	// Link.Method/Href pair drops meta, so we parse / via raw HTTP.
	AppSSHHostKeyFingerprint string `json:"app_ssh_host_key_fingerprint,omitempty"`
	// AppSSHOauthClient is the UAA client_id used to mint short-lived SSH
	// access codes (conventionally "ssh-proxy"). Sourced from /
	// links.app_ssh.meta.oauth_client.
	AppSSHOauthClient string `json:"app_ssh_oauth_client,omitempty"`
	// Links is the / root link map (key=resource name, value=href).
	// Frontend uses this to flag capability availability without re-probing.
	Links map[string]string `json:"links,omitempty"`
}

// apiRootResponse is the shape of CF's `/` (unversioned root) response.
// Defined locally because capi.Link drops the per-link `meta` sub-object
// that carries the SSH host-key fingerprint and OAuth client name we need.
type apiRootResponse struct {
	Links map[string]apiRootLink `json:"links"`
}

type apiRootLink struct {
	Href string             `json:"href"`
	Meta *apiRootLinkMeta   `json:"meta,omitempty"`
}

// apiRootLinkMeta captures the per-link metadata used by Stratos consumers.
// Currently only app_ssh and cloud_controller_v{2,3} have meaningful meta
// in the CF API; we union all fields here and let zero values stand in
// where a given link doesn't carry them.
type apiRootLinkMeta struct {
	Version            string `json:"version,omitempty"`
	HostKeyFingerprint string `json:"host_key_fingerprint,omitempty"`
	OauthClient        string `json:"oauth_client,omitempty"`
}

// getNativeCFInfo handles GET /pp/v1/cf/info/:cnsiGuid by calling
// /v3/info (via capi for clean typing) and / (raw — capi drops the
// per-link `meta` sub-object that carries SSH host-key fingerprint and
// the OAuth client name) on the target CF and projecting the response
// into Stratos shape. Both calls run sequentially — payloads are small
// (<2 KiB combined) and parallelism would only save one RTT on the
// happy path while complicating error handling.
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

	cnsi, err := c.nativeProxy().GetCNSIRecord(cnsiGUID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "endpoint not found")
	}
	root, err := fetchAPIRoot(cnsi.APIEndpoint.String(), cnsi.SkipSSLValidation)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("fetching CF API root: %v", err))
	}

	out := StratosCFInfo{
		Name:                  info.Name,
		Build:                 info.Build,
		Description:           info.Description,
		Version:               info.Version,
		MinCLIVersion:            info.CLIVersion.Minimum,
		MinRecommendedCLIVersion: info.CLIVersion.Recommended,
	}

	if root != nil {
		out.Links = flattenAPIRootLinks(root.Links)
		if cc, ok := root.Links["cloud_controller_v3"]; ok && cc.Meta != nil {
			out.APIVersion = cc.Meta.Version
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
			if ssh.Meta != nil {
				out.AppSSHHostKeyFingerprint = ssh.Meta.HostKeyFingerprint
				out.AppSSHOauthClient = ssh.Meta.OauthClient
			}
		}
	}

	ctx.Response().Header().Set("X-Stratos-Schema-Version", stratosSchemaVersion)
	return ctx.JSON(http.StatusOK, out)
}

// fetchAPIRoot performs an unauthenticated GET on `<apiEndpoint>/` and
// decodes the response into apiRootResponse, which preserves the
// per-link meta sub-objects that capi's Link type discards. The endpoint
// is public — CF returns the same root payload to anonymous callers as
// to authenticated ones — so we don't plumb a token here.
func fetchAPIRoot(apiEndpoint string, skipSSLValidation bool) (*apiRootResponse, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: skipSSLValidation},
			Proxy:           http.ProxyFromEnvironment,
		},
	}
	resp, err := client.Get(apiEndpoint + "/")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d from CF API root", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var root apiRootResponse
	if err := json.Unmarshal(body, &root); err != nil {
		return nil, fmt.Errorf("decoding CF API root: %w", err)
	}
	return &root, nil
}

// flattenAPIRootLinks projects the Stratos-decoded root link map onto a
// {name: href} map for the Links field. Same shape as flattenLinks but
// over the local apiRootLink type that preserves meta.
func flattenAPIRootLinks(in map[string]apiRootLink) map[string]string {
	if len(in) == 0 {
		return nil
	}
	out := make(map[string]string, len(in))
	for k, v := range in {
		out[k] = v.Href
	}
	return out
}

// flattenLinks projects a capi.Links map onto a {name: href} map. The
// `method` sub-field is dropped — the frontend only needs href + key
// presence for capability flags.
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
