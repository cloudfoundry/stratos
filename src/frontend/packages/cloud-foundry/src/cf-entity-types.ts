import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from '../../core/src/core/cf-api-svc.types';
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
} from '../../core/src/core/cf-api.types';
import { IRequestEntityTypeState } from '../../store/src/app-state';
import { APIResource } from '../../store/src/types/api.types';
import { AppStats } from './store/types/app-metadata.types';
import { BaseEntityValues } from '../../store/src/types/entity.types';
import { GitBranch, GitCommit, GitRepo } from './store/types/git.types';
import { CfUser } from './store/types/user.types';
import { appSummaryEntityType } from './cf-entity-factory';

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

export interface CFRequestDataState extends CFEntityValues, BaseEntityValues { }
