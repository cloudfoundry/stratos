package main

import (
	"github.com/hpcloud/portal-proxy/components/core/backend/repository/interfaces"
)

func (p *portalProxy) GetConfig() *interfaces.PortalConfig {
	return &p.Config
}
