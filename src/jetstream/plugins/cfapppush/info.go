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
		// When CAPI v2 is disabled, /v2/info returns an empty api_version string.
		// The embedded CF CLI (v8) passes that value to blang/semver.Make() as
		// part of its minimum-version check (push_command.go → MinimumCCAPIVersionCheck),
		// which immediately returns "Version string empty" and aborts the push.
		// Fall back to the CC v3 version from the root `/` links — this is the
		// same value backfillFromRoot sets at registration time, so we're
		// consistent with how the rest of Stratos talks to the v3-only foundation.
		apiVersion := info.V2Info.APIVersion
		if apiVersion == "" {
			apiVersion = info.ApiRoot.Links.CloudControllerV3.Meta.Version
			log.Debugf("CF Push: /v2/info api_version empty (v2 API disabled), using v3 version: %s", apiVersion)
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
