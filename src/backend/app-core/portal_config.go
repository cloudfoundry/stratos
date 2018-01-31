package main

import (
	"github.com/SUSE/stratos-ui/app-core/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
