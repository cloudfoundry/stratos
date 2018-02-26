package metrics

import (
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/SUSE/stratos-ui/config"
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"io/ioutil"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

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

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &MetricsSpecification{portalProxy: portalProxy, endpointType: EndpointType}, nil
}

func (m *MetricsSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return m, nil
}

func (m *MetricsSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return m, nil
}

func (m *MetricsSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

// Metrics endpoints - admin
func (m *MetricsSpecification) AddAdminGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/:op", m.getCloudFoundryMetrics)

	// TODOO: Kubernetes
	//echoContext.GET("metrics/k8s", p.getKubernetesMetrics)
}

// Metrics API endpoints - non-admin
func (m *MetricsSpecification) AddSessionGroupRoutes(echoContext *echo.Group) {
	echoContext.GET("/metrics/cf/app/:appId/:op", m.getCloudFoundryAppMetrics)
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

func (m *MetricsSpecification) Init() error {

	// My testing

	adminDashboard := "https://149.44.104.40:9234"

	cookieJar, _ := cookiejar.New(nil)

	httpClientSkipSSL := &http.Client{
	//Jar: cookieJar,
	}

	log.Info(cookieJar)

	dial := (&net.Dialer{
		Timeout:   time.Duration(30) * time.Second,
		KeepAlive: 30 * time.Second, // should be less than any proxy connection timeout (typically 2-3 minutes)
	}).Dial

	trSkipSSL := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		Dial:                dial,
		TLSHandshakeTimeout: 10 * time.Second, // 10 seconds is a sound default value (default is 0)
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost: 6, // (default is 2)
	}

	httpClientSkipSSL.Transport = trSkipSSL

	//re = regex.MustCompile(tokenRegex)

	// Fetch the admin dashboard - we won't be logged in initially
	req, err := http.NewRequest("GET", adminDashboard, nil)
	if err != nil {
		panic("Could not make request")
	}

	res, err := httpClientSkipSSL.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	log.Info(string(body))

	token := getCSRFToken(string(body))
	log.Info(token)

	// Now log in and get the cookie and X-CSRF-Token header
	// Make a note of the session value we got back in the cookie
	cookie := getVelumSessionCookie(res.Header)

	post := url.Values{}
	post.Set("authenticity_token", token)
	post.Set("user[email]", "test@test.com")
	post.Set("user[password]", "password")
	post.Set("user[remember_me]", "0")

	req, err = http.NewRequest("POST", adminDashboard+"/users/sign_in", strings.NewReader(post.Encode()))
	if err != nil {
		panic("Could not make request")
	}
	setVelumSessionCookie(req, cookie)

	//	req.Header.Set("Cookie", cookie)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	//cook := http.Cookie{Name: "_velum_session", Value: cookie}
	//req.AddCookie(&cook)

	res, err = httpClientSkipSSL.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	defer res.Body.Close()
	b, _ := ioutil.ReadAll(res.Body)

	log.Info(string(b))
	t2 := getCSRFToken(string(b))

	log.Info(t2)
	log.Info(token)

	cookie = getVelumSessionCookie(res.Header)

	// We are logged in now.....

	unixTime := time.Now().Unix()

	// Get kube config
	req, err = http.NewRequest("GET", adminDashboard+"/?_="+strconv.Itoa(int(unixTime)), nil)
	if err != nil {
		panic("Could not make request")
	}

	setVelumSessionCookie(req, cookie)

	req.Header.Set("X-CSRF-Token", t2)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Accept", "application/json, text/javascript, */*")

	res, err = httpClientSkipSSL.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return interfaces.LogHTTPError(res, err)
	}

	// This should be a JSON document

	defer res.Body.Close()
	b2, _ := ioutil.ReadAll(res.Body)
	log.Info(string(b2))

	// Get the main data

	//
	// 	utf8:✓
	// authenticity_token:qar+pk+xB6wlRyIv1sz9uSWWNrte9Skdg2F1K18CVpmuye80Y61SCHh0Et0lpibdhd65LwR3gKFqgQt4XzGS9w==
	// user[email]:test@test.com
	// user[password]:password
	// user[remember_me]:0

	return nil
}

func getVelumSessionCookie(headers http.Header) string {
	cookie := headers.Get("Set-Cookie")

	// We only need the first part of the cookie, split by ;
	cookieParts := strings.Split(cookie, ";")
	cookie = cookieParts[0]
	log.Info(cookie)

	parts := strings.SplitAfter(cookie, "_velum_session=")
	log.Info(parts)
	cookie = parts[1]
	log.Info(cookie)

	return cookie
}

func setVelumSessionCookie(req *http.Request, cookie string) {
	c := &http.Cookie{Name: "_velum_session", Value: cookie}
	req.AddCookie(c)
}

func getCSRFToken(body string) string {
	tokenRegex := "<meta name=\\\"csrf-token\\\" content=\\\"([0-9a-zA-Z+-_/=]*)\\\""
	re, err := regexp.Compile(tokenRegex)
	if err != nil {
		return ""
	}

	reres := re.FindStringSubmatch(string(body))
	fmt.Printf("GOT: %v", reres)
	if len(reres) > 1 {
		return reres[1]
	}

	return ""
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

func (m *MetricsSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {

	// metricsProviders := make([]MetricsMetadata, 0)
	// // Go through the metrics endpoints and get the corresponding services from the token metadata
	// if metrics, ok := info.Endpoints[EndpointType]; ok {
	// 	for guid, endpoint := range metrics {
	// 		// Parse out the metadata
	// 		var m []MetricsProviderMetadata
	// 		err := json.Unmarshal([]byte(endpoint.Metadata), &m)
	// 		if err == nil {
	// 			for _, item := range m {
	// 				info := MetricsMetadata{}
	// 				info.EndpointGUID = endpoint.GUID
	// 				info.Type = item.Type
	// 				info.URL = item.URL
	// 				info.Job = item.Job
	// 				metricsProviders = append(metricsProviders, info)
	// 			}
	// 		}
	// 	}
	// }

	// // Map of endpoint types
	// for guid, ep := range info.Endpoints {
	// 	for _, metricProviderInfo := range metricsProviders {
	// 		// TODO: Depends on the type
	// 		if info.DopplerLoggingEndpoint == metricProviderInfo.URL {
	// 			ep.Metadata["metrics"] = "true"
	// 		}
	// 	}
	// }
}

func (m *MetricsSpecification) getMetricsEndpoints(userGUID string, cnsiList []string) (map[string]EndpointMetricsRelation, error) {

	metricsProviders := make([]MetricsMetadata, 0)
	endpointsMap := make(map[string]*interfaces.ConnectedEndpoint)
	results := make(map[string]EndpointMetricsRelation)

	userEndpoints, err := m.portalProxy.ListEndpointsByUser(userGUID)
	if err != nil {
		return nil, err
	}

	for _, endpoint := range userEndpoints {
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
			if info.DopplerLoggingEndpoint == metricProviderInfo.URL {
				log.Info("Found it")

				relate := EndpointMetricsRelation{}
				relate.endpoint = info
				relate.metrics = &metricProviderInfo
				results[guid] = relate
				delete(endpointsMap, guid)
				break
			}
		}
	}

	// If there are still items in the endpoints map, then we did not find all metric providers
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
