package monocular

import (
	"errors"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular/store"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

const (
	helmEndpointType      = "helm"
	helmHubEndpointType   = "hub"
	helmRepoEndpointType  = "repo"
	stratosPrefix         = "/pp/v1/"
	kubeReleaseNameEnvVar = "STRATOS_HELM_RELEASE"
	cacheFolderEnvVar     = "HELM_CACHE_FOLDER"
	defaultCacheFolder    = "./.helm-cache"
)

// Monocular is a plugin for Monocular
type Monocular struct {
	portalProxy     interfaces.PortalProxy
	chartSvcRoutes  http.Handler
	ChartStore      store.ChartStore
	FoundationDBURL string
	SyncServiceURL  string
	devSyncPID      int
	CacheFolder     string
}

type HelmHubChart struct {
	APIResponse
	Attributes *ChartVersion `json:"attributes"`
}

type HelmHubChartResponse struct {
	Data HelmHubChart `json:"data"`
}

func init() {
	interfaces.AddPlugin("monocular", []string{"kubernetes"}, Init)
}

// Init creates a new Monocular
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	store.InitRepositoryProvider(portalProxy.GetConfig().DatabaseProviderName)
	return &Monocular{portalProxy: portalProxy}, nil
}

// Init performs plugin initialization
func (m *Monocular) Init() error {
	log.Debug("Monocular init .... ")

	m.CacheFolder = m.portalProxy.Env().String(cacheFolderEnvVar, defaultCacheFolder)
	folder, err := filepath.Abs(m.CacheFolder)
	if err != nil {
		return err
	}
	m.CacheFolder = folder
	log.Infof("Using Cache folder: %s", m.CacheFolder)

	// Check that the folder exists - try to make it, if not
	if _, err := os.Stat(m.CacheFolder); os.IsNotExist(err) {
		log.Info("Helm Cache folder does not exist - creating")
		if err := os.MkdirAll(m.CacheFolder, os.ModePerm); err != nil {
			log.Warn("Could not create folder for Helm Cache")
			return err
		}
	}

	store, err := store.NewHelmChartDBStore(m.portalProxy.GetDatabaseConnection())
	if err != nil {
		log.Errorf("Can not get Helm Chart store: %s", err)
		return err
	}

	m.ChartStore = store

	m.InitSync()
	m.syncOnStartup()
	return nil
}

// Destroy does any cleanup for the plugin on exit
func (m *Monocular) Destroy() {
	log.Debug("Monocular plugin .. destroy")
}

func (m *Monocular) syncOnStartup() {
	// Always sync all repositories on startup

	// Get all of the helm endpoints
	endpoints, err := m.portalProxy.ListEndpoints()
	if err != nil {
		log.Errorf("Chart Repository Startup: Unable to sync repositories: %v+", err)
		return
	}

	helmRepos := make(map[string]bool)
	for _, ep := range endpoints {
		if ep.CNSIType == helmEndpointType {
			if ep.SubType == helmRepoEndpointType {
				helmRepos[ep.GUID] = true
				m.Sync(interfaces.EndpointRegisterAction, ep)
			} else {
				metadata := "{}"
				m.portalProxy.UpdateEndpointMetadata(ep.GUID, metadata)
			}
		}
	}

	// Delete any endpoints left in the chart store that are no longer registered
	// Get all of the endpoints that we have in the Database Chart Store
	existing, err := m.ChartStore.GetEndpointIDs()
	if err == nil {
		for _, id := range existing {
			if _, ok := helmRepos[id]; !ok {
				log.Warnf("Endpoint ID %s exists in the Chart Store but does not exist as an endpoint - deleting", id)
				m.deleteChartStoreForEndpoint(id)
			}
		}
	}
}

// ArrayContainsString checks the string array to see if it contains the specifed value
func arrayContainsString(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}
	return false
}

// OnEndpointNotification handles notification that endpoint has been remoevd
func (m *Monocular) OnEndpointNotification(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {
	if endpoint.CNSIType == helmEndpointType && endpoint.SubType == helmRepoEndpointType {
		m.Sync(action, endpoint)
	}
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (m *Monocular) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (m *Monocular) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return m, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (m *Monocular) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return m, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (m *Monocular) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (m *Monocular) AddSessionGroupRoutes(echoGroup *echo.Group) {

	// ArtifactHub Icon - always get a specific version
	echoGroup.Any("/monocular/:guid/chartsvc/v1/hub/assets/:repo/:name/:version/logo", m.artifactHubGetIcon)

	// API for Helm Chart Repositories - sync and sync status
	// Reach out to a monocular instance other than Stratos (like helm hub). This is usually done via `x-cap-cnsi-list`
	// however cannot be done for things like img src
	echoGroup.Any("/monocular/:guid/chartsvc/", m.handleMonocularInstance)

	echoGroup.Any("/monocular/schema/:name/:encodedChartURL", m.checkForJsonSchema)
	echoGroup.Any("/monocular/values/:endpoint/:repo/:name/:version", m.getChartValues)

	echoGroup.POST("/chartrepos/:guid", m.syncRepo)
	echoGroup.POST("/chartrepos/status", m.getRepoStatuses)

	// Routes for Chart Store
	chartSvcGroup := echoGroup.Group("/chartsvc")

	// Routes for the internal chart store

	// Get specific chart version file (used for values.yaml)
	chartSvcGroup.GET("/v1/assets/:repo/:name/versions/:version/:filename", m.getChartAndVersionFile)

	// Get specific chart version file
	chartSvcGroup.GET("/v1/charts/:repo/:name/versions/:version/files/:filename", m.getChartAndVersionFile)

	// Get specific chart version of a chart
	chartSvcGroup.GET("/v1/charts/:repo/:name/versions/:version", m.getChartVersion)

	// Get chart versions
	chartSvcGroup.GET("/v1/charts/:repo/:name/versions", m.getChartVersions)

	// Get a chart
	chartSvcGroup.GET("/v1/charts/:repo/:name", m.getChart)

	// // Get list of charts
	chartSvcGroup.GET("/v1/charts", m.listCharts)

	// Get the chart icon for a specific version
	chartSvcGroup.GET("/v1/assets/:repo/:chartName/:version/logo", m.getIcon)

	// Get the chart icon
	chartSvcGroup.GET("/v1/assets/:repo/:chartName/logo", m.getIcon)

	// ArtifactHub
	chartSvcGroup.Any("/v1/hub/:endpoint/:repo/:name/:version/:file", m.artifactHubGetChartFile)

}

// Check if the request if for an external Monocular instance and handle it if so
func (m *Monocular) processMonocularRequest(c echo.Context) (bool, error) {
	externalMonocularEndpoint, err := m.isExternalMonocularRequest(c)
	if err != nil {
		return true, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// If this request is associated with an external monocular instance forward the request on to it
	if externalMonocularEndpoint != nil {
		return true, m.baseHandleMonocularInstance(c, externalMonocularEndpoint)
	}
	return false, nil
}

// isExternalMonocularRequest .. Should this request go out to an external monocular instance? IF so returns external monocular endpoint
func (m *Monocular) isExternalMonocularRequest(c echo.Context) (*interfaces.CNSIRecord, error) {
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")

	// If this has a cnsi then test if it for an external monocular instance
	if len(cnsiList) == 1 && len(cnsiList[0]) > 0 {
		return m.validateExternalMonocularEndpoint(cnsiList[0])
	}

	return nil, nil
}

// validateExternalMonocularEndpoint .. Is this endpoint related to an external moncular instance (not stratos's)
func (m *Monocular) validateExternalMonocularEndpoint(cnsi string) (*interfaces.CNSIRecord, error) {
	endpoint, err := m.portalProxy.GetCNSIRecord(cnsi)
	if err != nil {
		err := errors.New("Failed to fetch endpoint")
		return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if endpoint.CNSIType == helmEndpointType && endpoint.SubType != helmRepoEndpointType {
		return &endpoint, nil
	}

	return nil, nil
}

func (m *Monocular) handleMonocularInstance(c echo.Context) error {
	log.Debug("handleMonocularInstance")
	guid := c.Param("guid")
	monocularEndpoint, err := m.validateExternalMonocularEndpoint(guid)
	if monocularEndpoint == nil || err != nil {
		err := errors.New("No monocular endpoint")
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return m.baseHandleMonocularInstance(c, monocularEndpoint)
}

func removeBreakingHeaders(oldRequest, emptyRequest *http.Request) {
	for k, v := range oldRequest.Header {
		switch {
		// Skip these
		//  - "Referer" causes CF to fail with a 403
		//  - "Connection", "X-Cap-*" and "Cookie" are consumed by us
		//  - "Accept-Encoding" must be excluded otherwise the transport will expect us to handle the encoding/compression
		//  - X-Forwarded-* headers - these will confuse Cloud Foundry in some cases (e.g. load balancers)
		case k == "Connection", k == "Cookie", k == "Referer", k == "Accept-Encoding",
			strings.HasPrefix(strings.ToLower(k), "x-cap-"),
			strings.HasPrefix(strings.ToLower(k), "x-forwarded-"):

		// Forwarding everything else
		default:
			emptyRequest.Header[k] = v
		}
	}
}

// baseHandleMonocularInstance ..  Forward request to monocular of endpoint
func (m *Monocular) baseHandleMonocularInstance(c echo.Context, monocularEndpoint *interfaces.CNSIRecord) error {
	log.Debug("baseHandleMonocularInstance")
	// Generic proxy is handled last, after plugins.

	if monocularEndpoint == nil {
		err := errors.New("No monocular endpoint")
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// We should be able to use `DoProxySingleRequest`, which goes through to `doRequest`, however the actual forwarded request is handled
	// by the 'authHandler' associated with the endpoint OR defaults to an OAuth request. For this case there's no auth at all so falls over.
	// Tracked in https://github.com/SUSE/stratos/issues/466

	// Helm Hub has been replaced with ArtifactHub

	path := c.Request().URL.Path
	destURL := monocularEndpoint.APIEndpoint
	log.Debug("URL to monocular requested: %v", path)
	if strings.Index(path, stratosPrefix) == 0 {
		// drop stratos pp/v1
		path = path[len(stratosPrefix)-1:]

		// drop leading slash
		if path[0] == '/' {
			path = path[1:]
		}

		// drop monocular/:guid
		parts := strings.Split(path, "/")
		if parts[0] == "monocular" {
			parts = parts[2:]
		}

		path = "/" + strings.Join(parts, "/")
	}

	return m.proxyToMonocularInstance(c, destURL, path)
}

func (m *Monocular) proxyToMonocularInstance(c echo.Context, dest *url.URL, path string) error {
	log.Debugf("URL to monocular: %v", dest.String())
	dest.Path += path

	req, err := http.NewRequest(c.Request().Method, dest.String(), nil)
	removeBreakingHeaders(c.Request(), req)

	client := &http.Client{Timeout: 30 * time.Second}
	res, err := client.Do(req)

	if err != nil {
		c.Response().Status = 500
		c.Response().Write([]byte(err.Error()))
	} else if res.Body != nil {
		c.Response().Status = res.StatusCode
		c.Response().Header().Set("Content-Type", res.Header.Get("Content-Type"))
		body, _ := ioutil.ReadAll(res.Body)
		c.Response().Write(body)
		defer res.Body.Close()
	} else {
		c.Response().Status = 200
	}

	return nil
}
