package kubernetes

import (
	"net/url"
	"strconv"

	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes/auth"
)

// KubernetesSpecification is the endpoint that adds Kubernetes support to the backend
type KubernetesSpecification struct {
	portalProxy  interfaces.PortalProxy
	endpointType string
}

const (
	kubeEndpointType    = "k8s"
	defaultKubeClientID = "K8S_CLIENT"

	// kubeDashboardPluginConfigSetting is config value send back to the client to indicate if the kube dashboard can be navigated to
	kubeDashboardPluginConfigSetting = "kubeDashboardEnabled"
)

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &KubernetesSpecification{portalProxy: portalProxy, endpointType: kubeEndpointType}, nil
}

func (c *KubernetesSpecification) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return c, nil
}

func (c *KubernetesSpecification) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return c, nil
}

func (c *KubernetesSpecification) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
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

func (c *KubernetesSpecification) Validate(userGUID string, cnsiRecord interfaces.CNSIRecord, tokenRecord interfaces.TokenRecord) error {
	log.Debugf("Validating Kubernetes endpoint connection for user: %s", userGUID)
	response, err := c.portalProxy.DoProxySingleRequest(cnsiRecord.GUID, userGUID, "GET", "api/v1/pods?limit=1", nil, nil)
	if err != nil {
		return err
	}

	if response.StatusCode >= 400 {
		return errors.New("Unable to connect to endpoint")
	}

	return nil
}

func (c *KubernetesSpecification) Connect(ec echo.Context, cnsiRecord interfaces.CNSIRecord, userID string) (*interfaces.TokenRecord, bool, error) {
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

	c.AddAuthProvider(auth.InitAWSKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitCertKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitAzureKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitOIDCKubeAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitKubeConfigAuth(c.portalProxy))
	c.AddAuthProvider(auth.InitKubeTokenAuth(c.portalProxy))

	// Kube dashboard is enabled by Tech Preview mode
	c.portalProxy.GetConfig().PluginConfig[kubeDashboardPluginConfigSetting] = strconv.FormatBool(c.portalProxy.GetConfig().EnableTechPreview)

	return nil
}

func (c *KubernetesSpecification) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (c *KubernetesSpecification) AddSessionGroupRoutes(echoGroup *echo.Group) {

	// Kubernetes Dashboard Proxy
	echoGroup.GET("/kubedash/ui/:guid/*", c.kubeDashboardProxy)
	echoGroup.GET("/kubedash/:guid/status", c.kubeDashboardStatus)

	// Helm Routes
	echoGroup.GET("/helm/releases", c.ListReleases)
	echoGroup.POST("/helm/install", c.InstallRelease)
	echoGroup.GET("/helm/versions", c.GetHelmVersions)
	echoGroup.DELETE("/helm/releases/:endpoint/:name", c.DeleteRelease)
	echoGroup.GET("/helm/releases/:endpoint/:name", c.GetRelease)
}

func (c *KubernetesSpecification) Info(apiEndpoint string, skipSSLValidation bool) (interfaces.CNSIRecord, interface{}, error) {
	log.Debug("Kubernetes Info")
	var v2InfoResponse interfaces.V2Info
	var newCNSI interfaces.CNSIRecord

	newCNSI.CNSIType = kubeEndpointType

	_, err := url.Parse(apiEndpoint)
	if err != nil {
		return newCNSI, nil, err
	}

	newCNSI.TokenEndpoint = apiEndpoint
	newCNSI.AuthorizationEndpoint = apiEndpoint

	return newCNSI, v2InfoResponse, nil
}

func (c *KubernetesSpecification) UpdateMetadata(info *interfaces.Info, userGUID string, echoContext echo.Context) {
}
