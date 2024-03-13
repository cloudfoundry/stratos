package helm

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"

	log "github.com/sirupsen/logrus"
)

// Desktop - Desktop hosting for Helm Repositories
type Desktop struct {
	portalProxy   api.PortalProxy
	factory       api.StoreFactory
	endpointStore EndpointStore
	tokenStore    TokenStore
}

var br *Desktop

// Init performs plugin initialization
func Init(portalProxy api.PortalProxy) error {

	// TODO: Check we are running in desktop environment

	br = &Desktop{
		portalProxy: portalProxy,
	}

	// Add ourselves as the endpoint factory
	br.factory = br.portalProxy.SetStoreFactory(br)
	log.Info("Helm desktop endpoints initialized")

	eStore, endpointStoreError := br.factory.EndpointStore()
	tStore, tokenStoreError := br.factory.TokenStore()

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

	return errors.Join(endpointStoreError, tokenStoreError)
}

// EndpointStore gets store for obtaining endpoint information
func (br *Desktop) EndpointStore() (api.EndpointRepository, error) {
	return &br.endpointStore, nil
}

// TokenStore gets store for obtaining endpoint information
func (br *Desktop) TokenStore() (api.TokenRepository, error) {
	return &br.tokenStore, nil
}
