package eirini

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
	log "github.com/sirupsen/logrus"
)

type Eirini struct {
	portalProxy interfaces.PortalProxy
	Config      *Config
}

// EiriniEnabled is config value send back to the client
const EiriniEnabled = "eiriniEnabled"

// EiriniDefaultNamespace is config value send back to the client
const EiriniDefaultNamespace = "eiriniDefaultNamespace"

const DefaultNamespace = "eirini"

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
		eirini.portalProxy.GetConfig().PluginConfig[EiriniEnabled] = "true"
		namespace := DefaultNamespace
		if len(eirini.Config.PodNamespace) != 0 {
			namespace = eirini.Config.PodNamespace
		}
		eirini.portalProxy.GetConfig().PluginConfig[EiriniDefaultNamespace] = namespace
		log.Infof("Eirini support is ENABLED. Default namespace '%v'", namespace)
	}

	return nil
}
