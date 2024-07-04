package main

import (
	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/govau/cf-common/env"
)

func (p *portalProxy) GetConfig() *api.PortalConfig {
	return &p.Config
}

func (p *portalProxy) Env() *env.VarSet {
	return p.env
}
