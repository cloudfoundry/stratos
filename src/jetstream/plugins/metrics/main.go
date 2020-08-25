package metrics

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"

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
	Type        string `json:"type"`
	URL         string `json:"url"`
	Job         string `json:"job,omitempty"`
	Environment string `json:"environment,omitempty"`
}

type MetricsMetadata struct {
	Type         string
	URL          string
	Job          string
	EndpointGUID string
	Environment  string
}

type EndpointMetricsRelation struct {
	metrics  *MetricsMetadata
	endpoint *interfaces.ConnectedEndpoint
}

type PrometheusQueryResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string `json:"resultType"`
		Result     []struct {
			Metric struct {
				Name           string `json:"__name__,omitempty"`
				ApplicationID  string `json:"application_id,omitempty"`
				BoshDeployment string `json:"bosh_deployment,omitempty"`
				BoshJobID      string `json:"bosh_job_id,omitempty"`
				BoshJobName    string `json:"bosh_job_name,omitempty"`
				Environment    string `json:"environment,omitempty"`
				Instance       string `json:"instance,omitempty"`
				InstanceIndex  string `json:"instance_index,omitempty"`
				Job            string `json:"job,omitempty"`
				Origin         string `json:"origin,omitempty"`
			} `json:"metric"`
			Value []interface{} `json:"value"`
		} `json:"result"`
	} `json:"data"`
}

type MetricsAuth struct {
	Type     string
	Username string
	Password string
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
	echoContext.GET("/metrics/kubernetes/:podName/:op", m.getPodMetrics)
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (m *MetricsSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/app/:appId/:op", m.getCloudFoundryAppMetrics)

	// Note: User needs to be an admin of the given Cloud Foundry to retrieve metrics
	echoContext.GET("/metrics/cf/cells/:op", m.getCloudFoundryCellMetrics)
	echoContext.GET("/metrics/cf/:op", m.getCloudFoundryMetrics)
}

func (m *MetricsSpecification) GetType() string {
	return EndpointType
}

func (m *MetricsSpecification) GetClientId() string {
	return m.portalProxy.Env().String(CLIENT_ID_KEY, "metrics")
}

func (m *MetricsSpecification) Register(echoContext echo.Context) error {
	log.Debug("Metrics Register...")
	return m.portalProxy.RegisterEndpoint(echoContext, m.Info)
}

func (m *MetricsSpecification) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	return nil
}

func (m *MetricsSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userId string) (*interfaces.TokenRecord, bool, error) {
	log.Debug("Metrics Connect...")

	connectType := ec.FormValue("connect_type")
	auth := &MetricsAuth{
		Type: connectType,
	}

	switch connectType {
	case interfaces.AuthConnectTypeCreds:
		auth.Username = ec.FormValue("username")
		auth.Password = ec.FormValue("password")
		if connectType == interfaces.AuthConnectTypeCreds && (len(auth.Username) == 0 || len(auth.Password) == 0) {
			return nil, false, errors.New("Need username and password")
		}
	case interfaces.AuthConnectTypeNone:
		auth.Username = "none"
		auth.Password = "none"
	default:
		return nil, false, errors.New("Only username/password or no authentication is accepted for Metrics endpoints")
	}

	authString := fmt.Sprintf("%s:%s", auth.Username, auth.Password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	tr := &interfaces.TokenRecord{
		AuthType:     interfaces.AuthTypeHttpBasic,
		AuthToken:    base64EncodedAuthString,
		RefreshToken: auth.Username,
	}

	log.Debug("Looking for Stratos metrics metadata resource....")

	// Metadata indicates which Cloud Foundry/Kubernetes endpoints the metrics endpoint can supply data for
	metricsMetadataEndpoint := fmt.Sprintf("%s/stratos", cnsiRecord.APIEndpoint)
	req, err := http.NewRequest("GET", metricsMetadataEndpoint, nil)
	if err != nil {
		msg := "Failed to create request for the Metrics Endpoint: %v"
		log.Errorf(msg, err)
		return nil, false, fmt.Errorf(msg, err)
	}
	m.addAuth(req, auth)

	var h = m.portalProxy.GetHttpClient(cnsiRecord.SkipSSLValidation)
	res, err := h.Do(req)

	if err == nil && res.StatusCode == http.StatusNotFound {
		log.Debug("Checking if this is a prometheus endpoint")
		// This could be a bosh-prometheus endpoint, verify that this is a prometheus endpoint
		statusEndpoint := fmt.Sprintf("%s/api/v1/status/config", cnsiRecord.APIEndpoint)
		req, err = http.NewRequest("GET", statusEndpoint, nil)
		if err != nil {
			msg := "Failed to create request for the Metrics Endpoint: %v"
			log.Errorf(msg, err)
			return nil, false, fmt.Errorf(msg, err)
		}
		m.addAuth(req, auth)

		response, err := h.Do(req)
		defer response.Body.Close()
		if err != nil || response.StatusCode != http.StatusOK {
			log.Errorf("Error performing http request - response: %v, error: %v", response, err)
			return nil, false, interfaces.LogHTTPError(res, err)
		}

		tr.Metadata, _ = m.createMetadata(cnsiRecord.APIEndpoint, h, auth)
		return tr, false, nil
	} else if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		errMessage := ""
		if res.StatusCode == http.StatusUnauthorized {
			errMessage = ": Unauthorized"
		}
		return nil, false, interfaces.NewHTTPShadowError(
			res.StatusCode,
			fmt.Sprintf("Could not connect to the endpoint%s", errMessage),
			"Could not connect to the endpoint: %s", err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)
	// Put the body in the token metadata
	tr.Metadata = string(body)

	return tr, false, nil
}

func (m *MetricsSpecification) addAuth(req *http.Request, auth *MetricsAuth) {
	if auth.Type == interfaces.AuthConnectTypeCreds {
		req.SetBasicAuth(auth.Username, auth.Password)
	}
}

func (m *MetricsSpecification) createMetadata(metricEndpoint *url.URL, httpClient http.Client, auth *MetricsAuth) (string, error) {
	basicMetricRequest := fmt.Sprintf("%s/api/v1/query?query=firehose_total_metrics_received", metricEndpoint)
	req, err := http.NewRequest("GET", basicMetricRequest, nil)
	if err != nil {
		msg := "Failed to create request for the Metrics Endpoint: %v"
		log.Errorf(msg, err)
		return "", fmt.Errorf(msg, err)
	}
	m.addAuth(req, auth)
	res, err := httpClient.Do(req)
	defer res.Body.Close()
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return "", interfaces.LogHTTPError(res, err)
	}
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Errorf("Unexpected response: %v", err)
		return "", interfaces.LogHTTPError(res, err)
	}

	queryResponse := &PrometheusQueryResponse{}
	err = json.Unmarshal(body, queryResponse)
	if err != nil {
		log.Errorf("Failed to unmarshal response: %v", err)
		return "", interfaces.LogHTTPError(res, err)
	}
	if len(queryResponse.Data.Result) == 0 {
		log.Errorf("No series detecthed! No Firehose exporter currently connected")
		return "", interfaces.LogHTTPError(res, err)
	}

	if len(queryResponse.Data.Result) > 1 {
		log.Warnf("Multiple series detected, its possible multiple cloud-foundries are being monitored. Selecting the first one")
	}

	if queryResponse.Data.Result[0].Metric.Environment == "" {
		log.Errorf("No environmnent detected in %v", queryResponse)
		return "", interfaces.LogHTTPError(res, err)
	}

	environment := queryResponse.Data.Result[0].Metric.Environment
	url := queryResponse.Data.Result[0].Metric.Environment
	job := queryResponse.Data.Result[0].Metric.Job

	// Ensure URL has wss:// prefix
	if !strings.HasPrefix(url, "wss://") {
		url = fmt.Sprintf("wss://%s", environment)
	}

	// Array for case that metrics are provided for multiple endpoints
	var metricsMetadata []*MetricsProviderMetadata
	storeMetadata := &MetricsProviderMetadata{
		Type:        "cf",
		URL:         url,
		Job:         job,
		Environment: environment,
	}
	metricsMetadata = append(metricsMetadata, storeMetadata)

	jsonMsg, err := json.Marshal(metricsMetadata)
	if err != nil {
		return "", interfaces.LogHTTPError(res, err)
	}
	return string(jsonMsg), nil
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
					info.Environment = item.Environment
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
				endpoint.Metadata["metrics_environment"] = provider.Environment
			}
			// For K8S
			if provider, ok := hasMetricsProvider(metricsProviders, endpoint.APIEndpoint.String()); ok {
				endpoint.Metadata["metrics"] = provider.EndpointGUID
				endpoint.Metadata["metrics_job"] = provider.Job
				endpoint.Metadata["metrics_environment"] = ""
			}
		}
	}
}

func hasMetricsProvider(providers []MetricsMetadata, url string) (*MetricsMetadata, bool) {
	for _, provider := range providers {
		if compareURL(provider.URL, url) {
			return &provider, true
		}
	}
	return nil, false
}

// Compare two URLs, taking into account default HTTP/HTTPS ports and ignoring query string
func compareURL(a, b string) bool {

	ua, err := url.Parse(a)
	if err != nil {
		return false
	}

	ub, err := url.Parse(b)
	if err != nil {
		return false
	}

	aPort := getPort(ua)
	bPort := getPort(ub)

	aPath := trimPath(ua.Path)
	bPath := trimPath(ub.Path)

	return ua.Scheme == ub.Scheme && ua.Hostname() == ub.Hostname() && aPort == bPort && aPath == bPath
}

func getPort(u *url.URL) string {
	port := u.Port()
	if len(port) == 0 {
		switch u.Scheme {
		case "http":
			port = "80"
		case "https":
			port = "443"
		default:
			port = ""
		}
	}

	return port
}

func trimPath(path string) string {
	if strings.HasSuffix(path, "/") {
		return path[:len(path)-1]
	}
	return path
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
					info.Environment = item.Environment
					metricsProviders = append(metricsProviders, info)
				}
			}
		}
	}

	for _, metricProviderInfo := range metricsProviders {
		for guid, info := range endpointsMap {
			// Depends on the type
			if info.CNSIType == metricProviderInfo.Type && compareURL(info.DopplerLoggingEndpoint, metricProviderInfo.URL) {
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
			if compareURL(info.APIEndpoint.String(), metricProviderInfo.URL) {
				relate := EndpointMetricsRelation{}
				relate.endpoint = info
				// Make a copy
				relate.metrics = &MetricsMetadata{}
				*relate.metrics = metricProviderInfo
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
