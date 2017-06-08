package main

import (
	"github.com/suse/stratos-ui/components/app-core/backend/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
