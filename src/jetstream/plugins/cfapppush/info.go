package cfapppush

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/url"

	"code.cloudfoundry.org/cli/util/configv3"
	log "github.com/sirupsen/logrus"
)

type v2Info struct {
	AuthorizationEndpoint    string `json:"authorization_endpoint"`
	TokenEndpoint            string `json:"token_endpoint"`
	DopplerLoggingEndpoint   string `json:"doppler_logging_endpoint"`
	APIVersion               string `json:"api_version"`
	RoutingEndpoint          string `json:"routing_endpoint"`
	MinCLIVersion            string `json:"min_cli_version"`
	MinRecommendedCLIVersion string `json:"min_recommended_cli_version"`
}

// Get the Cloud Foundry Info
func (c *CFPushApp) setEndpointInfo(config *configv3.Config) error {
	log.Debug("CF Push Get CF Info")

	apiEndpoint := c.config.APIEndpointURL
	skipSSLValidation := c.config.SkipSSLValidation

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return err
	}

	uri.Path = "v2/info"
	h := c.portalProxy.GetHttpClient(skipSSLValidation)
	res, err := h.Get(uri.String())
	if err != nil {
		return err
	}

	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		defer res.Body.Close()
		return fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}

	var info v2Info
	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&info); err != nil {
		return err
	}

	// Got the info we need - update the config with it
	config.SetTargetInformation(apiEndpoint, info.APIVersion, info.AuthorizationEndpoint, info.MinCLIVersion, info.DopplerLoggingEndpoint, info.RoutingEndpoint, skipSSLValidation)
	config.SetAccessToken("bearer " + c.config.AuthToken)

	return nil
}
