package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/url"

	"errors"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type CloudFoundrySpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType  = "cf"
	CLIENT_ID_KEY = "CF_CLIENT"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &CloudFoundrySpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (c CloudFoundrySpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

func (c CloudFoundrySpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

func (c CloudFoundrySpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c CloudFoundrySpecification) GetType() string {
	return EndpointType
}

func (c CloudFoundrySpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "cf"
}

func (c CloudFoundrySpecification) Register(echoContext echo.Context) error {
	log.Info("CloudFoundry Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c CloudFoundrySpecification) Init() error {
	// No-op
	return nil
}

func (c CloudFoundrySpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c CloudFoundrySpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// Firehose Stream
	echoGroup.GET("/:cnsiGuid/firehose", c.firehose)

	// Applications Log Streams
	echoGroup.GET("/:cnsiGuid/apps/:appGuid/stream", c.appStream)
}

func (c CloudFoundrySpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	uri, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	uri.Path = "v2/info"
	h := c.portalProxy.GetHttpClient(skipSSLValidation)

	res, err := h.Get(uri.String())
	if err != nil {
		return newCNSI, nil, err
	}

	if res.StatusCode != 200 {
		buf := &bytes.Buffer{}
		io.Copy(buf, res.Body)
		defer res.Body.Close()

		return newCNSI, nil, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	}

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&v2InfoResponse); err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = v2InfoResponse.TokenEndpoint
	newCNSI.AuthorizationEndpoint = v2InfoResponse.AuthorizationEndpoint
	newCNSI.DopplerLoggingEndpoint = v2InfoResponse.DopplerLoggingEndpoint

	return newCNSI, v2InfoResponse, nil
}
