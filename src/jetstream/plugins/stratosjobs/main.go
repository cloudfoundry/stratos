package stratosjobs

import (
	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// PluginName is the lookup key other plugins use to reach this plugin via
// portalProxy.GetPlugin(). Kept as an exported constant so consumers don't
// duplicate the string.
const PluginName = "stratosjobs"

// init registers the plugin at package load. extra/default_plugins.go
// includes this package via blank import.
func init() {
	api.AddPlugin(PluginName, nil, Init)
}

// StratosJobs is the plugin instance. It owns the tracker and exposes it
// to other plugins (e.g., cloudfoundry) that need to register a job.
type StratosJobs struct {
	portalProxy api.PortalProxy
	tracker     Tracker
}

// Init constructs the plugin, starts the in-memory tracker. The tracker
// implementation is fixed to in-memory for now — the DB-backed variant
// needed for multi-replica k8s arrives in a later pass.
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &StratosJobs{
		portalProxy: portalProxy,
		tracker:     NewInMemoryTracker(InMemoryTrackerConfig{}),
	}, nil
}

// Tracker exposes the shared tracker to other plugins. Consumers hold the
// plugin instance and call this rather than keeping a separate reference
// so future swaps (DB-backed impl) only need to update the factory here.
func (s *StratosJobs) Tracker() Tracker {
	return s.tracker
}

// GetMiddlewarePlugin satisfies api.StratosPlugin. Not used.
func (s *StratosJobs) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin satisfies api.StratosPlugin. Not used.
func (s *StratosJobs) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin returns this plugin as its own route provider.
func (s *StratosJobs) GetRoutePlugin() (api.RoutePlugin, error) {
	return s, nil
}

// AddAdminGroupRoutes is a no-op — no admin-scoped jobs endpoint today.
func (s *StratosJobs) AddAdminGroupRoutes(echoGroup *echo.Group) {}

// AddSessionGroupRoutes registers the job polling endpoint under /pp/v1.
func (s *StratosJobs) AddSessionGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/stratos/jobs/:jobId", s.getJob)
}

// Init is the second-phase init hook called after all plugins are loaded.
// No cross-plugin wiring needed from this side — consumers reach us via
// portalProxy.GetPlugin(PluginName).
func (s *StratosJobs) Init() error { return nil }
