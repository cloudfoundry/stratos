// src/jetstream/plugins/cloudfoundry/native_routes.go
package cloudfoundry

import "github.com/labstack/echo/v4"

// addNativeRoutes registers Stratos-native CF v3 routes on the CF plugin.
// Called from AddSessionGroupRoutes.
func (c *CloudFoundrySpecification) addNativeRoutes(echoGroup *echo.Group) {
	// Wrap all native CF routes in middleware that classifies CF failures
	// (token-refresh / capi errors) into an X-Stratos-Error-Reason header +
	// JSON body. Empty prefix keeps the registered route paths identical.
	nativeGroup := echoGroup.Group("", classifyNativeErrors)
	nativeGroup.GET("/cf/info/:cnsiGuid", c.getNativeCFInfo)
	nativeGroup.GET("/cf/orgs/:cnsiGuid", c.getNativeOrgs)
	nativeGroup.GET("/cf/apps/:cnsiGuid", c.getNativeApps)
	nativeGroup.GET("/cf/apps/:cnsiGuid/:appGuid", c.getNativeAppDetail)
	nativeGroup.GET("/cf/apps/:cnsiGuid/:appGuid/env", c.getNativeAppEnv)
	nativeGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid", c.deleteNativeApp)
	nativeGroup.DELETE("/cf/apps/:cnsiGuid/:appGuid/instances/:index", c.deleteAppInstance)
	nativeGroup.PATCH("/cf/apps/:cnsiGuid/:appGuid", c.patchApp)
	nativeGroup.POST("/cf/apps/:cnsiGuid/:appGuid/actions/:action", c.appAction)
	nativeGroup.POST("/cf/apps/:cnsiGuid/:appGuid/scale", c.scaleApp)
	nativeGroup.GET("/cf/app-stats/:cnsiGuid/:appGuid", c.getAppStats)
	nativeGroup.GET("/cf/app-stats/:cnsiGuid", c.getAppStatsBatch)
	nativeGroup.DELETE("/cf/orgs/:cnsiGuid/:orgGuid", c.deleteNativeOrg)
	nativeGroup.DELETE("/cf/spaces/:cnsiGuid/:spaceGuid", c.deleteNativeSpace)
	nativeGroup.GET("/cf/spaces/:cnsiGuid/:spaceGuid", c.getNativeSpaceDetail)
	nativeGroup.PUT("/cf/apps/:cnsiGuid/:appGuid/routes/:routeGuid", c.assignRouteToApp)
	nativeGroup.GET("/cf/spaces/:cnsiGuid", c.getNativeSpaces)
	nativeGroup.GET("/cf/routes/:cnsiGuid", c.getNativeRouteCount)
	nativeGroup.GET("/cf/apps/:cnsiGuid/:appGuid/routes", c.getAppRoutes)
	nativeGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid/apps/:appGuid", c.unmapRouteFromApp)
	nativeGroup.DELETE("/cf/routes/:cnsiGuid/:routeGuid", c.deleteNativeRoute)
	nativeGroup.POST("/cf/service_bindings/:cnsiGuid", c.createServiceBinding)
	nativeGroup.DELETE("/cf/service_bindings/:cnsiGuid/:bindingGuid", c.deleteServiceBinding)
	nativeGroup.GET("/cf/apps/:cnsiGuid/:appGuid/service_bindings", c.getAppServiceBindings)
	nativeGroup.GET("/cf/org/:cnsiGuid/:orgGuid", c.getNativeOrgDetail)
	nativeGroup.GET("/cf/org/:cnsiGuid/:orgGuid/spaces", c.getNativeOrgSpaces)
	nativeGroup.GET("/cf/org/:cnsiGuid/:orgGuid/private_domains", c.getNativeOrgDomains)
	nativeGroup.GET("/cf/service_offerings/:cnsiGuid", c.getNativeServiceOfferings)
	nativeGroup.GET("/cf/service_offerings/:cnsiGuid/:offeringGuid", c.getNativeServiceOfferingDetail)
	nativeGroup.GET("/cf/service_instances/:cnsiGuid", c.getNativeServiceInstances)
	nativeGroup.GET("/cf/service_instances/:cnsiGuid/:instanceGuid", c.getNativeServiceInstanceDetail)
	nativeGroup.GET("/cf/service_instances/:cnsiGuid/:instanceGuid/service_bindings", c.getServiceInstanceServiceBindings)
	nativeGroup.DELETE("/cf/service_instances/:cnsiGuid/:siGuid", c.deleteServiceInstance)
	nativeGroup.GET("/cf/users/:cnsiGuid", c.getNativeUsers)
	nativeGroup.GET("/cf/users/:cnsiGuid/:userGuid", c.getNativeUserDetail)
	nativeGroup.GET("/cf/current-user-roles/:cnsiGuid", c.getNativeCurrentUserRoles)
	nativeGroup.GET("/cf/stacks/:cnsiGuid", c.getNativeStacks)
	nativeGroup.GET("/cf/buildpacks/:cnsiGuid", c.getNativeBuildpacks)
	nativeGroup.GET("/cf/security_groups/:cnsiGuid", c.getNativeSecurityGroups)
	nativeGroup.GET("/cf/feature_flags/:cnsiGuid", c.getNativeFeatureFlags)
	nativeGroup.GET("/cf/organization_quotas/:cnsiGuid", c.getNativeOrgQuotas)
	nativeGroup.GET("/cf/organization_quotas/:cnsiGuid/:quotaGuid", c.getNativeOrgQuotaDetail)
	nativeGroup.GET("/cf/space_quotas/:cnsiGuid", c.getNativeSpaceQuotas)
	nativeGroup.GET("/cf/space_quotas/:cnsiGuid/:quotaGuid", c.getNativeSpaceQuotaDetail)
	nativeGroup.GET("/cf/audit_events/:cnsiGuid", c.getNativeAuditEvents)
	nativeGroup.GET("/cf/org/:cnsiGuid/:orgGuid/events", c.getNativeOrgAuditEvents)
	nativeGroup.GET("/cf/space/:cnsiGuid/:spaceGuid/events", c.getNativeSpaceAuditEvents)
	nativeGroup.GET("/cf/service_plans/:cnsiGuid", c.getNativeServicePlans)
	nativeGroup.GET("/cf/service_plans/:cnsiGuid/:planGuid", c.getNativeServicePlanDetail)
	nativeGroup.GET("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.getNativeServicePlanVisibility)
	nativeGroup.POST("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.applyNativeServicePlanVisibility)
	nativeGroup.PATCH("/cf/service_plans/:cnsiGuid/:planGuid/visibility", c.applyNativeServicePlanVisibility)
	nativeGroup.DELETE("/cf/service_plans/:cnsiGuid/:planGuid/visibility/:orgGuid", c.removeOrgFromNativeServicePlanVisibility)
	nativeGroup.GET("/cf/service_brokers/:cnsiGuid", c.getNativeServiceBrokers)
	nativeGroup.GET("/cf/service_brokers/:cnsiGuid/:brokerGuid", c.getNativeServiceBrokerDetail)
	nativeGroup.GET("/cf/domains/:cnsiGuid", c.getNativeDomains)
	nativeGroup.GET("/cf/domains/:cnsiGuid/:domainGuid", c.getNativeDomainDetail)
	nativeGroup.POST("/cf/user_provided_service_instances/:cnsiGuid", c.createUserProvidedServiceInstance)
	nativeGroup.PATCH("/cf/user_provided_service_instances/:cnsiGuid/:siGuid", c.updateUserProvidedServiceInstance)

	// A10 Revisions UI: list + rollback. Rollback's signature mirrors
	// restageApp (pre-extracted GUIDs), so we wrap it for echo.
	nativeGroup.GET("/cf/apps/:cnsiGuid/:appGuid/revisions", c.getAppRevisions)
	nativeGroup.POST("/cf/apps/:cnsiGuid/:appGuid/rollback", func(ctx echo.Context) error {
		return c.rollbackApp(ctx, ctx.Param("cnsiGuid"), ctx.Param("appGuid"))
	})

	// Phase 1C write-side completion
	nativeGroup.POST("/cf/orgs/:cnsiGuid", c.createNativeOrg)
	nativeGroup.PATCH("/cf/orgs/:cnsiGuid/:orgGuid", c.updateNativeOrg)
	nativeGroup.POST("/cf/spaces/:cnsiGuid", c.createNativeSpace)
	nativeGroup.PATCH("/cf/spaces/:cnsiGuid/:spaceGuid", c.updateNativeSpace)
	nativeGroup.PUT("/cf/spaces/:cnsiGuid/:spaceGuid/features/ssh", c.setSpaceSshFeature)
	nativeGroup.POST("/cf/routes/:cnsiGuid", c.createNativeRoute)
	nativeGroup.POST("/cf/apps/:cnsiGuid", c.createNativeApp)
	nativeGroup.POST("/cf/organization_quotas/:cnsiGuid", c.createNativeOrgQuota)
	nativeGroup.PATCH("/cf/organization_quotas/:cnsiGuid/:quotaGuid", c.updateNativeOrgQuota)
	nativeGroup.DELETE("/cf/organization_quotas/:cnsiGuid/:quotaGuid", c.deleteNativeOrgQuota)
	nativeGroup.POST("/cf/organization_quotas/:cnsiGuid/:quotaGuid/relationships/organizations", c.applyOrgQuotaToOrgs)
	nativeGroup.POST("/cf/space_quotas/:cnsiGuid", c.createNativeSpaceQuota)
	nativeGroup.PATCH("/cf/space_quotas/:cnsiGuid/:quotaGuid", c.updateNativeSpaceQuota)
	nativeGroup.POST("/cf/space_quotas/:cnsiGuid/:quotaGuid/relationships/spaces", c.applySpaceQuotaToSpaces)
	nativeGroup.DELETE("/cf/space_quotas/:cnsiGuid/:quotaGuid/relationships/spaces/:spaceGuid", c.removeSpaceQuotaFromSpace)
	nativeGroup.POST("/cf/service_instances/:cnsiGuid", c.createManagedServiceInstance)
	nativeGroup.PATCH("/cf/service_instances/:cnsiGuid/:siGuid", c.updateManagedServiceInstance)
	nativeGroup.POST("/cf/roles/:cnsiGuid", c.createNativeRole)
	nativeGroup.DELETE("/cf/roles/:cnsiGuid/:roleGuid", c.deleteNativeRole)

	// Services-domain scoped reads (slice 5: services-domain signal+V3).
	// Path-derived filters layer on top of the existing CF-scoped handlers'
	// ?return= dispatch — see the corresponding handler godoc for tier
	// semantics and CAPI filter mappings.
	nativeGroup.GET("/cf/spaces/:cnsiGuid/:spaceGuid/service_instances", c.getNativeServiceInstancesForSpace)
	nativeGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/service_instances", c.getNativeServiceInstancesForBroker)
	nativeGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/plans", c.getNativeServicePlansForBroker)
	nativeGroup.GET("/cf/brokers/:cnsiGuid/:brokerGuid/offerings", c.getNativeServiceOfferingsForBroker)
}
