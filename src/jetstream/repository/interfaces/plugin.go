package interfaces

import (
	"github.com/govau/cf-common/env"
)

// StratosPlugin is the interface for a Jetstream plugin
type StratosPlugin interface {
	Init() error
	GetMiddlewarePlugin() (MiddlewarePlugin, error)
	GetEndpointPlugin() (EndpointPlugin, error)
	GetRoutePlugin() (RoutePlugin, error)
}

// JetstreamConfigInit is the function signature for the config plugin init function
type JetstreamConfigInit func(*env.VarSet, *PortalConfig)

// JetstreamConfigPlugins is the array of config plugins
var JetstreamConfigPlugins []JetstreamConfigInit

// RegisterJetstreamConfigPlugin registers a new config plugin
func RegisterJetstreamConfigPlugin(plugin JetstreamConfigInit) {
	JetstreamConfigPlugins = append(JetstreamConfigPlugins, plugin)
}

// i is the interface for a Jetstream plugin
type EndpointNotificationPlugin interface {
	OnEndpointNotification(EndpointAction, *CNSIRecord)
}

// StratosPluginCleanup is interface a plugin can implement if it wants to cleanup on exit
type StratosPluginCleanup interface {
	Destroy()
}
