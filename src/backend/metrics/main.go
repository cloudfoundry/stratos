package metrics

import (
	// "bytes"
	// "encoding/json"
	// "fmt"
	// "io"
	"net/url"

	"errors"

	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
)

type MetricsSpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType              = "metrics"
	CLIENT_ID_KEY             = "METRICS_CLIENT"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &MetricsSpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (c *MetricsSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

func (c *MetricsSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

func (c *MetricsSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *MetricsSpecification) GetType() string {
	return EndpointType
}

func (c *MetricsSpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "k8s"
}

func (c *MetricsSpecification) Register(echoContext echo.Context) error {
	log.Info("Metrics Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *MetricsSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	log.Info("Metrics Connect...")

	// connectType := ec.FormValue("connect_type")
	// if connectType != Auth {
	// 	return nil, false, errors.New("Only Kubernetes config is accepted for Kubernetes endpoints")
	// }

	// tokenRecord, _, err := c.FetchKubeConfigToken(cnsiRecord, ec)
	// if err != nil {
	// 	return nil, false, err
	// }

	// return tokenRecord, false, nil
	return nil, false, errors.New("Not implemented")
}

func (c *MetricsSpecification) Init() error {

	c.portalProxy.GetConfig().PluginConfig["neil"] = "Hey hey hey!"
	
	return nil
}

func (c *MetricsSpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *MetricsSpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *MetricsSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Kubernetes Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	// No info endpoint that we can fetch to check if the Endpoint is K8S
	// We'll discover that when we try and connect

	// uri.Path = "v2/info"
	// h := c.portalProxy.GetHttpClient(skipSSLValidation)

	// res, err := h.Get(uri.String())
	// if err != nil {
	// 	return newCNSI, nil, err
	// }

	// if res.StatusCode != 200 {
	// 	buf := &bytes.Buffer{}
	// 	io.Copy(buf, res.Body)
	// 	defer res.Body.Close()

	// 	return newCNSI, nil, fmt.Errorf("%s endpoint returned %d\n%s", uri.String(), res.StatusCode, buf)
	// }

	// dec := json.NewDecoder(res.Body)
	// if err = dec.Decode(&v2InfoResponse); err != nil {
	// 	return newCNSI, nil, err
	// }

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}
