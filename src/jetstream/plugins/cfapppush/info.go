package cfapppush

import (
	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"

	"code.cloudfoundry.org/cli/v8/util/configv3"
	log "github.com/sirupsen/logrus"
)

// Get the Cloud Foundry Info
func (c *CFPushApp) setEndpointInfo(config *configv3.Config) error {
	log.Debug("CF Push Get CF Info")

	apiEndpoint := c.config.APIEndpointURL
	skipSSLValidation := c.config.SkipSSLValidation

	cfEndpointSpec, err := c.portalProxy.GetEndpointTypeSpec("cf")
	if err != nil {
		return err
	}

	_, endpointInfo, err := cfEndpointSpec.Info(apiEndpoint, skipSSLValidation, c.config.CACert)
	if err != nil {
		return err
	}

	if info, ok := endpointInfo.(api.EndpointInfo); ok {
		// Always use the CC v3 API version for the embedded CF CLI's minimum-version
		// checks. The CLI v8 checks minimum versions against v3 version strings
		// (e.g. MinVersionCNB = "3.168.0"). When a v2 api_version is passed
		// (e.g. "2.289.0"), those checks fail — "2.289.0 < 3.168.0" — and the CLI
		// then attempts a token refresh to UAA (with no refresh token, since we
		// deliberately don't provide one), producing "refresh_token parameter not
		// provided". Using the v3 version ("3.224.0") always satisfies the CLI's
		// minimum-version gate regardless of whether the foundation also serves v2.
		// On v3-only foundations the v3 version is also what backfillFromRoot sets.
		apiVersion := info.ApiRoot.Links.CloudControllerV3.Meta.Version
		if apiVersion == "" {
			// Unexpected: root / links should always have this. Fall back to the
			// v2 api_version as a last resort so the CLI at least gets something.
			apiVersion = info.V2Info.APIVersion
			log.Warnf("CF Push: CC v3 version not found in root links, falling back to v2 api_version: %s", apiVersion)
		} else {
			log.Debugf("CF Push: using CC v3 version for CLI minimum-version checks: %s", apiVersion)
		}

		config.SetTargetInformation(
			configv3.TargetInformationArgs{
				Api:               apiEndpoint,
				ApiVersion:        apiVersion,
				Auth:              info.V2Info.AuthorizationEndpoint,
				MinCLIVersion:     info.V2Info.MinCLIVersion,
				Doppler:           info.V2Info.DopplerLoggingEndpoint,
				LogCache:          info.ApiRoot.Links.LogCache.Href,
				Routing:           info.V2Info.RoutingEndpoint,
				SkipSSLValidation: skipSSLValidation,
			},
		)
		config.SetAccessToken("bearer " + c.config.AuthToken)
		// Note: We do not give the refresh token to the CLI code as we do NOT want it to refresh the token
	} else {
		return errors.New("did not get a CF /v2/info response")
	}

	return nil
}
