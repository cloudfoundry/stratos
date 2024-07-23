package monocular

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/monocular/store"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

const (
	helmEndpointType          = "helm"
	helmHubEndpointType       = "hub"
	helmRepoEndpointType      = "repo"
	stratosPrefix             = "/pp/v1/"
	kubeReleaseNameEnvVar     = "STRATOS_HELM_RELEASE"
	cacheFolderEnvVar         = "HELM_CACHE_FOLDER"
	defaultCacheFolder        = "./.helm-cache"
	artifactHubDisabledEnvVar = "ARTIFACT_HUB_DISABLED"
	artifactHubDisabled       = "artifactHubDisabled"
)

// Monocular is a plugin for Monocular
type Monocular struct {
	portalProxy     api.PortalProxy
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
	api.AddPlugin("monocular", []string{"kubernetes"}, Init)
}

// Init creates a new Monocular
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	store.InitRepositoryProvider(portalProxy.GetConfig().DatabaseProviderName)
	return &Monocular{portalProxy: portalProxy}, nil
}

// Init performs plugin initialization
func (m *Monocular) Init() error {
	log.Debug("Monocular init .... ")

	if val, ok := m.portalProxy.Env().Lookup(artifactHubDisabledEnvVar); ok {
		m.portalProxy.GetConfig().PluginConfig[artifactHubDisabled] = val
	} else {
		m.portalProxy.GetConfig().PluginConfig[artifactHubDisabled] = "false"
	}

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
				m.Sync(api.EndpointRegisterAction, ep)
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
func (m *Monocular) OnEndpointNotification(action api.EndpointAction, endpoint *api.CNSIRecord) {
	if endpoint.CNSIType == helmEndpointType && endpoint.SubType == helmRepoEndpointType {
		m.Sync(action, endpoint)
	} else if endpoint.CNSIType == helmEndpointType && endpoint.SubType == helmHubEndpointType && action == 1 {
		log.Debugf("Deleting Artifact Hub Cache: %s", endpoint.Name)
		m.deleteCacheForEndpoint(endpoint.GUID)
	}
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (m *Monocular) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (m *Monocular) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return m, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (m *Monocular) GetRoutePlugin() (api.RoutePlugin, error) {
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

	echoGroup.Any("/monocular/values/:endpoint/:repo/:name/:version", m.getChartValues)

	// API for Helm Chart Repositories - sync and sync status
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

// isExternalMonocularRequest .. Should this request go out to an external monocular instance? IF so returns external monocular endpoint
func (m *Monocular) isExternalMonocularRequest(c echo.Context) (*api.CNSIRecord, error) {
	cnsiList := strings.Split(c.Request().Header.Get("x-cap-cnsi-list"), ",")

	// If this has a cnsi then test if it for an external monocular instance
	if len(cnsiList) == 1 && len(cnsiList[0]) > 0 {
		return m.validateExternalMonocularEndpoint(cnsiList[0])
	}

	return nil, nil
}

// validateExternalMonocularEndpoint .. Is this endpoint related to an external moncular instance (not stratos's)
func (m *Monocular) validateExternalMonocularEndpoint(cnsi string) (*api.CNSIRecord, error) {
	endpoint, err := m.portalProxy.GetCNSIRecord(cnsi)
	if err != nil {
		err := errors.New("Failed to fetch endpoint")
		return nil, echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if endpoint.CNSIType == helmEndpointType && endpoint.SubType != helmRepoEndpointType {
		return &endpoint, nil
	}

	if m.portalProxy.GetConfig().PluginConfig[artifactHubDisabled] != "true" {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, errors.New("Artifact Hub is disabled"))
	}

	return nil, nil
}
