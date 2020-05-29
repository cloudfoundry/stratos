import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from './cf-api-svc.types';
import {
  CfEvent,
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
import { IAppFavMetadata, IBasicCFMetaData, IOrgFavMetadata, ISpaceFavMetadata } from './cf-metadata-types';
import { AppEnvVarActionBuilders } from './entity-action-builders/application-env-var.action-builders';
import { AppStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import { AppSummaryActionBuilders } from './entity-action-builders/application-summary.action-builders';
import { ApplicationActionBuilders } from './entity-action-builders/application.action-builders';
import { BuildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { CfEventActionBuilders } from './entity-action-builders/cf-event.action-builders';
import { CfInfoDefinitionActionBuilders } from './entity-action-builders/cf-info.action-builders';
import { DomainActionBuilders } from './entity-action-builders/domin.action-builder';
import { FeatureFlagActionBuilders } from './entity-action-builders/feature-flag.action-builder';
import {
  GitBranchActionBuilders,
  GitCommitActionBuilders,
  GitCommitActionBuildersConfig,
  GitRepoActionBuilders,
} from './entity-action-builders/git-action-builder';
import { OrganizationActionBuilders } from './entity-action-builders/organization.action-builders';
import { QuotaDefinitionActionBuilder } from './entity-action-builders/quota-definition.action-builders';
import { RoutesActionBuilders } from './entity-action-builders/routes.action-builder';
import { SecurityGroupBuilders } from './entity-action-builders/security-groups.action-builder';
import { ServiceBindingActionBuilders } from './entity-action-builders/service-binding.action-builders';
import { ServiceBrokerActionBuilders } from './entity-action-builders/service-broker.entity-builders';
import { ServiceInstanceActionBuilders } from './entity-action-builders/service-instance.action.builders';
import { ServicePlanVisibilityActionBuilders } from './entity-action-builders/service-plan-visibility.action-builders';
import { ServicePlanActionBuilders } from './entity-action-builders/service-plan.action-builders';
import { ServiceActionBuilders } from './entity-action-builders/service.entity-builders';
import { SpaceQuotaDefinitionActionBuilders } from './entity-action-builders/space-quota.action-builders';
import { SpaceActionBuilders } from './entity-action-builders/space.action-builders';
import { StackActionBuilders } from './entity-action-builders/stack-action-builders';
import { UserProvidedServiceActionBuilder } from './entity-action-builders/user-provided-service.action-builders';
import { UserActionBuilders } from './entity-action-builders/user.action-builders';
import { AppStat } from './store/types/app-metadata.types';
import { GitBranch, GitCommit, GitRepo } from './store/types/git.types';
import { CfUser } from './store/types/user.types';

/**
 * A strongly typed collection of Cloud Foundry Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class CfEntityCatalog {
  public cfEndpoint: StratosCatalogEndpointEntity;

  public quotaDefinition: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IOrgQuotaDefinition>,
    QuotaDefinitionActionBuilder
  >;

  public appEnvVar: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource,
    AppEnvVarActionBuilders
  >;

  public appSummary: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    IAppSummary,
    AppSummaryActionBuilders
  >;

  public spaceQuota: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ISpaceQuotaDefinition>,
    SpaceQuotaDefinitionActionBuilders
  >;

  public privateDomain: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IPrivateDomain>
  >;

  public cfInfo: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ICfV2Info>,
    CfInfoDefinitionActionBuilders
  >;

  public appStats: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    AppStat,
    AppStatsActionBuilders
  >;

  public buildPack: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IBuildpack>,
    BuildpackActionBuilders
  >;

  public serviceBroker: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceBroker>,
    ServiceBrokerActionBuilders
  >;

  public servicePlanVisibility: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServicePlanVisibility>,
    ServicePlanVisibilityActionBuilders
  >;

  public securityGroup: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<ISecurityGroup>,
    SecurityGroupBuilders
  >;

  public serviceBinding: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceBinding>,
    ServiceBindingActionBuilders
  >;

  public service: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IService>,
    ServiceActionBuilders
  >;

  public servicePlan: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServicePlan>,
    ServicePlanActionBuilders
  >;

  public serviceInstance: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IServiceInstance>,
    ServiceInstanceActionBuilders
  >;

  public user: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<CfUser>,
    UserActionBuilders
  >;

  public domain: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IDomain>,
    DomainActionBuilders
  >;

  public gitCommit: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    GitCommit,
    GitCommitActionBuildersConfig,
    GitCommitActionBuilders
  >;

  public gitRepo: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    GitRepo,
    GitRepoActionBuilders
  >;

  public gitBranch: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    GitBranch,
    GitBranchActionBuilders
  >;

  public event: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<CfEvent>,
    CfEventActionBuilders
  >;

  public route: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IRoute>,
    RoutesActionBuilders
  >;

  public stack: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IStack>,
    StackActionBuilders
  >;

  public featureFlag: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    IFeatureFlag,
    FeatureFlagActionBuilders
  >;

  public application: StratosBaseCatalogEntity<
    IAppFavMetadata,
    APIResource<IApp>,
    ApplicationActionBuilders
  >;

  public space: StratosBaseCatalogEntity<
    ISpaceFavMetadata,
    APIResource<ISpace>,
    SpaceActionBuilders
  >;

  public org: StratosBaseCatalogEntity<
    IOrgFavMetadata,
    APIResource<IOrganization>,
    OrganizationActionBuilders
  >;

  public metric: StratosBaseCatalogEntity<
    IBasicCFMetaData
  >;

  public userProvidedService: StratosBaseCatalogEntity<
    IBasicCFMetaData,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder
  >;
}

export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
