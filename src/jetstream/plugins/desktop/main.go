package desktop

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"

	log "github.com/sirupsen/logrus"
)

// Desktop - Desktop hosting plugin
type Desktop struct {
	portalProxy   interfaces.PortalProxy
	factory       interfaces.StoreFactory
	endpointStore DesktopEndpointStore
	tokenStore    TokenStore
}

// Init creates a new Autoscaler
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &Desktop{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (br *Desktop) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (br *Desktop) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (br *Desktop) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return br, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (br *Desktop) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (br *Desktop) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// Init performs plugin initialization
func (br *Desktop) Init() error {
	// Add ourselves as the endpoint factory
	br.factory = br.portalProxy.SetStoreFactory(br)
	log.Info("Desktop hosting plugin initialized")

	eStore, _ := br.factory.EndpointStore()
	tStore, _ := br.factory.TokenStore()

	// Use a custom endpoint store that can overlay local endpoints
	br.endpointStore = DesktopEndpointStore{
		portalProxy: br.portalProxy,
		store:       eStore,
	}

	// Use a custom endpoint store that can overlay local endpoints
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
	//return br.factory.TokenStore()
}
