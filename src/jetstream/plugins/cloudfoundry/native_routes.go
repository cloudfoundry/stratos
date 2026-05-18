// src/jetstream/plugins/cloudfoundry/native_routes.go
package cloudfoundry

import "github.com/labstack/echo/v4"

// addNativeRoutes registers Stratos-native CF v3 routes on the CF plugin.
// Called from AddSessionGroupRoutes.
func (c *CloudFoundrySpecification) addNativeRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/cf/info/:cnsiGuid", c.getNativeCFInfo)
	echoGroup.GET("/cf/orgs/:cnsiGuid", c.getNativeOrgs)
	echoGroup.GET("/cf/apps/:cnsiGuid", c.getNativeApps)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid", c.getNativeAppDetail)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/env", c.getNativeAppEnv)
	echoGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid", c.deleteNativeApp)
	echoGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid/instances/:index", c.deleteAppInstance)
	echoGroup.PATCH("/cf/apps/:cnsiGuid/:appGuid", c.patchApp)
	echoGroup.POST("/cf/apps/:cnsiGuid/:appGuid/actions/:action", c.appAction)
	echoGroup.POST("/cf/apps/:cnsiGuid/:appGuid/scale", c.scaleApp)
	echoGroup.GET("/cf/app-stats/:cnsiGuid/:appGuid", c.getAppStats)
	echoGroup.GET("/cf/app-stats/:cnsiGuid", c.getAppStatsBatch)
	echoGroup.DELETE("/cf/orgs/:cnsiGuid/:orgGuid", c.deleteNativeOrg)
	echoGroup.DELETE("/cf/spaces/:cnsiGuid/:spaceGuid", c.deleteNativeSpace)
	echoGroup.GET("/cf/spaces/:cnsiGuid/:spaceGuid", c.getNativeSpaceDetail)
	echoGroup.PUT("/cf/apps/:cnsiGuid/:appGuid/routes/:routeGuid", c.assignRouteToApp)
	echoGroup.GET("/cf/spaces/:cnsiGuid", c.getNativeSpaces)
	echoGroup.GET("/cf/routes/:cnsiGuid", c.getNativeRouteCount)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/routes", c.getAppRoutes)
	echoGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid", c.unmapRouteFromApp)
	echoGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid", c.deleteNativeRoute)
	echoGroup.POST("/cf/service_bindings/:cnsiGuid", c.createServiceBinding)
	echoGroup.DELETE("/cf/service_bindings/:cnsiGuid/:bindingGuid", c.deleteServiceBinding)
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/service_bindings", c.getAppServiceBindings)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid", c.getNativeOrgDetail)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid/spaces", c.getNativeOrgSpaces)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid/private_domains", c.getNativeOrgDomains)
	echoGroup.GET("/cf/service_offerings/:cnsiGuid", c.getNativeServiceOfferings)
	echoGroup.GET("/cf/service_offerings/:cnsiGuid/:offeringGuid", c.getNativeServiceOfferingDetail)
	echoGroup.GET("/cf/service_instances/:cnsiGuid", c.getNativeServiceInstances)
	echoGroup.GET("/cf/service_instances/:cnsiGuid/:instanceGuid", c.getNativeServiceInstanceDetail)
	echoGroup.GET("/cf/service_instances/:cnsiGuid/:instanceGuid/service_bindings", c.getServiceInstanceServiceBindings)
	echoGroup.DELETE("/cf/service_instances/:cnsiGuid/:siGuid", c.deleteServiceInstance)
	echoGroup.GET("/cf/users/:cnsiGuid", c.getNativeUsers)
	echoGroup.GET("/cf/current-user-roles/:cnsiGuid", c.getNativeCurrentUserRoles)
	echoGroup.GET("/cf/stacks/:cnsiGuid", c.getNativeStacks)
	echoGroup.GET("/cf/buildpacks/:cnsiGuid", c.getNativeBuildpacks)
	echoGroup.GET("/cf/security_groups/:cnsiGuid", c.getNativeSecurityGroups)
	echoGroup.GET("/cf/feature_flags/:cnsiGuid", c.getNativeFeatureFlags)
	echoGroup.GET("/cf/organization_quotas/:cnsiGuid", c.getNativeOrgQuotas)
	echoGroup.GET("/cf/organization_quotas/:cnsiGuid/:quotaGuid", c.getNativeOrgQuotaDetail)
	echoGroup.GET("/cf/space_quotas/:cnsiGuid", c.getNativeSpaceQuotas)
	echoGroup.GET("/cf/audit_events/:cnsiGuid", c.getNativeAuditEvents)
	echoGroup.GET("/cf/org/:cnsiGuid/:orgGuid/events", c.getNativeOrgAuditEvents)
	echoGroup.GET("/cf/space/:cnsiGuid/:spaceGuid/events", c.getNativeSpaceAuditEvents)
	echoGroup.GET("/cf/service_plans/:cnsiGuid", c.getNativeServicePlans)
	echoGroup.GET("/cf/service_plans/:cnsiGuid/:planGuid", c.getNativeServicePlanDetail)
	echoGroup.GET("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.getNativeServicePlanVisibility)
	echoGroup.POST("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.applyNativeServicePlanVisibility)
	echoGroup.PATCH("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.applyNativeServicePlanVisibility)
	echoGroup.DELETE("/cf/service_plans/:cnsiGuid/:planGuid/visibility/:orgGuid", c.removeOrgFromNativeServicePlanVisibility)
	echoGroup.GET("/cf/service_brokers/:cnsiGuid", c.getNativeServiceBrokers)
	echoGroup.GET("/cf/service_brokers/:cnsiGuid/:brokerGuid", c.getNativeServiceBrokerDetail)
	echoGroup.GET("/cf/domains/:cnsiGuid", c.getNativeDomains)
	echoGroup.GET("/cf/domains/:cnsiGuid/:domainGuid", c.getNativeDomainDetail)
	echoGroup.POST("/cf/user_provided_service_instances/:cnsiGuid", c.createUserProvidedServiceInstance)
	echoGroup.PATCH("/cf/user_provided_service_instances/:cnsiGuid/:siGuid", c.updateUserProvidedServiceInstance)

	// A10 Revisions UI: list + rollback. Rollback's signature mirrors
	// restageApp (pre-extracted GUIDs), so we wrap it for echo.
	echoGroup.GET("/cf/apps/:cnsiGuid/:appGuid/revisions", c.getAppRevisions)
	echoGroup.POST("/cf/apps/:cnsiGuid/:appGuid/rollback", func(ctx echo.Context) error {
		return c.rollbackApp(ctx, ctx.Param("cnsiGuid"), ctx.Param("appGuid"))
	})

	// Phase 1C write-side completion
	echoGroup.PATCH("/cf/orgs/:cnsiGuid/:orgGuid", c.updateNativeOrg)
	echoGroup.POST("/cf/spaces/:cnsiGuid", c.createNativeSpace)
	echoGroup.PATCH("/cf/spaces/:cnsiGuid/:spaceGuid", c.updateNativeSpace)
	echoGroup.POST("/cf/routes/:cnsiGuid", c.createNativeRoute)
	echoGroup.POST("/cf/apps/:cnsiGuid", c.createNativeApp)
	echoGroup.POST("/cf/organization_quotas/:cnsiGuid", c.createNativeOrgQuota)
	echoGroup.PATCH("/cf/organization_quotas/:cnsiGuid/:quotaGuid", c.updateNativeOrgQuota)
	echoGroup.POST("/cf/space_quotas/:cnsiGuid", c.createNativeSpaceQuota)
	echoGroup.PATCH("/cf/space_quotas/:cnsiGuid/:quotaGuid", c.updateNativeSpaceQuota)
	echoGroup.POST("/cf/service_instances/:cnsiGuid", c.createManagedServiceInstance)
	echoGroup.PATCH("/cf/service_instances/:cnsiGuid/:siGuid", c.updateManagedServiceInstance)
	echoGroup.POST("/cf/roles/:cnsiGuid", c.createNativeRole)
	echoGroup.DELETE("/cf/roles/:cnsiGuid/:roleGuid", c.deleteNativeRole)

	// Services-domain scoped reads (slice 5: services-domain signal+V3).
	// Path-derived filters layer on top of the existing CF-scoped handlers'
	// ?return= dispatch — see the corresponding handler godoc for tier
	// semantics and CAPI filter mappings.
	echoGroup.GET("/cf/spaces/:cnsiGuid/:spaceGuid/service_instances", c.getNativeServiceInstancesForSpace)
	echoGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/service_instances", c.getNativeServiceInstancesForBroker)
	echoGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/plans", c.getNativeServicePlansForBroker)
	echoGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/offerings", c.getNativeServiceOfferingsForBroker)
}
