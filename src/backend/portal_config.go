package main

import (
	"github.com/SUSE/stratos-ui/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
