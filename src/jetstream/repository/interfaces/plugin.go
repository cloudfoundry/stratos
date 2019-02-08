package interfaces

type StratosPlugin interface {
	Init() error
	GetMiddlewarePlugin() (MiddlewarePlugin, error)
	GetEndpointPlugin() (EndpointPlugin, error)
	GetRoutePlugin() (RoutePlugin, error)
}

// StratosConfigPlugin is the function signature for the config plugin function
type StratosConfigPlugin func(*PortalConfig)

// StratosConfigPlugins is the array of config plugins
var StratosConfigPlugins []StratosConfigPlugin

// RegisterStratosConfigPlugin registers a new config plugin
func RegisterStratosConfigPlugin(plugin StratosConfigPlugin) {
	StratosConfigPlugins = append(StratosConfigPlugins, plugin)
}
