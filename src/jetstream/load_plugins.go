package main

import (
	"github.com/cloudfoundry/stratos/src/jetstream/api"
	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/yamlgenerated"
)

func (pp *portalProxy) loadPlugins() {

	pp.Plugins = make(map[string]api.StratosPlugin)
	log.Info("Initialising plugins")

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
		log.Errorf("Could not find plugin: %s", name)
		return false
	}

	// Add all of the plugins for the dependencies
	for _, depend := range reg.Dependencies {
		if !addPlugin(pp, depend) {
			log.Errorf("Unmet dependency - skipping plugin %s", name)
			return false
		}
	}

	plugin, err := reg.Init(pp)
	pp.Plugins[name] = plugin
	if err != nil {
		log.Fatalf("Error loading plugin: %s (%s)", name, err)
	}
	log.Infof("Loaded plugin: %s", name)
	return true
}
