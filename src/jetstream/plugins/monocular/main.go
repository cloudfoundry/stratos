package monocular

import (
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
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
	foundationDBURLEnvVar = "FDB_URL"
	syncServerURLEnvVar   = "SYNC_SERVER_URL"
	caCertEnvVar          = "MONOCULAR_CA_CRT_PATH"
	tlsKeyEnvVar          = "MONOCULAR_KEY_PATH"
	tLSCertEnvVar         = "MONOCULAR_CRT_PATH"
	localDevEnvVar        = "FDB_LOCAL_DEV"
	chartSyncBasePort     = 45000
)

// Monocular is a plugin for Monocular
type Monocular struct {
	portalProxy     interfaces.PortalProxy
	chartSvcRoutes  http.Handler
	RepoQueryStore  *chartsvc.ChartSvcDatastore
	FoundationDBURL string
	SyncServiceURL  string
	devSyncPID      int
}

// Init creates a new Monocular
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &Monocular{portalProxy: portalProxy}, nil
}

// GetChartStore gets the chart store
func (m *Monocular) GetChartStore() *chartsvc.ChartSvcDatastore {
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
	TLSCertPath, _ := m.portalProxy.Env().Lookup(tLSCertEnvVar)
	tlsKeyPath, _ := m.portalProxy.Env().Lookup(tlsKeyEnvVar)
	m.ConfigureChartSVC(&fdbURL, &fDB, caCertPath, TLSCertPath, tlsKeyPath, &debug)
	m.chartSvcRoutes = chartsvc.SetupRoutes()
	m.InitSync()
	m.syncOnStartup()
	return nil
}

// Destroy does any cleanup for the plugin on exit
func (m *Monocular) Destroy() {
	log.Debug("Monocular plugin .. destroy")
	if m.devSyncPID != 0 {
		log.Info("... Stopping chart sync tool")
		if p, err := os.FindProcess(m.devSyncPID); err == nil {
			p.Kill()
		} else {
			log.Error("Could not find process for the chart sync tool")
		}
	}
}

func (m *Monocular) configure() error {

	// Env var lookup for Monocular services
	m.FoundationDBURL = m.portalProxy.Env().String(foundationDBURLEnvVar, "")
	m.SyncServiceURL = m.portalProxy.Env().String(syncServerURLEnvVar, "")

	if fdbPort, isLocal := m.portalProxy.Env().Lookup(localDevEnvVar); isLocal {
		// Create a random port to use for the chart sync service
		devSyncPort := chartSyncBasePort + rand.Intn(5000)
		m.FoundationDBURL = fmt.Sprintf("mongodb://127.0.0.1:%s", fdbPort)
		m.SyncServiceURL = fmt.Sprintf("http://127.0.0.1:%d", devSyncPort)

		// Run the chartrepo tool
		dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
		if err != nil {
			log.Error("Can not get folder of current process")
		}
		chartSyncTool := filepath.Join(dir, "plugins", "monocular", "chart-repo", "chartrepo")
		cmd := exec.Command(chartSyncTool, "serve", fmt.Sprintf("--doclayer-url=%s", m.FoundationDBURL))
		cmd.Env = make([]string, 1)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Env[0] = fmt.Sprintf("PORT=%d", devSyncPort)
		if err = cmd.Start(); err != nil {
			log.Fatalf("Error starting chart sync tool: %+v", err)
		} else {
			m.devSyncPID = cmd.Process.Pid
		}
	}

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
	m.RepoQueryStore = chartsvc.InitFDBDocLayerConnection(fdbURL, fDB, &tlsEnabled, cACertFile, certFile, keyFile, debug)

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
	echoGroup.POST("/chartrepos/status", m.GetRepoStatuses)
	echoGroup.POST("/chartrepos/:guid", m.SyncRepo)
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
