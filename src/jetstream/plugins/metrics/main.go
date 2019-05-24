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
	EndpointType          = "metrics"
	CLIENT_ID_KEY         = "METRICS_CLIENT"
	MetricsCfRelation     = "metrics-cf"
	MetricsKubeRelation   = "metrics-kube"
	MetricsCfKubeRelation = "kubeMetrics-cf"
)

type MetricsRelationMetadata struct {
	Job         string `json:"job,omitempty"`
	Environment string `json:"environment,omitempty"`
}

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
		return nil, false, interfaces.LogHTTPError(res, err)
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

	storeMetadata := &MetricsProviderMetadata{
		Type:        "cf",
		URL:         url,
		Job:         job,
		Environment: environment,
	}

	jsonMsg, err := json.Marshal(storeMetadata)
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

	// Add a set of endpoint relations to each endpoint via the relations table
	relations, err := m.portalProxy.ListRelations()
	if err != nil {
		// TODO: RC handle
	}
	for _, endpointsOfType := range info.Endpoints {
		for _, endpoint := range endpointsOfType {
			for _, relation := range relations {
				// TODO: nicer way to do
				if (relation.Provider == endpoint.GUID || relation.Target == endpoint.GUID) && endpoint.Relations == nil {
					endpoint.Relations = &interfaces.EndpointRelations{
						Provides: []interfaces.EndpointRelation{},
						Receives: []interfaces.EndpointRelation{},
					}
				}
				// Add relation to appropriate Provider/Target collection
				if relation.Provider == endpoint.GUID {
					endpoint.Relations.Provides = append(endpoint.Relations.Provides, interfaces.EndpointRelation{
						Guid:         relation.Target,
						RelationType: relation.RelationType,
						Metadata:     relation.Metadata,
					})
				} else if relation.Target == endpoint.GUID {
					endpoint.Relations.Receives = append(endpoint.Relations.Receives, interfaces.EndpointRelation{
						Guid:         relation.Provider,
						RelationType: relation.RelationType,
						Metadata:     relation.Metadata,
					})
				}
			}
		}
	}
}

func createMetricsMetadataFromTokenMetadata(tokenMetadata string, endpointGuid string) ([]MetricsMetadata, error) {
	metricsProviders := make([]MetricsMetadata, 0)
	// Parse out the metadata
	var m []MetricsProviderMetadata
	err := json.Unmarshal([]byte(tokenMetadata), &m)
	if err == nil {
		for _, item := range m {
			info := MetricsMetadata{}
			info.EndpointGUID = endpointGuid
			info.Type = item.Type
			info.URL = item.URL
			info.Job = item.Job
			info.Environment = item.Environment
			log.Infof("Metrics provider: %+v", info) // TODO: RC revert to debug
			metricsProviders = append(metricsProviders, info)
		}
	}
	return metricsProviders, err
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
					info.Environment = item.Environment
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

func (m *MetricsSpecification) OnEndpointNotification(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {
}

func (m *MetricsSpecification) linkMetricsToEndpoints(endpoint *interfaces.CNSIRecord, tokenRecord *interfaces.TokenRecord, consoleUserID string, user *interfaces.ConnectedUser) {
	// Metrics has been connected. Determine if it provides metrics to any existing endpoint
	metricsProvidersForEndpoint, err := createMetricsMetadataFromTokenMetadata(tokenRecord.Metadata, endpoint.GUID)

	if err != nil {
		// TODO: RC handle error
		return
	}

	endpoints, err := m.portalProxy.ListEndpointsByUser(consoleUserID)
	if err != nil {
		// TODO: RC handle error
		return
	}
	for _, endpoint := range endpoints {
		// Look to see if we can find the metrics provider for this URL
		if provider, ok := hasMetricsProvider(metricsProvidersForEndpoint, endpoint.DopplerLoggingEndpoint); ok {
			// log.Infof("found cf. provider: %v", provider)
			relation := interfaces.RelationsRecord{
				Provider:     provider.EndpointGUID,
				RelationType: MetricsCfRelation,
				Target:       endpoint.GUID,
				Metadata: metadataToMap(MetricsRelationMetadata{
					Job:         provider.Job,
					Environment: provider.Environment,
				}),
			}
			_, err := m.portalProxy.SaveRelation(relation)
			if err != nil {
				// TODO: RC handle error
			}
		}
		// For K8S
		if provider, ok := hasMetricsProvider(metricsProvidersForEndpoint, endpoint.APIEndpoint.String()); ok {
			// log.Infof("found kb. provider: %v", provider)
			relation := interfaces.RelationsRecord{
				Provider:     provider.EndpointGUID,
				RelationType: MetricsKubeRelation,
				Target:       endpoint.GUID,
				Metadata: metadataToMap(MetricsRelationMetadata{
					Job:         provider.Job,
					Environment: "",
				}),
			}
			_, err := m.portalProxy.SaveRelation(relation)
			if err != nil {
				// TODO: RC handle error
			}
		}
	}
}

func metadataToMap(metadata MetricsRelationMetadata) map[string]interface{} {
	var mapMetadata map[string]interface{}
	inrec, _ := json.Marshal(metadata)
	json.Unmarshal(inrec, &mapMetadata)
	return mapMetadata
}

func (m *MetricsSpecification) linkEndpointToMetrics(endpointGuid string, endpointUrl string, consoleUserID string) {
	// Find all metrics endpoints
	endpoints, err := m.portalProxy.ListEndpointsByUser(consoleUserID)
	if err != nil {
		// TODO: RC handle error
		return
	}
	metricsEndpoints := filterEndpoints(endpoints, func(v *interfaces.ConnectedEndpoint) bool {
		return v.CNSIType == EndpointType
	})

	// Try to match up endpoint to metric
	for _, metricEndpoint := range metricsEndpoints {
		tokenRecord, found := m.portalProxy.GetCNSITokenRecord(metricEndpoint.GUID, consoleUserID)
		if !found {
			// Console user has not connected to endpoint
			continue
		}
		metricsProvidersForEndpoint, err := createMetricsMetadataFromTokenMetadata(tokenRecord.Metadata, endpointGuid)
		if err != nil {
			// TODO: RC handle error
			continue
		}
		if provider, ok := hasMetricsProvider(metricsProvidersForEndpoint, endpointUrl); ok {
			// log.Infof("found cf2. provider: %v", provider)
			relation := interfaces.RelationsRecord{
				Provider:     metricEndpoint.GUID,
				RelationType: MetricsCfRelation,
				Target:       endpointGuid,
				Metadata: metadataToMap(MetricsRelationMetadata{
					Job:         provider.Job,
					Environment: provider.Environment,
				}), //TODO: This will wipe out metadata on save
			}
			_, err := m.portalProxy.SaveRelation(relation)
			if err != nil {
				// TODO: RC handle error
			}
		}
	}
}

// TODO: RC Gotta be a generic way to do this??
func filterEndpoints(vs []*interfaces.ConnectedEndpoint, f func(*interfaces.ConnectedEndpoint) bool) []*interfaces.ConnectedEndpoint {
	vsf := make([]*interfaces.ConnectedEndpoint, 0)
	for _, v := range vs {
		if f(v) {
			vsf = append(vsf, v)
		}
	}
	return vsf
}

func (m *MetricsSpecification) OnTokenNotification(endpoint *interfaces.CNSIRecord, tokenRecord *interfaces.TokenRecord, consoleUserID string, user *interfaces.ConnectedUser) {
	switch endpointType := endpoint.CNSIType; endpointType {
	case EndpointType:
		m.linkMetricsToEndpoints(endpoint, tokenRecord, consoleUserID, user)
	case "cf":
		m.linkEndpointToMetrics(endpoint.GUID, endpoint.DopplerLoggingEndpoint, consoleUserID)
	case "k8s":
		m.linkEndpointToMetrics(endpoint.GUID, endpoint.APIEndpoint.String(), consoleUserID)
	}
}
