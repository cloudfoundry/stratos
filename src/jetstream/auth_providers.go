package main

import (
	// log "github.com/sirupsen/logrus"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// AddAuthProvider adds a new auth provider
func (p *portalProxy) AddAuthProvider(name string, provider interfaces.AuthProvider) {
	p.AuthProviders[name] = provider
}

func (p *portalProxy) GetAuthProvider(name string) interfaces.AuthProvider {
	return p.AuthProviders[name]
}

func (p *portalProxy) HasAuthProvider(name string) bool {
	_, ok := p.AuthProviders[name]
	return ok
}

