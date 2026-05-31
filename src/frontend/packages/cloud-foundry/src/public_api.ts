/*
 * Public API Surface of cloud-foundry
 */

export * from './cloud-foundry-package.module';
export * from './cloud-foundry-routing.module';

export * from './cf-api-svc.types';

// Services
export { ApplicationService } from './features/applications/application.service';
export { ApplicationMonitorService } from './features/applications/application-monitor.service';
export { ApplicationStateService, ApplicationStateData } from './shared/services/application-state.service';
export { ApplicationEnvVarsHelper } from './features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
export { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig, CfOrgSpaceItem } from './shared/data-services/cf-org-space-service.service';
export { CloudFoundryService } from './shared/data-services/cloud-foundry.service';
export { CfOrgSpaceLabelService } from './shared/services/cf-org-space-label.service';

// Utility Functions
export { getGuids } from './features/applications/application/application-base.component';

// Service Instance Constants
export { CSI_CANCEL_URL } from './shared/components/add-service-instance/csi-mode.service';

// Helpers
export { waitForCFPermissions, isServiceInstance, isUserProvidedServiceInstance, goToAppWall, cfOrgSpaceFilter } from './features/cf/cf.helpers';
export { getSpaceRoles, IUserRole, getOrgRolesString } from './features/cf/cf.helpers';
export { getCFEntityKey } from './cf-entity-helpers';
export { getStartedAppInstanceCount } from './cf.helpers';
export { createOrgQuotaDefinition } from './features/cf/services/cloud-foundry-organization.service';

// Permissions
export { CfCurrentUserPermissions, cfCurrentUserPermissionsService } from './user-permissions/cf-user-permissions-checkers';
export { CfCurrentUserRolesSignalService } from './user-permissions/cf-current-user-roles-signal.service';
export { CfCurrentUserRolesDataService } from './services/cf-current-user-roles-data.service';

// Test helpers
export * from './entity-relations/entity-relations-spec-helper';

// Entity Relations
export { createEntityRelationPaginationKey } from './entity-relations/entity-relations.types';

// CF Types
export { CF_ENDPOINT_TYPE } from './cf-types';
export { CFAppState } from './cf-app-state';
export * from './cf-api.types';
export { ActiveRouteCfOrgSpace, ActiveRouteCfCell } from './features/cf/cf-page.types';

// CF Entity Types
export {
  applicationEntityType,
  stackEntityType,
  spaceEntityType,
  routeEntityType,
  domainEntityType,
  organizationEntityType,
  quotaDefinitionEntityType,
  cfEventEntityType,
  cfUserEntityType,
  appSummaryEntityType,
  appStatsEntityType,
  appEnvVarsEntityType,
  serviceEntityType,
  serviceBindingEntityType,
  servicePlanEntityType,
  serviceInstancesEntityType,
  buildpackEntityType,
  securityGroupEntityType,
  featureFlagEntityType,
  privateDomainsEntityType,
  spaceQuotaEntityType,
  servicePlanVisibilityEntityType,
  serviceBrokerEntityType,
  userProvidedServiceInstanceEntityType
} from './cf-entity-types';

// CF User Types
export {
  CfUser,
  CfUserRoleParams,
  OrgUserRoleNames,
  SpaceUserRoleNames,
  UserRoleInOrg,
  UserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  createUserRoleInOrg,
  createUserRoleInSpace
} from './store/types/cf-user.types';

// CF Users Roles Types
export { UserRoleLabels } from './store/types/users-roles.types';

// CF User Actions
export { RemoveCfUserRole } from './actions/users.actions';

// CF Route Actions

// CF Selectors
export { selectCfEntity } from './store/selectors/api.selectors';

// CF Actions
export { UpdateExistingApplication } from './actions/application.actions';

// CF Route Types
export { Route, RouteMode, CfRoute } from './store/types/route.types';

// CF Entity Generator
export { generateCFEntities } from './cf-entity-generator';
export { cfEntityFactory } from './cf-entity-factory';

// CF Entity Catalog
export { cfEntityCatalog } from './cf-entity-catalog';

// List Configuration Base Class
export { BaseCfListConfig } from './shared/components/list/list-types/base-cf/base-cf-list-config';

// Components
export { CfEndpointsMissingComponent } from './shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
export { CfOrgSpaceLinksComponent } from './shared/components/cf-org-space-links/cf-org-space-links.component';
export { CardAppInstancesComponent } from './shared/components/cards/card-app-instances/card-app-instances.component';
export { CardAppUsageComponent } from './shared/components/cards/card-app-usage/card-app-usage.component';
export { RunningInstancesComponent } from './shared/components/running-instances/running-instances.component';

// Directives
export { CfUserPermissionDirective } from './shared/directives/cf-user-permission/cf-user-permission.directive';

// List Table Cell Components
export { TableCellAppInstancesComponent } from './shared/components/list/list-types/app/table-cell-app-instances/table-cell-app-instances.component';
export { TableCellAppStatusComponent } from './shared/components/list/list-types/app/table-cell-app-status/table-cell-app-status.component';

// FWT-934 entity-key namespacing + diagnostics channel
export { cfEntityId, parseCfEntityId, isComposite } from './cf-entity-ref';
export type { CFEntityRef, CFEntityId } from './cf-entity-ref';
export { selectCFEntity, selectCFEntities } from './selectors/cf-entity.selectors';
export type { StApp, StOrg, StSpace, StAppDetail, StOrgDetail } from './services/endpoint-data/stratos-types';
export { StratosDiagnostics } from './services/diagnostics/stratos-diagnostics.service';
export { BareGuidLookupGuard } from './services/diagnostics/bare-guid-lookup-guard';
export { cfApiInterceptor } from './interceptors/cf-api-interceptor';
export {
  DIAGNOSTIC_CODE_FAMILIES,
  isDiagnosticCode,
} from './services/diagnostics/diagnostics.types';
export type {
  DiagnosticCode,
  DiagnosticCounter,
  DiagnosticSample,
  DiagnosticsQueryOptions,
  DiagnosticsSnapshotEnvelope,
} from './services/diagnostics/diagnostics.types';
