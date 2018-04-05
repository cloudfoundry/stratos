package main

import (
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
		"github.com/SUSE/stratos-ui/plugins/cfapppush"
	"github.com/SUSE/stratos-ui/plugins/cfappssh"
	"github.com/SUSE/stratos-ui/plugins/cloudfoundry"
	"github.com/SUSE/stratos-ui/plugins/cloudfoundryhosting"
	"github.com/SUSE/stratos-ui/plugins/metrics"
	"github.com/SUSE/stratos-ui/plugins/userinfo"

)

func (pp *portalProxy) loadPlugins() {

	pp.Plugins = make(map[string]interfaces.StratosPlugin)
	var plugin interfaces.StratosPlugin

	log.Info("Initialising static plugins")
		plugin, _ = cfapppush.Init(pp)
	pp.Plugins["cfapppush"] = plugin
	log.Info("Loaded plugin: cfapppush")
	plugin, _ = cfappssh.Init(pp)
	pp.Plugins["cfappssh"] = plugin
	log.Info("Loaded plugin: cfappssh")
	plugin, _ = cloudfoundry.Init(pp)
	pp.Plugins["cloudfoundry"] = plugin
	log.Info("Loaded plugin: cloudfoundry")
	plugin, _ = cloudfoundryhosting.Init(pp)
	pp.Plugins["cloudfoundryhosting"] = plugin
	log.Info("Loaded plugin: cloudfoundryhosting")
	plugin, _ = metrics.Init(pp)
	pp.Plugins["metrics"] = plugin
	log.Info("Loaded plugin: metrics")
	plugin, _ = userinfo.Init(pp)
	pp.Plugins["userinfo"] = plugin
	log.Info("Loaded plugin: userinfo")

}
