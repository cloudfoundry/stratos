package cfapppush

import (
	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"

	"code.cloudfoundry.org/cli/util/configv3"
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

	if info, ok := endpointInfo.(api.V2Info); ok {
		// Got the info we need - update the config with it
		config.SetTargetInformation(
			configv3.TargetInformationArgs{
				Api:               apiEndpoint,
				ApiVersion:        info.APIVersion,
				Auth:              info.AuthorizationEndpoint,
				MinCLIVersion:     info.MinCLIVersion,
				Doppler:           info.DopplerLoggingEndpoint,
				Routing:           info.RoutingEndpoint,
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
