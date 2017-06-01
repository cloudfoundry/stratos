package main

import (
	"encoding/json"
	"io/ioutil"
	"plugin"

	log "github.com/Sirupsen/logrus"
	"github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"
)

type pluginType string

const (
	EndpointPlugin pluginType = "endpoint"
	GeneralPlugin  pluginType = "general"
)

type pluginDef struct {
	LibraryPath string     `json:"libraryPath"`
	PluginPath  string     `json:"pluginPath"`
	PluginName  string     `json:"pluginName"`
	PluginType  pluginType `json:"pluginType"`
}

func (pp *portalProxy) loadPlugins() {

	pluginsDef, e := ioutil.ReadFile("./plugins.json")
	if e != nil {
		log.Warnf("Unable to load plugins.json. No Portal Proxy plugins will be available. Error was: %v\n", e)
		return
	}

	var loadedPlugins []pluginDef

	json.Unmarshal(pluginsDef, &loadedPlugins)

	pp.EndpointPlugins = make(map[string]interfaces.EndpointPlugin)
	pp.GeneralPlugins = make(map[string]interfaces.GeneralPlugin)

	for _, loadedPlugin := range loadedPlugins {
		p, err := plugin.Open(loadedPlugin.LibraryPath)
		if err != nil {
			log.Warnf("Plugin not found at %s. Skipping loading of this plugin", loadedPlugin.LibraryPath)
			continue
		}
		init, err := p.Lookup("Init")
		if err != nil {
			log.Warnf("Plugin %s does not implement `Init` function. Skipping loading of this plugin", loadedPlugin.PluginName)
			continue
		}
		if loadedPlugin.PluginType == EndpointPlugin {
			initialisedEndpoint, _ := init.(func(interfaces.PortalProxy) (interfaces.EndpointPlugin, error))(pp)
			pp.EndpointPlugins[initialisedEndpoint.GetType()] = initialisedEndpoint
			log.Infof("Loaded plugin: %+v", loadedPlugin)

		}
		if loadedPlugin.PluginType == GeneralPlugin {
			generalPlugin, _ := init.(func(interfaces.PortalProxy) (interfaces.GeneralPlugin, error))(pp)
			pp.GeneralPlugins[loadedPlugin.PluginName] = generalPlugin
			log.Infof("Loaded plugin: %+v", loadedPlugin)

		}
	}
}
