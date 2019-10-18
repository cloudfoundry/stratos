package main

import (
	// log "github.com/sirupsen/logrus"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

// AddAuthProvider adds a new auth provider
func (p *portalProxy) AddAuthProvider(name string, provider api.AuthProvider) {
	p.AuthProviders[name] = provider
}

func (p *portalProxy) GetAuthProvider(name string) api.AuthProvider {
	return p.AuthProviders[name]
}
