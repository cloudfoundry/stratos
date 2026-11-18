package autoscaler

import (
	"context"
	"errors"
	"log/slog"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v5"
)

// Module init will register plugin
func init() {
	api.AddPlugin("autoscaler", []string{"cloudfoundry"}, Init)
}

// Autoscaler is a plugin to allow applications to be pushed to Cloud Foundry from Stratos
type Autoscaler struct {
	portalProxy api.PortalProxy
	// brokersForApp replaces capiBrokersForApp in tests.
	brokersForApp func(ctx context.Context, cfGUID, userGUID, appGUID string) (map[string]string, error)
	cache         brokerCache
}

// Init creates a new Autoscaler
func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	return &Autoscaler{portalProxy: portalProxy}, nil
}

// GetMiddlewarePlugin gets the middleware plugin for this plugin
func (a *Autoscaler) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

// GetEndpointPlugin gets the endpoint plugin for this plugin
func (a *Autoscaler) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return a, nil
}

// GetRoutePlugin gets the route plugin for this plugin
func (a *Autoscaler) GetRoutePlugin() (api.RoutePlugin, error) {
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
	echoGroup.GET("/autoscaler/apps/:appId/target", a.getAutoscalerTarget)
	echoGroup.GET("/autoscaler/apps/:appId/policy", a.getAutoscalerPolicy)
	echoGroup.PUT("/autoscaler/apps/:appId/policy", a.attachAutoscalerPolicy)
	echoGroup.DELETE("/autoscaler/apps/:appId/policy", a.detachAutoscalerPolicy)
	echoGroup.GET("/autoscaler/apps/:appId/metric/:metricType", a.getAutoscalerMetric)
	echoGroup.GET("/autoscaler/apps/:appId/event", a.getAutoscalerEvent)
}

// OnEndpointNotification unregisters the autoscalers registered for a Cloud
// Foundry when that Cloud Foundry is unregistered: they serve nothing else.
func (a *Autoscaler) OnEndpointNotification(action api.EndpointAction, endpoint *api.CNSIRecord) {
	if action != api.EndpointUnregisterAction || endpoint.CNSIType != "cf" {
		return
	}
	endpoints, err := a.portalProxy.ListEndpoints()
	if err != nil {
		slog.Warn("could not list the autoscalers of the unregistered Cloud Foundry", "endpoint", endpoint.GUID, "error", err)
		return
	}
	for _, rec := range endpoints {
		if rec.CNSIType != EndpointType {
			continue
		}
		if link, ok := parseLink(rec.Metadata); !ok || link.CFGUID != endpoint.GUID {
			continue
		}
		if err := a.portalProxy.UnregisterEndpoint(rec.GUID); err != nil {
			slog.Warn("could not unregister the autoscaler of the unregistered Cloud Foundry", "autoscaler", rec.GUID, "endpoint", endpoint.GUID, "error", err)
		}
	}
}

// Init performs plugin initialization
func (a *Autoscaler) Init() error {
	return nil
}
