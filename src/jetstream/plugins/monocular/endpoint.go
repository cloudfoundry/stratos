package monocular

import (
	"errors"
	"net/url"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

func (m *Monocular) GetType() string {
	return helmEndpointType
}

func (m *Monocular) GetClientId() string {
	return "helm"
}

func (m *Monocular) Register(echoContext echo.Context) error {
	log.Debug("Helm Repository Register...")
	return m.portalProxy.RegisterEndpoint(echoContext, m.Info)
}

func (m *Monocular) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return nil
}

func (m *Monocular) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	// Note: Helm Repositories don't support connecting
	return nil, false, errors.New("Connecting not support for a Helm Repository")
}

func (m *Monocular) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	// NOTE: This should check that the endpoint is actually a Helm Repository
	log.Debug("Helm Repository Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = helmEndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

func (m *Monocular) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
}
