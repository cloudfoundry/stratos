package eirini

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type Eirini struct {
	portalProxy interfaces.PortalProxy
	Config      *Config
}

const (
	// eiriniEnabled is config value send back to the client
	eiriniEnabled = "eiriniEnabled"
	// eiriniDefaultNamespace is config value send back to the client
	eiriniDefaultNamespace = "eiriniDefaultNamespace"
	defaultNamespace       = "eirini"
)

func init() {
	interfaces.AddPlugin("eirini", nil, Init)
}

// Init creates a new instance of the Eirini plugin
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {

	init := &Eirini{portalProxy: portalProxy}
	c, err := init.LoadConfig(*portalProxy.Env())
	if err != nil {
		return init, err
	}

	init.Config = c
	return init, nil
}

func (eirini *Eirini) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

func (eirini *Eirini) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

func (eirini *Eirini) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return eirini, nil
}

func (eirini *Eirini) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (eirini *Eirini) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (eirini *Eirini) Init() error {
	if eirini.Config.Enabled {
		eirini.portalProxy.GetConfig().PluginConfig[eiriniEnabled] = "true"
		namespace := defaultNamespace
		if len(eirini.Config.PodNamespace) != 0 {
			namespace = eirini.Config.PodNamespace
		}
		eirini.portalProxy.GetConfig().PluginConfig[eiriniDefaultNamespace] = namespace
		log.Infof("Eirini support is ENABLED. Default namespace '%v'", namespace)
	}

	return nil
}
