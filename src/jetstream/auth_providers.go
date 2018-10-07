package main

import (
	// log "github.com/sirupsen/logrus"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// AddAuthProvider adds a new auth provider
func (p *portalProxy) AddAuthProvider(name string, handler interfaces.AuthFlowHandlerFunc) {
	p.AuthProviders[name] = handler
}

func (p *portalProxy) GetAuthProvider(name string) interfaces.AuthFlowHandlerFunc {
	return p.AuthProviders[name]
}
