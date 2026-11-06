package analysis

import (
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/analysis/store"

	"github.com/labstack/echo/v5"
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
	portalProxy    api.PortalProxy
	analysisServer string
}

func init() {
	api.AddPlugin("analysis", []string{"kubernetes"}, Init)
}

// Init creates a new Analysis
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	store.InitRepositoryProvider(portalProxy.GetConfig().DatabaseProviderName)
	return &Analysis{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (analysis *Analysis) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (analysis *Analysis) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (analysis *Analysis) GetRoutePlugin() (api.RoutePlugin, error) {
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
func (analysis *Analysis) OnEndpointNotification(action api.EndpointAction, endpoint *api.CNSIRecord) {
	if action == api.EndpointUnregisterAction {
		// An endpoint was unregistered, so remove all reports
		dbStore, err := store.NewAnalysisDBStore(analysis.portalProxy.GetDatabaseConnection())
		if err == nil {
			if err := dbStore.DeleteForEndpoint(endpoint.GUID); err != nil {
				slog.Error("failed deleting the reports for the endpoint", "endpoint", endpoint.GUID, "error", err)
			}

			// Now ask the analysis engine to to delete all files on disk
			deleteURL := fmt.Sprintf("%s/api/v1/report/%s", analysis.analysisServer, endpoint.GUID)
			r, _ := http.NewRequest(http.MethodDelete, deleteURL, nil)
			client := &http.Client{Timeout: 30 * time.Second}
			rsp, err := client.Do(r)
			if err != nil {
				slog.Error("failed deleting the reports from the Analyzer service", "url", deleteURL, "error", err)
				return
			}

			if rsp.StatusCode != http.StatusOK {
				slog.Error("failed deleting the reports from the Analyzer service", "url", deleteURL, "status", rsp.StatusCode)
			}

			if rsp.Body != nil {
				defer func() { _ = rsp.Body.Close() }()
				_, err = io.ReadAll(rsp.Body)
				if err != nil {
					slog.Error("could not read the Analyzer service response", "url", deleteURL, "error", err)
				}
			}
		}
	}
}
