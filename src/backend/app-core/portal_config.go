package main

import (
	"github.com/cloudfoundry-incubator/stratos/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
