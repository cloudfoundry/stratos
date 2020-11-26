import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { APIResource } from '../../store/src/types/api.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
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
import { ISpaceFavMetadata } from './cf-metadata-types';
import { AppEnvVarActionBuilders } from './entity-action-builders/application-env-var.action-builders';
import { AppStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import { AppSummaryActionBuilders } from './entity-action-builders/application-summary.action-builders';
import { ApplicationActionBuilders } from './entity-action-builders/application.action-builders';
import { BuildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { CfEventActionBuilders } from './entity-action-builders/cf-event.action-builders';
import { CfInfoDefinitionActionBuilders } from './entity-action-builders/cf-info.action-builders';
import { DomainActionBuilders } from './entity-action-builders/domin.action-builder';
import { FeatureFlagActionBuilders } from './entity-action-builders/feature-flag.action-builder';
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
import { CfUser } from './store/types/cf-user.types';

/**
 * A strongly typed collection of Cloud Foundry Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class CfEntityCatalog {
  public cfEndpoint: StratosCatalogEndpointEntity;

  public quotaDefinition: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrgQuotaDefinition>,
    QuotaDefinitionActionBuilder
  >;

  public appEnvVar: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource,
    AppEnvVarActionBuilders
  >;

  public appSummary: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    IAppSummary,
    AppSummaryActionBuilders
  >;

  public spaceQuota: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISpaceQuotaDefinition>,
    SpaceQuotaDefinitionActionBuilders
  >;

  public privateDomain: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IPrivateDomain>
  >;

  public cfInfo: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<ICfV2Info>,
    CfInfoDefinitionActionBuilders
  >;

  public appStats: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    AppStat,
    AppStatsActionBuilders
  >;

  public buildPack: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IBuildpack>,
    BuildpackActionBuilders
  >;

  public serviceBroker: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceBroker>,
    ServiceBrokerActionBuilders
  >;

  public servicePlanVisibility: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServicePlanVisibility>,
    ServicePlanVisibilityActionBuilders
  >;

  public securityGroup: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISecurityGroup>,
    SecurityGroupBuilders
  >;

  public serviceBinding: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceBinding>,
    ServiceBindingActionBuilders
  >;

  public service: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IService>,
    ServiceActionBuilders
  >;

  public servicePlan: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServicePlan>,
    ServicePlanActionBuilders
  >;

  public serviceInstance: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceInstance>,
    ServiceInstanceActionBuilders
  >;

  public user: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<CfUser>,
    UserActionBuilders
  >;

  public domain: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IDomain>,
    DomainActionBuilders
  >;

  public event: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<CfEvent>,
    CfEventActionBuilders
  >;

  public route: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IRoute>,
    RoutesActionBuilders
  >;

  public stack: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IStack>,
    StackActionBuilders
  >;

  public featureFlag: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    IFeatureFlag,
    FeatureFlagActionBuilders
  >;

  public application: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IApp>,
    ApplicationActionBuilders
  >;

  public space: StratosBaseCatalogEntity<
    ISpaceFavMetadata,
    APIResource<ISpace>,
    SpaceActionBuilders
  >;

  public org: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrganization>,
    OrganizationActionBuilders
  >;

  public metric: StratosBaseCatalogEntity<
    IFavoriteMetadata
  >;

  public userProvidedService: StratosBaseCatalogEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder
  >;
}

export const cfEntityCatalog: CfEntityCatalog = new CfEntityCatalog();
