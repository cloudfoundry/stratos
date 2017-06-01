package main

import (
	"github.com/hpcloud/stratos-ui/components/core/backend/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
