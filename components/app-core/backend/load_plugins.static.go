// +build !linux

package main

import (
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	//@@IMPORTS@@
)

func (pp *portalProxy) loadPlugins() {

	pp.Plugins = make(map[string]interfaces.StratosPlugin)
	var plugin interfaces.StratosPlugin

	//@@INITS@@
}
