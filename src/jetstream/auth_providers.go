package main

import "github.com/cloudfoundry-incubator/stratos/src/jetstream/api"

// log "github.com/sirupsen/logrus"

// AddAuthProvider adds a new auth provider
func (p *portalProxy) AddAuthProvider(name string, provider api.AuthProvider) {
	p.AuthProviders[name] = provider
}

func (p *portalProxy) GetAuthProvider(name string) api.AuthProvider {
	return p.AuthProviders[name]
}

func (p *portalProxy) HasAuthProvider(name string) bool {
	_, ok := p.AuthProviders[name]
	return ok
}
