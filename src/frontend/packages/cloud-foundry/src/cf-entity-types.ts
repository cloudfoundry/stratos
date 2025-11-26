import type { IRequestEntityTypeState, APIResource, BaseEntityValues } from '@stratosui/store';
import type {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from './cf-api-svc.types';
import type {
  IApp,
  IAppSummary,
  IBuildpack,
  ICfV2Info,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IOrgQuotaDefinition,
  IPrivateDomain,
  IRoute,
  ISecurityGroup,
  ISpace,
  ISpaceQuotaDefinition,
  IStack,
} from './cf-api.types';
import type { AppEnvVarsState, AppStats } from './store/types/app-metadata.types';
import type { CfUser } from './store/types/cf-user.types';

export const applicationEntityType = 'application';
export const stackEntityType = 'stack';
export const spaceEntityType = 'space';
export const routeEntityType = 'route';
export const domainEntityType = 'domain';
export const organizationEntityType = 'organization';
export const quotaDefinitionEntityType = 'quota_definition';
export const cfEventEntityType = 'cloudFoundryEvent';
export const cfInfoEntityType = 'cloudFoundryInfo';
export const cfUserEntityType = 'user';
export const appSummaryEntityType = 'applicationSummary';
export const appStatsEntityType = 'applicationStats';
export const appEnvVarsEntityType = 'environmentVars';
export const serviceEntityType = 'service';
export const serviceBindingEntityType = 'serviceBinding';
export const servicePlanEntityType = 'servicePlan';
export const serviceInstancesEntityType = 'serviceInstance';
export const buildpackEntityType = 'buildpack';
export const securityGroupEntityType = 'securityGroup';
export const featureFlagEntityType = 'featureFlag';
export const privateDomainsEntityType = 'private_domains';
export const spaceQuotaEntityType = 'space_quota_definition';
export const servicePlanVisibilityEntityType = 'servicePlanVisibility';
export const serviceBrokerEntityType = 'serviceBroker';
export const userProvidedServiceInstanceEntityType = 'userProvidedServiceInstance';

export const spaceWithOrgEntityType = 'spaceWithOrg';
export const serviceInstancesWithSpaceEntityType = 'serviceInstancesWithSpace';
export const serviceInstancesWithNoBindingsEntityType = 'serviceInstanceWithNoBindings';
export const serviceBindingNoBindingsEntityType = 'serviceBindingNoBindings';

interface CFEntityValues {
  cfFeatureFlag: IRequestEntityTypeState<APIResource<IFeatureFlag>>;
  cfApplication: IRequestEntityTypeState<APIResource<IApp>>;
  cfStack: IRequestEntityTypeState<APIResource<IStack>>;
  cfSpace: IRequestEntityTypeState<APIResource<ISpace>>;
  cfOrganization: IRequestEntityTypeState<APIResource<IOrganization>>;
  cfRoute: IRequestEntityTypeState<APIResource<IRoute>>;
  cfEvent: IRequestEntityTypeState<APIResource>;
  cfDomain: IRequestEntityTypeState<APIResource<IDomain>>;
  cfUser: IRequestEntityTypeState<APIResource<CfUser>>;
  cfServiceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  cfServicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  cfService: IRequestEntityTypeState<APIResource<IService>>;
  cfServiceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  cfSecurityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  cfServicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  cfServiceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  cfBuildpack: IRequestEntityTypeState<IBuildpack>;
  cfEnvironmentVars: IRequestEntityTypeState<AppEnvVarsState>;
  cfStats: IRequestEntityTypeState<AppStats>;
  cfUserProvidedServiceInstance: IRequestEntityTypeState<IUserProvidedServiceInstance>;
  cfCloudFoundryInfo: IRequestEntityTypeState<ICfV2Info>;
  cfPrivate_domains: IRequestEntityTypeState<IPrivateDomain>;
  cfQuota_definition: IRequestEntityTypeState<APIResource<IOrgQuotaDefinition>>;
  cfSpace_quota_definition: IRequestEntityTypeState<APIResource<ISpaceQuotaDefinition>>;
  cfSummary: IRequestEntityTypeState<IAppSummary>;
}

export interface CFRequestDataState extends CFEntityValues, BaseEntityValues {
  [key: string]: unknown;
}
