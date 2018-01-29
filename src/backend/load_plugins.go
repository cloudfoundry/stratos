package main

import (
	"github.com/SUSE/stratos-ui/repository/interfaces"
	log "github.com/Sirupsen/logrus"
	
	//@@IMPORTS@@
)

func (pp *portalProxy) loadPlugins() {

	pp.Plugins = make(map[string]interfaces.StratosPlugin)
	var plugin interfaces.StratosPlugin

	log.Info("Initialising plugins")
	//@@INITS@@
}
