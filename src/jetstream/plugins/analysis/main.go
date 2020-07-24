package analysis

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/analysis/store"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

const (
	analsyisServicesAPIEnvVar = "ANALYSIS_SERVICES_API"

	// Allow specific engines to be enabled
	analysisEnginesAPIEnvVar = "ANALYSIS_ENGINES"

	// Names used to communicate settings info back to the front-end client
	analysisEnabledPluginConfigSetting = "analysisEnabled"
	analysisEnginesPluginConfigSetting = "analysisEngines"

	defaultEngines = "popeye"
)

// Analysis - Plugin to allow analysers to run over an endpoint cluster
type Analysis struct {
	portalProxy    interfaces.PortalProxy
	analysisServer string
}

// Init creates a new Analysis
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	store.InitRepositoryProvider(portalProxy.GetConfig().DatabaseProviderName)
	return &Analysis{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (analysis *Analysis) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (analysis *Analysis) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (analysis *Analysis) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return analysis, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (analysis *Analysis) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (analysis *Analysis) AddSessionGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/analysis/reports/:endpoint", analysis.listReports)
	echoGroup.GET("/analysis/reports/:endpoint/:id", analysis.getReport)
	echoGroup.GET("/analysis/reports/:endpoint/:id/:file", analysis.getReport)

	// Get completed reports for the given path
	echoGroup.GET("/analysis/completed/:endpoint/*", analysis.getReportsByPath)

	// Get latest report
	echoGroup.GET("/analysis/latest/:endpoint/*", analysis.getLatestReport)
	echoGroup.HEAD("/analysis/latest/:endpoint/*", analysis.getLatestReport)

	echoGroup.DELETE("/analysis/reports", analysis.deleteReports)

	// Run report
	echoGroup.POST("/analysis/run/:analyzer/:endpoint", analysis.runReport)
}

// Init performs plugin initialization
func (analysis *Analysis) Init() error {
	// Only enabled in tech preview
	if !analysis.portalProxy.GetConfig().EnableTechPreview {
		// This will set PluginsStatus[name] = false, which results in plugins[name] in the FE
		return errors.New("Requires tech preview")
	}

	// Check env var
	if url, ok := analysis.portalProxy.Env().Lookup(analsyisServicesAPIEnvVar); ok {
		analysis.analysisServer = url

		// Start background status check
		analysis.initStatusCheck()

		if engines, ok := analysis.portalProxy.Env().Lookup(analysisEnginesAPIEnvVar); ok {
			analysis.portalProxy.GetConfig().PluginConfig[analysisEnginesPluginConfigSetting] = engines
		} else {
			analysis.portalProxy.GetConfig().PluginConfig[analysisEnginesPluginConfigSetting] = defaultEngines
		}

		return nil
	}

	return errors.New("Analysis services API Server not configured")
}

// OnEndpointNotification called when for endpoint events
func (analysis *Analysis) OnEndpointNotification(action interfaces.EndpointAction, endpoint *interfaces.CNSIRecord) {
	if action == interfaces.EndpointUnregisterAction {
		// An endpoint was unregistered, so remove all reports
		dbStore, err := store.NewAnalysisDBStore(analysis.portalProxy.GetDatabaseConnection())
		if err == nil {
			dbStore.DeleteForEndpoint(endpoint.GUID)

			// Now ask the analysis engine to to delete all files on disk
			deleteURL := fmt.Sprintf("%s/api/v1/report/%s", analysis.analysisServer, endpoint.GUID)
			r, _ := http.NewRequest(http.MethodDelete, deleteURL, nil)
			client := &http.Client{Timeout: 30 * time.Second}
			rsp, err := client.Do(r)
			if err != nil {
				log.Errorf("Failed deleting reports from Analyzer service: %v", err)
				return
			}

			if rsp.StatusCode != http.StatusOK {
				log.Errorf("Failed deleting reports from Analyzer service: %d", rsp.StatusCode)
			}

			if rsp.Body != nil {
				defer rsp.Body.Close()
				_, err = ioutil.ReadAll(rsp.Body)
				if err != nil {
					log.Errorf("Could not read response: %v", err)
				}
			}
		}
	}
}
