package monocular

import (
	"errors"
	"fmt"
	"net/url"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// GetType returns the endpoint type supported by this plugin
func (m *Monocular) GetType() string {
	return helmEndpointType
}

// GetClientId gets the default client ID to use
func (m *Monocular) GetClientId() string {
	return "helm"
}

// Register will register a new endpoint of the type Helm
func (m *Monocular) Register(echoContext echo.Context) error {
	log.Debug("Helm Repository Register...")
	return m.portalProxy.RegisterEndpoint(echoContext, m.Info)
}

// Validate validates the connection to the endpoint - verifies that we can actually connect and call its API
func (m *Monocular) Validate(userGUID string, cnsiRecord api.CNSIRecord, tokenRecord api.TokenRecord) error {
	return nil
}

// Connect to the endpoint
func (m *Monocular) Connect(ec echo.Context, cnsiRecord api.CNSIRecord, userId string) (*api.TokenRecord, bool, error) {
	// Note: Helm Repositories don't support connecting
	return nil, false, errors.New("Connecting not support for a Helm Repository")
}

// Info checks the endpoint type and fetches any metadata
func (m *Monocular) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (api.CNSIRecord, interface{}, error) {
	log.Debug("Helm Repository Info")
	var v2InfoResponse api.V2Info
	var newCNSI api.CNSIRecord

	newCNSI.CNSIType = helmEndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	// Just check that we can fetch index.yaml
	var httpClient = m.portalProxy.GetHttpClient(skipSSLValidation, caCert)
	res, err := httpClient.Get(apiEndpoint + "/index.yaml")
	if err != nil {
		// This should ultimately catch 503 cert errors
		return newCNSI, nil, err
	}

	if res.StatusCode >= 400 {
		return newCNSI, nil, fmt.Errorf("Does not appear to be a Helm Repository (HTTP Status code: %d)", res.StatusCode)
	}

	// We were able to fetch the index.yaml, so looks like a Helm Repository
	// We could parse the contents and check further
	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

// UpdateMetadata not needed for Helm endpoints
func (m *Monocular) UpdateMetadata(info *api.Info, userGUID string, echoContext echo.Context) {
}
