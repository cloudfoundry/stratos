package metrics

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"

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
	EndpointType  = "metrics"
	CLIENT_ID_KEY = "METRICS_CLIENT"
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

// Metrics endpoints - admin
func (c *MetricsSpecification) AddAdminGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf", c.getCloudFoundryMetrics)

	// TODOO: Kubernetes
	//echoContext.GET("metrics/k8s", p.getKubernetesMetrics)
}

// Metrics API endpoints - non-admin
func (c *MetricsSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/app/:appId", c.getCloudFoundryAppMetrics)
}

func (c *MetricsSpecification) GetType() string {
	return EndpointType
}

func (c *MetricsSpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "metrics"
}

func (c *MetricsSpecification) Register(echoContext echo.Context) error {
	log.Debug("Metrics Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *MetricsSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	log.Debug("Metrics Connect...")

	connectType := ec.FormValue("connect_type")
	if connectType != interfaces.AuthConnectTypeCreds {
		return nil, false, errors.New("Only username/password is accepted for Metrics endpoints")
	}

	username := ec.FormValue("username")
	password := ec.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return nil, false, errors.New("Need username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	tr := &interfaces.TokenRecord{
		AuthType:  interfaces.AuthTypeHttpBasic,
		AuthToken: base64EncodedAuthString,
	}

	// Metadata indicates which Cloud Foundry/Kubernetes endpoints the metrics endpoint can supply data for

	// Attempt to fetch info for metrics endpoint to validate credentials are valid
	return tr, false, nil
}

func (c *MetricsSpecification) Init() error {
	return nil
}

func (c *MetricsSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Metrics Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	// No info endpoint that we can fetch to check if the Endpoint is a metrics endpoint
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

func (c *MetricsSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {

	// Record of which endpoints have metrics
	haveMetrics := make(map[string]string)

	// Go through the metrics endpoints and get the corresponding services from the token metadata
	if metrics, ok := info.Endpoints[EndpointType]; ok {
		for guid, ep := range metrics {
			// Metric endpoints
			log.Info(guid)
			log.Info(ep)
		}

		haveMetrics["4e154430-17b9-4e38-adb6-45be571960bb"] = "true"
	}

	// Map of endpoint types
	for k, eps := range info.Endpoints {
		log.Info(k)
		log.Info(eps)

		// Map of guids to endpoints
		for guid, ep := range eps {
			log.Info(guid)
			log.Info(ep)
			if _, ok := haveMetrics[guid]; ok {
				ep.Metadata["metrics"] = "true"
			}
		}
	}
}

func (m *MetricsSpecification) getMetricsEndpoints(userGUID string) error {

	userEndpoints, err := m.portalProxy.ListCNSITokenRecordsForUser(userGUID)
	if err != nil {
		return err
	}

	for _, endpointToken := range userEndpoints {
		log.Info(endpointToken)
		if endpointToken.EndpointType == "metrics" {
			// Get the endpoints that this metrics endpoint supports from its metadata
			log.Info("Got metrics endpoint: " + endpointToken.EndpointGUID)
		}
	}

	return nil
}
