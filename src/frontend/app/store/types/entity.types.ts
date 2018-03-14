import { IApp, IDomain, IFeatureFlag, IOrganization, IRoute, ISecurityGroup, ISpace, IStack } from '../../core/cf-api.types';
import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { AppEnvVarSchema, AppStatSchema, AppSummarySchema } from './app-metadata.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GithubCommit } from './github.types';
import { CfService, CfServiceBinding, CfServiceInstance, CfServicePlan } from './service.types';
import { SystemInfo } from './system.types';
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
  githubBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  githubCommits: IRequestEntityTypeState<APIResource<GithubCommit>>;
  domain: IRequestEntityTypeState<APIResource<IDomain>>;
  user: IRequestEntityTypeState<APIResource<CfUser>>;
  serviceInstance: IRequestEntityTypeState<APIResource<CfServiceInstance>>;
  servicePlan: IRequestEntityTypeState<APIResource<CfServicePlan>>;
  service: IRequestEntityTypeState<APIResource<CfService>>;
  serviceBinding: IRequestEntityTypeState<APIResource<CfServiceBinding>>;
  securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
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
  githubBranches: IRequestEntityTypeState<RequestInfoState>;
  githubCommits: IRequestEntityTypeState<RequestInfoState>;
  domain: IRequestEntityTypeState<RequestInfoState>;
  user: IRequestEntityTypeState<RequestInfoState>;
  serviceInstance: IRequestEntityTypeState<RequestInfoState>;
  servicePlan: IRequestEntityTypeState<RequestInfoState>;
  service: IRequestEntityTypeState<RequestInfoState>;
  serviceBinding: IRequestEntityTypeState<RequestInfoState>;
  securityGroup: IRequestEntityTypeState<RequestInfoState>;
}


export const defaultCfEntitiesState = {
  application: {},
  stack: {},
  space: {},
  organization: {},
  route: {},
  event: {},
  endpoint: {},
  githubBranches: {},
  user: {},
  domain: {},
  securityGroup: {},
  buildpack: {},
  featureFlag: {},
  serviceInstance: {},
  servicePlan: {},
  service: {},
  serviceBinding: {},
  [AppEnvVarSchema.key]: {},
  [AppStatSchema.key]: {},
  [AppSummarySchema.key]: {}
};
