package main

import (
	"encoding/json"
	"io/ioutil"
	"plugin"

	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	log "github.com/Sirupsen/logrus"
)

type pluginDef struct {
	LibraryPath string `json:"libraryPath"`
	PluginPath  string `json:"pluginPath"`
	PluginName  string `json:"pluginName"`
}

func (pp *portalProxy) loadPlugins() {

	pluginsDef, e := ioutil.ReadFile("./plugins.json")
	if e != nil {
		log.Warnf("Unable to load plugins.json. No Portal Proxy plugins will be available. Error was: %v\n", e)
		return
	}

	var loadedPlugins []pluginDef

	json.Unmarshal(pluginsDef, &loadedPlugins)

	pp.Plugins = make(map[string]interfaces.StratosPlugin)

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
		plugin, _ := init.(func(interfaces.PortalProxy) (interfaces.StratosPlugin, error))(pp)
		pp.Plugins[loadedPlugin.PluginName] = plugin
		log.Infof("Loaded plugin: %+v", loadedPlugin)
	}
}
