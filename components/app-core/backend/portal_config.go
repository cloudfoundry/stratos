package main

import (
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
