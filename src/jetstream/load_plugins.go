package main

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/autoscaler"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/backup"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cfapppush"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cfappssh"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundry"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/cloudfoundryhosting"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/kubernetes"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/metrics"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/monocular"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userfavorites"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userinfo"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins/userinvite"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
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
		// userinvite depends on cloudfoundry & cloudfoundryhosting
		{"userinvite", userinvite.Init},
		{"kubernetes", kubernetes.Init},
		{"monocular", monocular.Init},
		{"userfavorites", userfavorites.Init},
		{"autoscaler", autoscaler.Init},
		{"backup", backup.Init},
	} {
		plugin, err := p.Init(pp)
		pp.Plugins[p.Name] = plugin
		if err != nil {
			log.Fatalf("Error loading plugin: %s (%s)", p.Name, err)
		}
		log.Infof("Loaded plugin: %s", p.Name)
	}
}
