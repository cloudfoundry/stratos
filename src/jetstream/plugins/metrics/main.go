package metrics

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

// MetricsSpecification is a plugin to support the metrics endpoint type
type MetricsSpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	EndpointType  = "metrics"
	CLIENT_ID_KEY = "METRICS_CLIENT"
)

type MetricsProviderMetadata struct {
	Type string `json:"type"`
	URL  string `json:"url"`
	Job  string `json:"job"`
}

type MetricsMetadata struct {
	Type         string
	URL          string
	Job          string
	EndpointGUID string
}

type EndpointMetricsRelation struct {
	metrics  *MetricsMetadata
	endpoint *interfaces.ConnectedEndpoint
}

// Init creates a new MetricsSpecification
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &MetricsSpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (m *MetricsSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return m, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (m *MetricsSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return m, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (m *MetricsSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (m *MetricsSpecification) AddAdminGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/:op", m.getCloudFoundryMetrics)
	echoContext.GET("/metrics/kubernetes/:podName/:op", m.getPodMetrics)
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (m *MetricsSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/app/:appId/:op", m.getCloudFoundryAppMetrics)
	echoContext.GET("/metrics/cf/cells/:op", m.getCloudFoundryCellMetrics)
}

func (m *MetricsSpecification) GetType() string {
	return EndpointType
}

func (m *MetricsSpecification) GetClientId() string {
	if clientId, err := config.GetValue(CLIENT_ID_KEY); err == nil {
		return clientId
	}

	return "metrics"
}

func (m *MetricsSpecification) Register(echoContext echo.Context) error {
	log.Debug("Metrics Register...")
	return m.portalProxy.RegisterEndpoint(echoContext, m.Info)
}

func (m *MetricsSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
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
		AuthType:     interfaces.AuthTypeHttpBasic,
		AuthToken:    base64EncodedAuthString,
		RefreshToken: username,
	}

	// Metadata indicates which Cloud Foundry/Kubernetes endpoints the metrics endpoint can supply data for
	metricsMetadataEndpoint := fmt.Sprintf("%s/stratos", cnsiRecord.APIEndpoint)
	req, err := http.NewRequest("GET", metricsMetadataEndpoint, nil)
	if err != nil {
		msg := "Failed to create request for the Metrics Endpoint: %v"
		log.Errorf(msg, err)
		return nil, false, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(username, password)

	var h = m.portalProxy.GetHttpClient(cnsiRecord.SkipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, false, interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	// Put the body in the token metadata
	tr.Metadata = string(body)

	return tr, false, nil
}

// Init performs plugin initialization
func (m *MetricsSpecification) Init() error {
	return nil
}

func (m *MetricsSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Metrics Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = EndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	var httpClient = m.portalProxy.GetHttpClient(skipSSLValidation)
	resp, err := httpClient.Get(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	// Any error code >= 400 that is not 401 means something wrong
	if resp.StatusCode >= 400 && resp.StatusCode != 401 {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

func (m *MetricsSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {

	metricsProviders := make([]MetricsMetadata, 0)
	// Go through the metrics endpoints and get the corresponding services from the token metadata
	if metrics, ok := info.Endpoints[EndpointType]; ok {
		for _, endpoint := range metrics {
			// Parse out the metadata
			var m []MetricsProviderMetadata
			err := json.Unmarshal([]byte(endpoint.TokenMetadata), &m)
			if err == nil {
				for _, item := range m {
					info := MetricsMetadata{}
					info.EndpointGUID = endpoint.GUID
					info.Type = item.Type
					info.URL = item.URL
					info.Job = item.Job
					log.Debugf("Metrics provider: %+v", info)
					metricsProviders = append(metricsProviders, info)
				}
			}
		}
	}

	// Go through again, annotate this time with which have metrics
	for _, values := range info.Endpoints {
		for _, endpoint := range values {
			// Look to see if we can find the metrics provider for this URL
			log.Debugf("Processing endpoint: %+v", endpoint)
			log.Debugf("Processing endpoint: %+v", endpoint.CNSIRecord)

			if provider, ok := hasMetricsProvider(metricsProviders, endpoint.DopplerLoggingEndpoint); ok {
				endpoint.Metadata["metrics"] = provider.EndpointGUID
				endpoint.Metadata["metrics_job"] = provider.Job
			}
			// For K8S
			if provider, ok := hasMetricsProvider(metricsProviders, endpoint.APIEndpoint.String()); ok {
				endpoint.Metadata["metrics"] = provider.EndpointGUID
				endpoint.Metadata["metrics_job"] = provider.Job
			}
		}
	}
}

func hasMetricsProvider(providers []MetricsMetadata, url string) (*MetricsMetadata, bool) {
	for _, provider := range providers {
		if provider.URL == url {
			return &provider, true
		}
	}
	return nil, false
}

func (m *MetricsSpecification) getMetricsEndpoints(userGUID string, cnsiList []string) (map[string]EndpointMetricsRelation, error) {

	metricsProviders := make([]MetricsMetadata, 0)
	endpointsMap := make(map[string]*interfaces.ConnectedEndpoint)
	results := make(map[string]EndpointMetricsRelation)

	// Get Endpoints the user is connected to
	userEndpoints, err := m.portalProxy.ListEndpointsByUser(userGUID)

	if err != nil {
		return nil, err
	}

	allUserAccessibleEndpoints := userEndpoints

	// Get Endpoints that are shared in the system
	systemSharedEndpoints, err := m.portalProxy.ListEndpointsByUser(tokens.SystemSharedUserGuid)

	if err != nil {
		return nil, err
	}
	for _, endpoint := range systemSharedEndpoints {
		allUserAccessibleEndpoints = append(allUserAccessibleEndpoints, endpoint)
	}

	if err != nil {
		return nil, err
	}

	for _, endpoint := range allUserAccessibleEndpoints {
		if stringInSlice(endpoint.GUID, cnsiList) {
			// Found the Endpoint, so add it to our list
			endpointsMap[endpoint.GUID] = endpoint
		} else if endpoint.CNSIType == "metrics" {
			// Parse out the metadata
			var m []MetricsProviderMetadata
			err := json.Unmarshal([]byte(endpoint.TokenMetadata), &m)
			if err == nil {
				for _, item := range m {
					info := MetricsMetadata{}
					info.EndpointGUID = endpoint.GUID
					info.Type = item.Type
					info.URL = item.URL
					info.Job = item.Job
					metricsProviders = append(metricsProviders, info)
				}
			}
		}
	}

	for _, metricProviderInfo := range metricsProviders {
		for guid, info := range endpointsMap {
			// Depends on the type
			if info.CNSIType == metricProviderInfo.Type && info.DopplerLoggingEndpoint == metricProviderInfo.URL {
				relate := EndpointMetricsRelation{}
				relate.endpoint = info
				// Make a copy
				relate.metrics = &MetricsMetadata{}
				*relate.metrics = metricProviderInfo
				results[guid] = relate
				delete(endpointsMap, guid)
				break
			}
			// K8s
			log.Debugf("Processing endpoint: %+v", info)
			log.Debugf("Processing endpoint Metrics provider: %+v", metricProviderInfo)
			if info.APIEndpoint.String() == metricProviderInfo.URL {
				relate := EndpointMetricsRelation{}
				relate.endpoint = info
				relate.metrics = &metricProviderInfo
				results[guid] = relate
				delete(endpointsMap, guid)
				break
			}
		}
	}

	// Did we find a metric provider for each endpoint?
	if len(endpointsMap) != 0 {
		return nil, errors.New("Can not find a metric provider for all of the specified endpoints")
	}
	return results, nil
}

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}
