package autoscaler

import (
	"errors"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo"
)

// Autoscaler is a plugin to allow applications to be pushed to Cloud Foundry from Stratos
type Autoscaler struct {
	portalProxy interfaces.PortalProxy
}

// Init creates a new Autoscaler
func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &Autoscaler{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (a *Autoscaler) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (a *Autoscaler) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetRoutePlugin gets the route plugin for this plugin
func (a *Autoscaler) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return a, nil
}

// AddAdminGroupRoutes adds the admin routes for this plugin to the Echo server
func (a *Autoscaler) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

// AddSessionGroupRoutes adds the session routes for this plugin to the Echo server
func (a *Autoscaler) AddSessionGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/autoscaler/info", a.getAutoscalerInfo)
	echoGroup.GET("/autoscaler/health", a.getAutoscalerHealth)
	echoGroup.GET("/autoscaler/apps/:appId/policy", a.getAutoscalerPolicy)
	echoGroup.PUT("/autoscaler/apps/:appId/policy", a.attachAutoscalerPolicy)
	echoGroup.DELETE("/autoscaler/apps/:appId/policy", a.detachAutoscalerPolicy)
	echoGroup.PUT("/autoscaler/apps/:appId/credential", a.createAutoscalerCredential)
	echoGroup.DELETE("/autoscaler/apps/:appId/credential", a.deleteAutoscalerCredential)
	echoGroup.GET("/autoscaler/apps/:appId/metric/:metricType", a.getAutoscalerMetric)
	echoGroup.GET("/autoscaler/apps/:appId/event", a.getAutoscalerEvent)
}

// Init performs plugin initialization
func (a *Autoscaler) Init() error {
	return nil
}
