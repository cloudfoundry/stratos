package cfapppush

import (
	"io"

	"code.cloudfoundry.org/cli/actor/pushaction"
	"code.cloudfoundry.org/cli/actor/v2action"
	"github.com/gorilla/websocket"
)

type cfV2Actor struct {
	wrapped         pushaction.V2Actor
	sent            bool
	msgSender       DeployAppMessageSender
	clientWebsocket *websocket.Conn
}

func (r cfV2Actor) sendAppID(application v2action.Application) {
	if !r.sent {
		r.msgSender.SendEvent(r.clientWebsocket, APP_GUID_NOTIFY, application.GUID)
		r.sent = true
	}
}

func (r cfV2Actor) MapRouteToApplication(routeGUID string, appGUID string) (v2action.Warnings, error) {
	return r.wrapped.MapRouteToApplication(routeGUID, appGUID)
}

func (r cfV2Actor) BindServiceByApplicationAndServiceInstance(appGUID string, serviceInstanceGUID string) (v2action.Warnings, error) {
	return r.wrapped.BindServiceByApplicationAndServiceInstance(appGUID, serviceInstanceGUID)
}

func (r cfV2Actor) CloudControllerAPIVersion() string {
	return r.wrapped.CloudControllerAPIVersion()
}

func (r cfV2Actor) CreateApplication(application v2action.Application) (v2action.Application, v2action.Warnings, error) {
	app, warnings, err := r.wrapped.CreateApplication(application)
	if err == nil {
		r.sendAppID(app)
	}
	return app, warnings, err
}

func (r cfV2Actor) CreateRoute(route v2action.Route, generatePort bool) (v2action.Route, v2action.Warnings, error) {
	return r.wrapped.CreateRoute(route, generatePort)
}

func (r cfV2Actor) FindRouteBoundToSpaceWithSettings(route v2action.Route) (v2action.Route, v2action.Warnings, error) {
	return r.wrapped.FindRouteBoundToSpaceWithSettings(route)
}

func (r cfV2Actor) GetApplicationByNameAndSpace(name string, spaceGUID string) (v2action.Application, v2action.Warnings, error) {
	app, warnings, err := r.wrapped.GetApplicationByNameAndSpace(name, spaceGUID)
	if err == nil {
		r.sendAppID(app)
	}
	return app, warnings, err
}

func (r cfV2Actor) GetApplicationRoutes(applicationGUID string) (v2action.Routes, v2action.Warnings, error) {
	return r.wrapped.GetApplicationRoutes(applicationGUID)
}

func (r cfV2Actor) GetDomainsByNameAndOrganization(domainNames []string, orgGUID string) ([]v2action.Domain, v2action.Warnings, error) {
	return r.wrapped.GetDomainsByNameAndOrganization(domainNames, orgGUID)
}

func (r cfV2Actor) GetOrganizationDomains(orgGUID string) ([]v2action.Domain, v2action.Warnings, error) {
	return r.wrapped.GetOrganizationDomains(orgGUID)
}

func (r cfV2Actor) GetServiceInstanceByNameAndSpace(name string, spaceGUID string) (v2action.ServiceInstance, v2action.Warnings, error) {
	return r.wrapped.GetServiceInstanceByNameAndSpace(name, spaceGUID)
}

func (r cfV2Actor) GetServiceInstancesByApplication(appGUID string) ([]v2action.ServiceInstance, v2action.Warnings, error) {
	return r.wrapped.GetServiceInstancesByApplication(appGUID)
}

func (r cfV2Actor) GetStack(guid string) (v2action.Stack, v2action.Warnings, error) {
	return r.wrapped.GetStack(guid)
}

func (r cfV2Actor) GetStackByName(stackName string) (v2action.Stack, v2action.Warnings, error) {
	return r.wrapped.GetStackByName(stackName)
}

func (r cfV2Actor) PollJob(job v2action.Job) (v2action.Warnings, error) {
	return r.wrapped.PollJob(job)
}

func (r cfV2Actor) ResourceMatch(allResources []v2action.Resource) ([]v2action.Resource, []v2action.Resource, v2action.Warnings, error) {
	return r.wrapped.ResourceMatch(allResources)
}

func (r cfV2Actor) UnmapRouteFromApplication(routeGUID string, appGUID string) (v2action.Warnings, error) {
	return r.wrapped.UnmapRouteFromApplication(routeGUID, appGUID)
}

func (r cfV2Actor) UpdateApplication(application v2action.Application) (v2action.Application, v2action.Warnings, error) {
	r.sendAppID(application)
	return r.wrapped.UpdateApplication(application)
}

func (r cfV2Actor) UploadApplicationPackage(appGUID string, existingResources []v2action.Resource, newResources io.Reader, newResourcesLength int64) (v2action.Job, v2action.Warnings, error) {
	return r.wrapped.UploadApplicationPackage(appGUID, existingResources, newResources, newResourcesLength)
}

func (r cfV2Actor) UploadDroplet(appGUID string, droplet io.Reader, dropletLength int64) (v2action.Job, v2action.Warnings, error) {
	return r.wrapped.UploadDroplet(appGUID, droplet, dropletLength)
}
