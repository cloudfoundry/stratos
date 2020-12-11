package kubernetes

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"

	log "github.com/sirupsen/logrus"
)

// Desktop - Desktop hosting for Kubernetes
type Desktop struct {
	portalProxy   interfaces.PortalProxy
	factory       interfaces.StoreFactory
	endpointStore EndpointStore
	tokenStore    TokenStore
}

var br *Desktop

// Init performs plugin initialization
func Init(portalProxy interfaces.PortalProxy) error {

	// TODO: Check we are running in desktop environment

	br = &Desktop{
		portalProxy: portalProxy,
	}

	// Add ourselves as the endpoint factory
	br.factory = br.portalProxy.SetStoreFactory(br)
	log.Info("Kubernetes desktop endpoint initialized")

	eStore, _ := br.factory.EndpointStore()
	tStore, _ := br.factory.TokenStore()

	// Use a custom endpoint store that can overlay local Kubernetes endpoints
	br.endpointStore = EndpointStore{
		portalProxy: br.portalProxy,
		store:       eStore,
	}

	// Use a custom endpoint store that can overlay local Kubernetes endpoints
	br.tokenStore = TokenStore{
		portalProxy: br.portalProxy,
		store:       tStore,
	}

	return nil
}

// EndpointStore gets store for obtaining endpoint information
func (br *Desktop) EndpointStore() (interfaces.EndpointRepository, error) {
	return &br.endpointStore, nil
}

// TokenStore gets store for obtaining endpoint information
func (br *Desktop) TokenStore() (interfaces.TokenRepository, error) {
	return &br.tokenStore, nil
}
