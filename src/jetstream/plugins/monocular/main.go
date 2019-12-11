package monocular

import (
	"errors"
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/helm/monocular/chartsvc"
)

const (
	helmEndpointType = "helm"
)

const prefix = "/pp/v1/chartsvc/"

// Monocular is a plugin for Monocular
type Monocular struct {
	portalProxy    interfaces.PortalProxy
	chartSvcRoutes http.Handler
	RepoQueryStore chartsvc.ChartSvcDatastore
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

	if !m.portalProxy.GetConfig().EnableTechPreview {
		return errors.New("Feature is in Tech Preview")
	}
	fdbURL := "fdb service name"
	fDB := "monocular-plugin"
	debug := false
	m.ConfigureChartSVC(&fdbURL, &fDB, &debug)
	m.chartSvcRoutes = chartsvc.GetRoutes()
	m.InitSync()
	m.syncOnStartup()
	return nil
}

func (m *Monocular) syncOnStartup() {

	// Get the repositories that we currently have
	repos, err := m.RepoQueryStore.ListRepositories()
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

// func (m *Monocular) ConfigureMonocular() error {
//     log.Info("Connecting to MongoDB...")

//     var host = "127.0.0.1"
//     var db = "monocular"
//     var user = "mongoadmin"
//     var password = "secret"

//     session, err := chartsvc.SetMongoConfig(&host, &db, &user, password)
//     if err != nil {
//             log.Warn("Could not connect to MongoDB")
//             return err
//     }

//     store, err := chartsvc.NewMongoDBChartSvcDatastore(session)
//     if err != nil {
//             return err
//     }
//     chartsvc.SetStore(store)
//     m.QueryStore = store

//     syncStore, err := chartrepo.NewMongoDBChartRepoDatastore(session)
//     if err != nil {
//             return err
//     }
//     m.Store = syncStore
//     log.Info("Connected to MongoDB")

//     return nil
// }

func (m *Monocular) ConfigureSQL() error {

	log.Info("Connecting to SQL Repo store")

	InitRepositoryProvider(m.portalProxy.GetConfig().DatabaseProviderName)

	sqldbStore, err := NewSQLDBCMonocularDatastore(m.portalProxy.GetDatabaseConnection())
	if err != nil {
		return err
	}

	m.RepoQueryStore = sqldbStore

	return nil
}

func (m *Monocular) ConfigureChartSVC(fdbURL *string, fDB *string, debug *bool) {
	chartsvc.InitFDBDocLayerConnection(fdbURL, fDB, debug)
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
	if strings.Index(path, prefix) == 0 {
		path = path[len(prefix)-1:]
		c.Request().URL.Path = path
	}
	m.chartSvcRoutes.ServeHTTP(c.Response().Writer, c.Request())
	return nil
}
