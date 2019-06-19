import { appSummaryEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from '../../../core/src/core/cf-api-svc.types';
import {
  IApp,
  IAppSummary,
  IBuildpack,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IOrgQuotaDefinition,
  IRoute,
  ISecurityGroup,
  ISpace,
  ISpaceQuotaDefinition,
  IStack,
} from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { AppStats } from './app-metadata.types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GitCommit, GitRepo } from './git.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { UserProfileInfo } from './user-profile.types';
import { CfUser } from './user.types';

export interface BaseRequestDataState {
  // TODO: Add `stratos` to types
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  // featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  // application: IRequestEntityTypeState<APIResource<IApp>>;
  // stack: IRequestEntityTypeState<APIResource<IStack>>;
  // space: IRequestEntityTypeState<APIResource<ISpace>>;
  // organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  // route: IRequestEntityTypeState<APIResource<IRoute>>;
  // event: IRequestEntityTypeState<APIResource>;
  // gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  // gitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
  // domain: IRequestEntityTypeState<APIResource<IDomain>>;
  // user: IRequestEntityTypeState<APIResource<CfUser>>;
  // serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  // servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  // service: IRequestEntityTypeState<APIResource<IService>>;
  // serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  // securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  // servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  // serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  userProfile: UserProfileInfo;
  metrics: IRequestEntityTypeState<IMetrics>;
  userFavorites: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>;
  // Extensibility
  // [name: string]: IRequestEntityTypeState<any>;
}

// TODO: These should live in the cf module
interface CFEntityValues {
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  application: IRequestEntityTypeState<APIResource<IApp>>;
  stack: IRequestEntityTypeState<APIResource<IStack>>;
  space: IRequestEntityTypeState<APIResource<ISpace>>;
  organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  route: IRequestEntityTypeState<APIResource<IRoute>>;
  event: IRequestEntityTypeState<APIResource>;
  gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  gitRepo: IRequestEntityTypeState<APIResource<GitRepo>>;
  gitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
  domain: IRequestEntityTypeState<APIResource<IDomain>>;
  user: IRequestEntityTypeState<APIResource<CfUser>>;
  serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  service: IRequestEntityTypeState<APIResource<IService>>;
  serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  buildpack: IRequestEntityTypeState<IBuildpack>;
  environmentVars: IRequestEntityTypeState<any>;
  stats: IRequestEntityTypeState<AppStats>;
  userProvidedServiceInstance: IRequestEntityTypeState<IUserProvidedServiceInstance>;
  cloudFoundryInfo: IRequestEntityTypeState<any>;
  private_domains: IRequestEntityTypeState<any>;
  quota_definition: IRequestEntityTypeState<APIResource<IOrgQuotaDefinition>>;
  space_quota_definition: IRequestEntityTypeState<APIResource<ISpaceQuotaDefinition>>;
  [appSummaryEntityType]: IRequestEntityTypeState<IAppSummary>;
}
export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<E extends Record<keyof E, any>,
  > = {
    [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
  };

export interface CFRequestDataState extends CFEntityValues, BaseRequestDataState { }

// class temp<T> {
//   data: T;
// }
// const c = new temp<CFAppState>();
// c.data.cfApplication;

// const d = new temp<CFRequestDataState>();
// d.data.cfApplication;

// const e = new temp<AppState<CFRequestDataState>>();
// e.data.pagination.;

export interface IRequestState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  userFavorites: IRequestEntityTypeState<RequestInfoState>;
}

// TODO: These should live in the cf module
export const defaultCfEntitiesState = {
  // [applicationEntityType]: {},
  // [stackEntityType]: {},
  // [spaceEntityType]: {},
  // [organizationEntityType]: {},
  // [routeEntityType]: {},
  // [appEventEntityType]: {},
  // [endpointSchemaKey]: {},
  // [gitBranchesEntityType]: {},
  // [gitCommitEntityType]: {},
  // [cfUserEntityType]: {},
  // [domainEntityType]: {},
  // [appEnvVarsEntityType]: {},
  // [appStatsEntityType]: {},
  // [appSummaryEntityType]: {},
  // [serviceInstancesEntityType]: {},
  // [servicePlanEntityType]: {},
  // [serviceEntityType]: {},
  // [serviceBindingEntityType]: {},
  // [buildpackEntityType]: {},
  // [securityGroupEntityType]: {},
  // [featureFlagEntityType]: {},
  // [privateDomainsEntityType]: {},
  // [spaceQuotaEntityType]: {},
  // [metricEntityType]: {},
  // [servicePlanVisibilityEntityType]: {},
  // [serviceBrokerEntityType]: {},
  // [userFavoritesSchemaKey]: {},s
  // [userProvidedServiceInstanceEntityType]: []
};
