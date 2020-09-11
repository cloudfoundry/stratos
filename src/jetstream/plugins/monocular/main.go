package monocular

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"

	"github.com/helm/monocular/chartsvc"
	"github.com/helm/monocular/chartsvc/foundationdb"
	"github.com/helm/monocular/chartsvc/models"
	"github.com/helm/monocular/chartsvc/utils"
)

const (
	helmEndpointType      = "helm"
	helmHubEndpointType   = "hub"
	helmRepoEndpointType  = "repo"
	stratosPrefix         = "/pp/v1/"
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

type HelmHubChart struct {
	utils.ApiResponse
	Attributes *models.ChartVersion `json:"attributes"`
}

type HelmHubChartResponse struct {
	Data HelmHubChart `json:"data"`
}

// Init creates a new Monocular
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &Monocular{portalProxy: portalProxy}, nil
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
		log.Errorf("Chart Repository Startup: Unable to sync repositories: %v+", err)
		return
	}

	// Get all of the helm endpoints
	endpoints, err := m.portalProxy.ListEndpoints()
	if err != nil {
		log.Errorf("Chart Repository Startup: Unable to sync repositories: %v+", err)
		return
	}

	helmRepos := make([]string, 0)
	for _, ep := range endpoints {
		if ep.CNSIType == helmEndpointType {
			if ep.SubType == helmRepoEndpointType {
				helmRepos = append(helmRepos, ep.Name)

				// Is this an endpoint that we don't have charts for ?
				if !arrayContainsString(repos, ep.Name) {
					log.Infof("Syncing helm repository to chart store: %s", ep.Name)
					m.Sync(interfaces.EndpointRegisterAction, ep)
				}
			} else {
				metadata := "{}"
				m.portalProxy.UpdateEndpointMetadata(ep.GUID, metadata)
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
	// Requests to Monocular Instances
	echoGroup.Any("/chartsvc/*", m.handleAPI)
	// Reach out to a monocular instance other than Stratos (like helm hub). This is usually done via `x-cap-cnsi-list`
	// however cannot be done for things like img src
	echoGroup.Any("/monocular/:guid/chartsvc/*", m.handleMonocularInstance)

	// API for Helm Chart Repositories
	echoGroup.GET("/chartrepos", m.ListRepos)
	echoGroup.POST("/chartrepos/status", m.GetRepoStatuses)
	echoGroup.POST("/chartrepos/:guid", m.SyncRepo)
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

// Forward requests to the Chart Service API
func (m *Monocular) handleAPI(c echo.Context) error {
	externalMonocularEndpoint, err := m.isExternalMonocularRequest(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// If this request is associated with an external monocular instance forward the request on to it
	if externalMonocularEndpoint != nil {
		return m.baseHandleMonocularInstance(c, externalMonocularEndpoint)
	}

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

	url := monocularEndpoint.APIEndpoint
	path := c.Request().URL.Path
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

		// Bring all back together
		url.Path += "/" + strings.Join(parts, "/")
	}
	log.Debugf("URL to monocular: %v", url.String())

	req, err := http.NewRequest(c.Request().Method, url.String(), nil)

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

// GetChartDownloadUrl ... Get the download url for the bits required to install the given chart
func (m *Monocular) GetChartDownloadUrl(monocularEndpoint, chartID, version string) (string, error) {
	if len(monocularEndpoint) > 0 {
		// Fetch the monocular endpoint for the url
		endpoint, err := m.validateExternalMonocularEndpoint(monocularEndpoint)
		if err != nil {
			return "", err
		}
		url := endpoint.APIEndpoint

		// Fetch the chart, this will give us the url to download the bits
		url.Path += "/chartsvc/v1/charts/" + chartID + "/versions/" + version
		req, err := http.NewRequest(http.MethodGet, url.String(), nil)
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		client := &http.Client{Timeout: 30 * time.Second}
		res, err := client.Do(req)
		if err != nil {
			return "", err
		} else if res.StatusCode >= 400 {
			return "", fmt.Errorf("Couldn't download monocular chart (%+v) from '%+v'", res.StatusCode, req.URL)
		} else if res.Body != nil {
			body, _ := ioutil.ReadAll(res.Body)
			defer res.Body.Close()

			// Reach into the chart response for the download URL
			chartVersionResponse := &HelmHubChartResponse{}
			err := json.Unmarshal(body, chartVersionResponse)
			if err != nil {
				return "", err
			}
			if len(chartVersionResponse.Data.Attributes.URLs) < 1 {
				return "", errors.New("Response contained no chart package urls")
			}
			return chartVersionResponse.Data.Attributes.URLs[0], err
		} else {
			return "", errors.New("No body in response to chart request")
		}
	} else {
		store := m.RepoQueryStore
		chart, err := store.GetChart(chartID)
		if err != nil {
			return "", errors.New("Could not find Chart")
		}

		// Find the download URL for the version
		for _, chartVersion := range chart.ChartVersions {
			if chartVersion.Version == version {
				if len(chartVersion.URLs) == 1 {
					return chartVersion.URLs[0], nil
				}
			}
		}
		return "", errors.New("Could not find Chart Version")
	}
}
