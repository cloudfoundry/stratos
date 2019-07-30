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
import { BaseEntityValues } from '../../store/src/types/entity.types';
import { AppStats } from './store/types/app-metadata.types';
import { GitBranch, GitCommit, GitRepo } from './store/types/git.types';
import { CfUser } from './store/types/user.types';

interface CFEntityValues {
  cfFeatureFlag: IRequestEntityTypeState<APIResource<IFeatureFlag>>;
  cfApplication: IRequestEntityTypeState<APIResource<IApp>>;
  cfStack: IRequestEntityTypeState<APIResource<IStack>>;
  cfSpace: IRequestEntityTypeState<APIResource<ISpace>>;
  cfOrganization: IRequestEntityTypeState<APIResource<IOrganization>>;
  cfRoute: IRequestEntityTypeState<APIResource<IRoute>>;
  cfEvent: IRequestEntityTypeState<APIResource>;
  cfGitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  cfGitRepo: IRequestEntityTypeState<APIResource<GitRepo>>;
  cfGitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
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
  cfEnvironmentVars: IRequestEntityTypeState<any>;
  cfStats: IRequestEntityTypeState<AppStats>;
  cfUserProvidedServiceInstance: IRequestEntityTypeState<IUserProvidedServiceInstance>;
  cfCloudFoundryInfo: IRequestEntityTypeState<any>;
  cfPrivate_domains: IRequestEntityTypeState<any>;
  cfQuota_definition: IRequestEntityTypeState<APIResource<IOrgQuotaDefinition>>;
  cfSpace_quota_definition: IRequestEntityTypeState<APIResource<ISpaceQuotaDefinition>>;
  cfSummary: IRequestEntityTypeState<IAppSummary>;
}

export interface CFRequestDataState extends CFEntityValues, BaseEntityValues { }
