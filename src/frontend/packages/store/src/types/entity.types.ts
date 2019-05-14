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
  IDomain,
  IFeatureFlag,
  IOrganization,
  IRoute,
  ISecurityGroup,
  ISpace,
  IStack,
  IBuildpack,
  IAppSummary,
} from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState, IRequestTypeState, AppState } from '../app-state';
import {
  appEnvVarsSchemaKey,
  appEventSchemaKey,
  applicationSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  buildpackSchemaKey,
  cfUserSchemaKey,
  domainSchemaKey,
  endpointSchemaKey,
  featureFlagSchemaKey,
  gitBranchesSchemaKey,
  gitCommitSchemaKey,
  metricSchemaKey,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  routeSchemaKey,
  securityGroupSchemaKey,
  serviceBindingSchemaKey,
  serviceBrokerSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  stackSchemaKey,
  userFavoritesSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../helpers/entity-factory';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GitCommit, GitRepo } from './git.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { CfUser } from './user.types';
import { AppStats } from './app-metadata.types';
import { UserProfileInfo } from './user-profile.types';

export interface IRequestDataState {
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
interface EntityValues {
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
  space_quota_definition: IRequestEntityTypeState<any>;
  appSummarySchemaKey: IRequestEntityTypeState<IAppSummary>;
}
export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<
  E extends Record<keyof E, any>,
  > = {
    [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
  };

export interface CFRequestDataState extends EntityValues, IRequestDataState { }

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


export const defaultCfEntitiesState = {
  // [applicationSchemaKey]: {},
  // [stackSchemaKey]: {},
  // [spaceSchemaKey]: {},
  // [organizationSchemaKey]: {},
  // [routeSchemaKey]: {},
  // [appEventSchemaKey]: {},
  // [endpointSchemaKey]: {},
  // [gitBranchesSchemaKey]: {},
  // [gitCommitSchemaKey]: {},
  // [cfUserSchemaKey]: {},
  // [domainSchemaKey]: {},
  // [appEnvVarsSchemaKey]: {},
  // [appStatsSchemaKey]: {},
  // [appSummarySchemaKey]: {},
  // [serviceInstancesSchemaKey]: {},
  // [servicePlanSchemaKey]: {},
  // [serviceSchemaKey]: {},
  // [serviceBindingSchemaKey]: {},
  // [buildpackSchemaKey]: {},
  // [securityGroupSchemaKey]: {},
  // [featureFlagSchemaKey]: {},
  // [privateDomainsSchemaKey]: {},
  // [spaceQuotaSchemaKey]: {},
  // [metricSchemaKey]: {},
  // [servicePlanVisibilitySchemaKey]: {},
  // [serviceBrokerSchemaKey]: {},
  // [userFavoritesSchemaKey]: {},
  // [userProvidedServiceInstanceSchemaKey]: []
};
