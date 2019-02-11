package interfaces

// StratosPlugin is the interface for a Jetstream plugin
type StratosPlugin interface {
	Init() error
	GetMiddlewarePlugin() (MiddlewarePlugin, error)
	GetEndpointPlugin() (EndpointPlugin, error)
	GetRoutePlugin() (RoutePlugin, error)
}

// JetstreamConfigInit is the function signature for the config plugin init function
type JetstreamConfigInit func(*PortalConfig)

// JetstreamConfigPlugins is the array of config plugins
var JetstreamConfigPlugins []JetstreamConfigInit

// RegisterJetstreamConfigPlugin registers a new config plugin
func RegisterJetstreamConfigPlugin(plugin JetstreamConfigInit) {
	JetstreamConfigPlugins = append(JetstreamConfigPlugins, plugin)
}
