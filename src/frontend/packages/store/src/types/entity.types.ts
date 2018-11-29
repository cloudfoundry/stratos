import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
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
} from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
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
  appAutoscalerHealthSchemaKey,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerAppMetricSchemaKey,
  appAutoscalerInsMetricSchemaKey,
} from '../helpers/entity-factory';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GitCommit } from './git.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { CfUser } from './user.types';

export interface IRequestDataState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  application: IRequestEntityTypeState<APIResource<IApp>>;
  stack: IRequestEntityTypeState<APIResource<IStack>>;
  space: IRequestEntityTypeState<APIResource<ISpace>>;
  organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  route: IRequestEntityTypeState<APIResource<IRoute>>;
  event: IRequestEntityTypeState<APIResource>;
  gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
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
  metrics: IRequestEntityTypeState<IMetrics>;
  userFavorites: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>;
  // Extensibility
  [name: string]: IRequestEntityTypeState<any>;
}

export interface IRequestState extends IRequestTypeState {
  application: IRequestEntityTypeState<RequestInfoState>;
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  system: IRequestEntityTypeState<RequestInfoState>;
  featureFlag: IRequestEntityTypeState<RequestInfoState>;
  stack: IRequestEntityTypeState<RequestInfoState>;
  space: IRequestEntityTypeState<RequestInfoState>;
  organization: IRequestEntityTypeState<RequestInfoState>;
  route: IRequestEntityTypeState<RequestInfoState>;
  event: IRequestEntityTypeState<RequestInfoState>;
  gitBranches: IRequestEntityTypeState<RequestInfoState>;
  gitCommits: IRequestEntityTypeState<RequestInfoState>;
  domain: IRequestEntityTypeState<RequestInfoState>;
  user: IRequestEntityTypeState<RequestInfoState>;
  serviceInstance: IRequestEntityTypeState<RequestInfoState>;
  servicePlan: IRequestEntityTypeState<RequestInfoState>;
  service: IRequestEntityTypeState<RequestInfoState>;
  serviceBinding: IRequestEntityTypeState<RequestInfoState>;
  securityGroup: IRequestEntityTypeState<RequestInfoState>;
  servicePlanVisibility: IRequestEntityTypeState<RequestInfoState>;
  serviceBroker: IRequestEntityTypeState<RequestInfoState>;
  userFavorites: IRequestEntityTypeState<RequestInfoState>;
  // Extensibility
  [name: string]: IRequestEntityTypeState<RequestInfoState>;
}


export const defaultCfEntitiesState = {
  [applicationSchemaKey]: {},
  [stackSchemaKey]: {},
  [spaceSchemaKey]: {},
  [organizationSchemaKey]: {},
  [routeSchemaKey]: {},
  [appEventSchemaKey]: {},
  [endpointSchemaKey]: {},
  [gitBranchesSchemaKey]: {},
  [gitCommitSchemaKey]: {},
  [cfUserSchemaKey]: {},
  [domainSchemaKey]: {},
  [appEnvVarsSchemaKey]: {},
  [appStatsSchemaKey]: {},
  [appSummarySchemaKey]: {},
  [serviceInstancesSchemaKey]: {},
  [servicePlanSchemaKey]: {},
  [serviceSchemaKey]: {},
  [serviceBindingSchemaKey]: {},
  [buildpackSchemaKey]: {},
  [securityGroupSchemaKey]: {},
  [featureFlagSchemaKey]: {},
  [privateDomainsSchemaKey]: {},
  [spaceQuotaSchemaKey]: {},
  [metricSchemaKey]: {},
  [servicePlanVisibilitySchemaKey]: {},
  [serviceBrokerSchemaKey]: {},
  [userFavoritesSchemaKey]: {},
  [userProvidedServiceInstanceSchemaKey]: [],
  [appAutoscalerHealthSchemaKey]: {},
  [appAutoscalerPolicySchemaKey]: {},
  [appAutoscalerScalingHistorySchemaKey]: {},
  [appAutoscalerAppMetricSchemaKey]: {},
  [appAutoscalerInsMetricSchemaKey]: {},
};
