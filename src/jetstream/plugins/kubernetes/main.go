package kubernetes

import (
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"

	"errors"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes/auth"

	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/kubernetes/terminal"
)

// KubernetesSpecification is the endpoint that adds Kubernetes support to the backend
type KubernetesSpecification struct {
	portalProxy  api.PortalProxy
	endpointType string
	kubeTerminal *terminal.KubeTerminal
}

type KubeStatus struct {
	Kind       string      `json:"kind"`
	ApiVersion string      `json:"apiVersion"`
	Metadata   interface{} `json:"metadata"`
	Status     string      `json:"status"`
	Message    string      `json:"message"`
	Reason     string      `json:"reason"`
	Details    interface{} `json:"details"`
	Code       int         `json:"code"`
}

type kubeErrorStatus struct {
	Type    string `json:"type"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

type KubeAPIVersions struct {
	Kind                       string        `json:"kind"`
	Versions                   []string      `json:"versions"`
	ServerAddressByClientCIDRs []interface{} `json:"serverAddressByClientCIDRs"`
}

const (
	kubeEndpointType    = "k8s"
	defaultKubeClientID = "K8S_CLIENT"

	// kubeDashboardPluginConfigSetting is config value sent back to the client to indicate if the kube dashboard ie enabled
	kubeDashboardPluginConfigSetting = "kubeDashboardEnabled"
	// kubeTerminalPluginConfigSetting is config value sent back to the client to indicate if the kube terminal is enabled
	kubeTerminalPluginConfigSetting = "kubeTerminalEnabled"
)

func init() {
	api.AddPlugin("kubernetes", nil, Init)
}

// Init creates a new instance of the Kubernetes plugin
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	kubeTerminal := terminal.NewKubeTerminal(portalProxy)
	kube := &KubernetesSpecification{portalProxy: portalProxy, endpointType: kubeEndpointType, kubeTerminal: kubeTerminal}
	if kubeTerminal != nil {
		kubeTerminal.Kube = kube
	}
	return kube, nil
}

func (c *KubernetesSpecification) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return c, nil
}

func (c *KubernetesSpecification) GetRoutePlugin() (api.RoutePlugin, error) {
	return c, nil
}

func (c *KubernetesSpecification) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (c *KubernetesSpecification) GetType() string {
	return kubeEndpointType
}

func (c *KubernetesSpecification) GetClientId() string {
	return c.portalProxy.Env().String(defaultKubeClientID, "k8s")
}

func (c *KubernetesSpecification) Register(echoContext echo.Context) error {
	log.Debug("Kubernetes Register...")
	return c.portalProxy.RegisterEndpoint(echoContext, c.Info)
}

func (c *KubernetesSpecification) Validate(userGUID string, cnsiRecord api.CNSIRecord, tokenRecord api.TokenRecord) error {
	log.Debugf("Validating Kubernetes endpoint connection for user: %s", userGUID)
	response, err := c.portalProxy.DoProxySingleRequest(cnsiRecord.GUID, userGUID, "GET", "api/v1/pods?limit=1", nil, nil)
	if err != nil {
		return err
	}

	if response.StatusCode >= 400 {
		if response.Error != nil {
			return fmt.Errorf("Unable to connect to endpoint: %s", response.Error.Error())
		}
		return fmt.Errorf("Unable to connect to endpoint: %d => %s", response.StatusCode, response.Status)
	}

	return nil
}

func (c *KubernetesSpecification) Connect(ec echo.Context, cnsiRecord api.CNSIRecord, userID string) (*api.TokenRecord, bool, error) {
	log.Debug("Kubernetes Connect...")

	connectType := ec.FormValue("connect_type")

	var authProvider = c.FindAuthProvider(connectType)
	if authProvider == nil {
		return nil, false, errors.New("Unsupported Auth connection type for Kubernetes endpoint")
	}

	tokenRecord, _, err := authProvider.FetchToken(cnsiRecord, ec)
	if err != nil {
		return nil, false, err
	}

	return tokenRecord, false, nil
}

// Init the Kubernetes Jetstream plugin
func (c *KubernetesSpecification) Init() error {

	c.AddAuthProvider(auth.InitGKEKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitAWSKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitCertKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitAzureKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitOIDCKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitKubeConfigAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitKubeTokenAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitKubeBasicAuth(c.portalProxy))

	// Kube dashboard is enabled by Tech Preview mode
	c.portalProxy.GetConfig().PluginConfig[kubeDashboardPluginConfigSetting] = strconv.FormatBool(c.portalProxy.GetConfig().EnableTechPreview)

	// Kube terminal is enabled by Tech Preview mode AND the configuration being complete
	c.portalProxy.GetConfig().PluginConfig[kubeTerminalPluginConfigSetting] = strconv.FormatBool(c.portalProxy.GetConfig().EnableTechPreview && c.kubeTerminal != nil)

	// Kick off the cleanup of any old kube terminal pods
	if c.kubeTerminal != nil {
		c.kubeTerminal.StartCleanup()
	}

	return nil
}

func (c *KubernetesSpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/kube/cert", c.RequiresCert)
}

func (c *KubernetesSpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {

	// Kubernetes Dashboard Proxy
	echoGroup.Any("/apps/kubedash/ui/:guid/*", c.kubeDashboardProxy)

	echoGroup.GET("/kubedash/:guid/login", c.kubeDashboardLogin)
	echoGroup.GET("/kubedash/:guid/status", c.kubeDashboardStatus)

	echoGroup.POST("/kubedash/:guid/serviceAccount", c.kubeDashboardCreateServiceAccount)
	echoGroup.DELETE("/kubedash/:guid/serviceAccount", c.kubeDashboardDeleteServiceAccount)

	echoGroup.POST("/kubedash/:guid/installation", c.kubeDashboardInstallDashboard)
	echoGroup.DELETE("/kubedash/:guid/installation", c.kubeDashboardDeleteDashboard)

	// Helm Routes
	echoGroup.GET("/helm/releases", c.ListReleases)
	echoGroup.POST("/helm/install", c.InstallRelease)
	echoGroup.DELETE("/helm/releases/:endpoint/:namespace/:name", c.DeleteRelease)
	echoGroup.GET("/helm/releases/:endpoint/:namespace/:name/history", c.GetReleaseHistory)
	echoGroup.GET("/helm/releases/:endpoint/:namespace/:name/status", c.GetReleaseStatus)
	echoGroup.GET("/helm/releases/:endpoint/:namespace/:name", c.GetRelease)
	echoGroup.POST("/helm/releases/:endpoint/:namespace/:name", c.UpgradeRelease)

	// Kube Terminal
	if c.kubeTerminal != nil {
		echoGroup.GET("/kubeterminal/:guid", c.kubeTerminal.Start)
	}
}

func (c *KubernetesSpecification) Info(apiEndpoint string, skipSSLValidation bool, caCert string) (api.CNSIRecord, interface{}, error) {

	log.Debug("Kubernetes Info")
	var v2InfoResponse api.V2Info
	var newCNSI api.CNSIRecord

	newCNSI.CNSIType = kubeEndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	log.Debug("Request Kube API Versions")
	var httpClient = c.portalProxy.GetHttpClient(skipSSLValidation, caCert)
	res, err := httpClient.Get(apiEndpoint + "/api")
	if err != nil {
		// This should ultimately catch 503 cert errors
		return newCNSI, nil, err
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return newCNSI, nil, err
	}

	if res.StatusCode < 400 {
		// No auth on kube set up, expect a successful APIVersions response - KubeAPIVersions
		log.Debug("Kube API Versions Succeeded")
		apiVersions := KubeAPIVersions{}
		err := json.Unmarshal(body, &apiVersions)
		if err != nil {
			return newCNSI, nil, fmt.Errorf("Failed to parse output as kube kind APIVersions: %+v", err)
		}
		if apiVersions.Kind != "APIVersions" {
			return newCNSI, nil, fmt.Errorf("Failed to parse output as kube kind APIVersions: %+v", apiVersions)
		}
	} else if res.StatusCode == 403 || res.StatusCode == 401 {
		err := parseErrorResponse(body)
		if err != nil {
			return newCNSI, nil, fmt.Errorf("Failed to parse output as kube kind status: %+v", err)
		}
	} else {
		return newCNSI, nil, fmt.Errorf("Dissallowed response code from `/api` call: %+v", res.StatusCode)
	}

	log.Debug("Kube API Versions Acceptable Response")
	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

func parseErrorResponse(body []byte) error {
	kubeStatus := KubeStatus{}
	err := json.Unmarshal(body, &kubeStatus)
	if err == nil {
		// Expect a json message with a status
		if kubeStatus.Kind == "Status" {
			return nil
		}
	}

	// Try the other format
	errorStatus := kubeErrorStatus{}
	err = json.Unmarshal(body, &errorStatus)
	if err == nil {
		// Expect the type to be error
		if errorStatus.Type == "error" {
			return nil
		}
	}

	// Not one of the types we recognise

	log.Debug(string(body))
	return errors.New("Could not understand response from Kubernetes endpoint")
}

func (c *KubernetesSpecification) UpdateMetadata(info *api.Info, userGUID string, echoContext echo.Context) {
}

func (c *KubernetesSpecification) RequiresCert(ec echo.Context) error {
	url := ec.QueryParam("url")

	log.Debug("Request Kube API Versions")
	var httpClient = c.portalProxy.GetHttpClient(false, "")
	_, err := httpClient.Get(url + "/api")
	var response struct {
		Status   int
		Required bool
		Error    bool
		Message  string
	}
	if err != nil {
		if errors.Is(err, new(x509.CertificateInvalidError)) {
			response.Status = http.StatusOK
			response.Required = true
		} else {
			response.Status = http.StatusInternalServerError
			response.Error = true
			response.Message = fmt.Sprintf("Failed to validate Kube certificate requirement: %+v", err)
		}
	} else {
		response.Status = http.StatusOK
		response.Required = false
	}
	return ec.JSON(response.Status, response)
}
