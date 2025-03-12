package main

import (
	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/govau/cf-common/env"
)

func (p *portalProxy) GetConfig() *api.PortalConfig {
	return &p.Config
}

func (p *portalProxy) Env() *env.VarSet {
	return p.env
}
