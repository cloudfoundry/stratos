package main

import (
	"log/slog"
	"os"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/yamlgenerated"
)

func (pp *portalProxy) loadPlugins() {

	pp.Plugins = make(map[string]api.StratosPlugin)
	slog.Info("Initialising plugins")

	yamlgenerated.MakePluginsFromConfig()

	for name := range api.PluginInits {
		addPlugin(pp, name)
	}
}

func addPlugin(pp *portalProxy, name string) bool {
	// Has the plugin already been inited?
	if _, ok := pp.Plugins[name]; ok {
		return true
	}

	// Register this one if not already registered
	reg, ok := api.PluginInits[name]
	if !ok {
		// Could not find plugin
		slog.Error("could not find the plugin", "plugin", name)
		return false
	}

	// Add all of the plugins for the dependencies
	for _, depend := range reg.Dependencies {
		if !addPlugin(pp, depend) {
			slog.Error("unmet dependency - skipping the plugin", "plugin", name, "dependency", depend)
			return false
		}
	}

	plugin, err := reg.Init(pp)
	pp.Plugins[name] = plugin
	if err != nil {
		slog.Error("error loading the plugin", "plugin", name, "error", err)
		os.Exit(1)
	}
	slog.Info("Loaded plugin", "plugin", name)
	return true
}
