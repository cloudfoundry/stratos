package main

import (
	"github.com/cloudfoundry-incubator/stratos/plugins/cfapppush"
	"github.com/cloudfoundry-incubator/stratos/plugins/cfappssh"
	"github.com/cloudfoundry-incubator/stratos/plugins/cloudfoundry"
	"github.com/cloudfoundry-incubator/stratos/plugins/cloudfoundryhosting"
	"github.com/cloudfoundry-incubator/stratos/plugins/metrics"
	"github.com/cloudfoundry-incubator/stratos/plugins/userinfo"
	"github.com/cloudfoundry-incubator/stratos/repository/interfaces"
	log "github.com/sirupsen/logrus"
)

func (pp *portalProxy) loadPlugins() {
	pp.Plugins = make(map[string]interfaces.StratosPlugin)
	log.Info("Initialising plugins")
	for _, p := range []struct {
		Name string
		Init func(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error)
	}{
		{"cfapppush", cfapppush.Init},
		{"cfappssh", cfappssh.Init},
		{"cloudfoundry", cloudfoundry.Init},
		{"cloudfoundryhosting", cloudfoundryhosting.Init},
		{"metrics", metrics.Init},
		{"userinfo", userinfo.Init},
	} {
		plugin, err := p.Init(pp)
		pp.Plugins[p.Name] = plugin
		if err != nil {
			log.Fatal("Error loading plugin: %s (%s)", p.Name, err)
		}
		log.Info("Loaded plugin: %s", p.Name)
	}
}
