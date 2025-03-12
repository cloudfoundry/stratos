package desktop

import (
	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/desktop/helm"
	"github.com/cloudfoundry/stratos/src/jetstream/plugins/desktop/kubernetes"
	"github.com/labstack/echo/v4"

	log "github.com/sirupsen/logrus"
)

// Module init will register plugin
func init() {
	api.AddPlugin("desktop", nil, Init)
}

// Desktop - Desktop hosting plugin
type Desktop struct {
	portalProxy   api.PortalProxy
	factory       api.StoreFactory
	endpointStore DesktopEndpointStore
	tokenStore    TokenStore
}

// Init creates a new Autoscaler
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &Desktop{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (br *Desktop) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (br *Desktop) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (br *Desktop) GetRoutePlugin() (api.RoutePlugin, error) {
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

	// Now add the Kubernetes Desktop support in
	kubernetes.Init(br.portalProxy)

	// Add the Helm Desktop support in
	helm.Init(br.portalProxy)

	return nil
}

// EndpointStore gets store for obtaining endpoint information
func (br *Desktop) EndpointStore() (api.EndpointRepository, error) {
	return &br.endpointStore, nil
}

// TokenStore gets store for obtaining endpoint information
func (br *Desktop) TokenStore() (api.TokenRepository, error) {
	return &br.tokenStore, nil
	//return br.factory.TokenStore()
}
