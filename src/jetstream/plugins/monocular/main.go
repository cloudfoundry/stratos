package monocular

import (
	"errors"
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/helm/monocular/chartsvc"
	"github.com/helm/monocular/chartsvc/foundationdb"
)

const (
	helmEndpointType      = "helm"
	prefix                = "/pp/v1/chartsvc/"
	kubeReleaseNameEnvVar = "STRATOS_HELM_RELEASE"
	foundationDBURLEnvVar = "HELM_FDB_URL"
	syncServerURLEnvVar   = "HELM_SYNC_SERVER_URL"
	// e.g. MY_CONSOLE_FDBDOCLAYER_FDBDOCLAYER_PORT=tcp://10.105.215.71:27016
	fdbHostPortEnvVar = "FDBDOCLAYER_PORT"
	//MY_CONSOLE_CHARTREPO_PORT=tcp://10.108.171.246:8080
	syncServerHostPortEnvVar = "CHARTREPO_PORT"
	caCertEnvVar             = "MONOCULAR_CA_CRT_PATH"
	tlsKeyEnvVar             = "MONOCULAR_KEY_PATH"
	TLSCertEnvVar            = "MONOCULAR_CRT_PATH"
)

// Monocular is a plugin for Monocular
type Monocular struct {
	portalProxy     interfaces.PortalProxy
	chartSvcRoutes  http.Handler
	RepoQueryStore  chartsvc.ChartSvcDatastore
	FoundationDBURL string
	SyncServiceURL  string
}

// Init creates a new Monocular
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &Monocular{portalProxy: portalProxy}, nil
}

func (m *Monocular) GetChartStore() chartsvc.ChartSvcDatastore {
	return m.RepoQueryStore
}

// Init performs plugin initialization
func (m *Monocular) Init() error {
	log.Debug("Monocular init .... ")
	if err := m.configure(); err != nil {
		return err
	}

	fdbURL := m.FoundationDBURL
	fDB := "monocular-plugin"
	debug := false
	caCertPath, _ := m.portalProxy.Env().Lookup(caCertEnvVar)
	TLSCertPath, _ := m.portalProxy.Env().Lookup(TLSCertEnvVar)
	tlsKeyPath, _ := m.portalProxy.Env().Lookup(tlsKeyEnvVar)
	m.ConfigureChartSVC(&fdbURL, &fDB, caCertPath, TLSCertPath, tlsKeyPath, &debug)
	m.chartSvcRoutes = chartsvc.SetupRoutes()
	m.InitSync()
	m.syncOnStartup()
	return nil
}

func (m *Monocular) configure() error {

	// Env var lookup for Monocular services
	m.FoundationDBURL = m.portalProxy.Env().String(foundationDBURLEnvVar, "")
	m.SyncServiceURL = m.portalProxy.Env().String(syncServerURLEnvVar, "")

	log.Debugf("Foundation DB : %s", m.FoundationDBURL)
	log.Debugf("Sync Server   : %s", m.SyncServiceURL)

	if len(m.FoundationDBURL) == 0 || len(m.SyncServiceURL) == 0 {
		return errors.New("Helm Monocular DB and/or Sync server are not configured")
	}

	return nil
}

func getReleaseNameEnvVarPrefix(name string) string {
	prefix := strings.ToUpper(name)
	prefix = strings.ReplaceAll(prefix, "-", "_")
	return prefix
}

func (m *Monocular) syncOnStartup() {

	// Get the repositories that we currently have
	repos, err := foundationdb.ListRepositories()
	if err != nil {
		log.Errorf("Chart Repostiory Startup: Unable to sync repositories: %v+", err)
		return
	}

	// Get all of the helm endpoints
	endpoints, err := m.portalProxy.ListEndpoints()
	if err != nil {
		log.Errorf("Chart Repostiory Startup: Unable to sync repositories: %v+", err)
		return
	}

	helmRepos := make([]string, 0)
	for _, ep := range endpoints {
		if ep.CNSIType == helmEndpointType {
			helmRepos = append(helmRepos, ep.Name)

			// Is this an endpoint that we don't have charts for ?
			if !arrayContainsString(repos, ep.Name) {
				log.Infof("Syncing helm repository to chart store: %s", ep.Name)
				m.Sync(interfaces.EndpointRegisterAction, ep)
			}
		}
	}

	// Now delete any repositories that are no longer registered as endpoints
	for _, repo := range repos {
		if !arrayContainsString(helmRepos, repo) {
			log.Infof("Removing helm repository from chart store: %s", repo)
			endpoint := &interfaces.CNSIRecord{
				GUID:     repo,
				Name:     repo,
				CNSIType: helmEndpointType,
			}
			m.Sync(interfaces.EndpointUnregisterAction, endpoint)
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

func (m *Monocular) ConfigureChartSVC(fdbURL *string, fDB *string, cACertFile string, certFile string, keyFile string, debug *bool) error {
	//TLS options must either be all set to enabled TLS, or none set to disable TLS
	var tlsEnabled = cACertFile != "" && keyFile != "" && certFile != ""
	if !(tlsEnabled || (cACertFile == "" && keyFile == "" && certFile == "")) {
		return errors.New("To enable TLS, all 3 TLS cert paths must be set.")
	}
	chartsvc.InitFDBDocLayerConnection(fdbURL, fDB, &tlsEnabled, cACertFile, certFile, keyFile, debug)
	return nil
}

func (m *Monocular) OnEndpointNotification(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {
	if endpoint.CNSIType == helmEndpointType {
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
	// API for Helm Chart Repositories
	echoGroup.GET("/chartrepos", m.ListRepos)
	echoGroup.Any("/chartsvc/*", m.handleAPI)
}

// Forward requests to the Chart Service API
func (m *Monocular) handleAPI(c echo.Context) error {
	// Modify the path to remove our prefix for the Chart Service API
	path := c.Request().URL.Path
	log.Debugf("URL to chartsvc requested: %v", path)
	if strings.Index(path, prefix) == 0 {
		path = path[len(prefix)-1:]
		c.Request().URL.Path = path
	}
	log.Debugf("URL to chartsvc requested after modification: %v", path)
	m.chartSvcRoutes.ServeHTTP(c.Response().Writer, c.Request())
	return nil
}
