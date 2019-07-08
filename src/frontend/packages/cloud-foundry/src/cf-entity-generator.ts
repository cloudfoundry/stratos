import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IUserProvidedServiceInstance,
} from '../../core/src/core/cf-api-svc.types';
import {
  IApp,
  IBuildpack,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IRoute,
  ISecurityGroup,
  ISpace,
  IStack,
} from '../../core/src/core/cf-api.types';
import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity,
} from '../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { getCFEntityKey } from './cf-entity-helpers';
import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { IStratosEndpointDefinition } from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import { BaseEndpointAuth } from '../../core/src/features/endpoints/endpoint-auth';
import { APIResource } from '../../store/src/types/api.types';
import { AppStats } from '../../store/src/types/app-metadata.types';
import { GitBranch, GitCommit, GitRepo } from '../../store/src/types/git.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
import { CfUser } from '../../store/src/types/user.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  appEnvVarsEntityType,
  appEventEntityType,
  applicationEntityType,
  appStatsEntityType,
  appSummaryEntityType,
  buildpackEntityType,
  cfEntityFactory,
  cfInfoEntityType,
  cfUserEntityType,
  domainEntityType,
  featureFlagEntityType,
  gitBranchesEntityType,
  gitCommitEntityType,
  gitRepoEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  securityGroupEntityType,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
  serviceBrokerEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithNoBindingsEntityType,
  serviceInstancesWithspaceEntityType,
  servicePlanEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
  spaceWithOrgEntityType,
  stackEntityType,
  userProvidedServiceInstanceEntityType,
} from './cf-entity-factory';
import {
  endpointDisconnectUserReducer,
  userReducer,
  userSpaceOrgReducer
} from '../../store/src/reducers/users.reducer';
import { routeReducer, updateAppSummaryRoutesReducer } from '../../store/src/reducers/routes.reducer';
import { serviceInstanceReducer } from '../../store/src/reducers/service-instance.reducer';
import { endpointDisconnectApplicationReducer } from '../../store/src/reducers/endpoint-disconnect-application.reducer';
import { updateApplicationRoutesReducer } from '../../store/src/reducers/application-route.reducer';
import { updateSpaceQuotaReducer } from '../../store/src/reducers/space-quota.reducer';
import { applicationAddRemoveReducer } from '../../store/src/reducers/application-add-remove-reducer';
import { updateOrganizationQuotaReducer } from '../../store/src/reducers/organization-quota.reducer';
import { updateOrganizationSpaceReducer } from '../../store/src/reducers/organization-space.reducer';
import { IAppFavMetadata, IBasicCFMetaData, IOrgFavMetadata, ISpaceFavMetadata } from './cf-metadata-types';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';

export function registerCFEntities() {
  generateCFEntities().forEach(entity => entityCatalogue.register(entity));
}

export function generateCFEntities(): StratosBaseCatalogueEntity[] {
  const endpointDefinition = {
    type: CF_ENDPOINT_TYPE,
    label: 'Cloud Foundry',
    labelPlural: 'Cloud Foundry',
    icon: 'cloud_foundry',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
    authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.SSO],
    listDetailsComponent: CfEndpointDetailsComponent,
  } as IStratosEndpointDefinition;
  return [
    generateCfEndpointEntity(endpointDefinition),
    generateCfApplicationEntity(endpointDefinition),
    generateCfSpaceEntity(endpointDefinition),
    generateCfOrgEntity(endpointDefinition),
    generateFeatureFlagEntity(endpointDefinition),
    generateStackEntity(endpointDefinition),
    generateRouteEntity(endpointDefinition),
    generateEventEntity(endpointDefinition),
    generateGitBranchEntity(endpointDefinition),
    generateGitRepoEntity(endpointDefinition),
    generateGitCommitEntity(endpointDefinition),
    generateCFDomainEntity(endpointDefinition),
    generateCFUserEntity(endpointDefinition),
    generateCFServiceInstanceEntity(endpointDefinition),
    generateCFServicePlanEntity(endpointDefinition),
    generateCFServiceEntity(endpointDefinition),
    generateCFServiceBindingEntity(endpointDefinition),
    generateCFSecurityGroupEntity(endpointDefinition),
    generateCFServicePlanVisibilityEntity(endpointDefinition),
    generateCFServiceBrokerEntity(endpointDefinition),
    generateCFBuildPackEntity(endpointDefinition),
    generateCFAppStatsEntity(endpointDefinition),
    generateCFUserProvidedServiceInstanceEntity(endpointDefinition),
    generateCFInfoEntity(endpointDefinition),
    generateCFPrivateDomainEntity(endpointDefinition),
    generateCFSpaceQuotaEntity(endpointDefinition),
    generateCFAppSummaryEntity(endpointDefinition),
    generateCFAppEnvVarEntity(endpointDefinition),
    generateCFQuotaDefinitionEntity(endpointDefinition),
  ];
}

function generateCFQuotaDefinitionEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: quotaDefinitionEntityType,
    schema: cfEntityFactory(quotaDefinitionEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFAppEnvVarEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appEnvVarsEntityType,
    schema: cfEntityFactory(appEnvVarsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFAppSummaryEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appSummaryEntityType,
    schema: cfEntityFactory(appSummaryEntityType),
    endpoint: endpointDefinition,
    reducers: { [getCFEntityKey(appSummaryEntityType)]: [updateAppSummaryRoutesReducer] }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFSpaceQuotaEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: spaceQuotaEntityType,
    schema: cfEntityFactory(spaceQuotaEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFPrivateDomainEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: privateDomainsEntityType,
    schema: cfEntityFactory(privateDomainsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFInfoEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: cfInfoEntityType,
    schema: cfEntityFactory(cfInfoEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFUserProvidedServiceInstanceEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: userProvidedServiceInstanceEntityType,
    schema: cfEntityFactory(userProvidedServiceInstanceEntityType),
    label: 'User Provided Service Instance',
    labelPlural: 'User Provided Service Instances',
    endpoint: endpointDefinition,
    reducers: { [getCFEntityKey(userProvidedServiceInstanceEntityType)]: [serviceInstanceReducer] }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IUserProvidedServiceInstance>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.name
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFAppStatsEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appStatsEntityType,
    schema: cfEntityFactory(appStatsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppStats>>(definition);
}

function generateCFBuildPackEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: buildpackEntityType,
    schema: cfEntityFactory(buildpackEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IBuildpack>>(definition);
}
function generateCFServiceBrokerEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceBrokerEntityType,
    schema: cfEntityFactory(serviceBrokerEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IServiceBroker>>(definition);
}

function generateCFServicePlanVisibilityEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: servicePlanVisibilityEntityType,
    schema: cfEntityFactory(servicePlanVisibilityEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition);
}

function generateCFSecurityGroupEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: securityGroupEntityType,
    schema: cfEntityFactory(securityGroupEntityType),
    label: 'Security Group',
    labelPlural: 'Security Groups',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition);
}

function generateCFServiceBindingEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceBindingEntityType,
    schema: {
      default: cfEntityFactory(serviceBindingEntityType),
      [serviceBindingNoBindingsEntityType]: cfEntityFactory(serviceBindingNoBindingsEntityType)
    },
    label: 'Service Binding',
    labelPlural: 'Service Bindings',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IServiceBinding>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.guid
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFServiceEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceEntityType,
    schema: cfEntityFactory(serviceEntityType),
    label: 'Service',
    labelPlural: 'Services',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IService>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.label
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFServicePlanEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: servicePlanEntityType,
    schema: cfEntityFactory(servicePlanEntityType),
    label: 'Service Plan',
    labelPlural: 'Service Plans',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IServicePlan>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.name
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFServiceInstanceEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceInstancesEntityType,
    schema: {
      default: cfEntityFactory(serviceInstancesEntityType),
      [serviceInstancesWithspaceEntityType]: cfEntityFactory(serviceInstancesWithspaceEntityType),
      [serviceInstancesWithNoBindingsEntityType]: cfEntityFactory(serviceInstancesWithNoBindingsEntityType),
    },
    label: 'Marketplace Service Instance',
    labelPlural: 'Marketplace Service Instances',
    endpoint: endpointDefinition,
    reducers: { [getCFEntityKey(serviceInstancesEntityType)]: [serviceInstanceReducer] }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IServiceInstance>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.name
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFUserEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: cfUserEntityType,
    schema: cfEntityFactory(cfUserEntityType),
    label: 'User',
    labelPlural: 'Users',
    endpoint: endpointDefinition,
    reducers: { [getCFEntityKey(cfUserEntityType)]: [userReducer, endpointDisconnectUserReducer] }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<CfUser>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.username || ent.entity.guid
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateCFDomainEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: domainEntityType,
    schema: cfEntityFactory(domainEntityType),
    label: 'Domain',
    labelPlural: 'Domains',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IDomain>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.name
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateGitCommitEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: gitCommitEntityType,
    schema: cfEntityFactory(gitCommitEntityType),
    label: 'Git Commit',
    labelPlural: 'Git Commits',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<GitCommit>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.commit ? ent.entity.commit.message || ent.entity.sha : ent.entity.sha
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}

function generateGitRepoEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: gitRepoEntityType,
    schema: cfEntityFactory(gitRepoEntityType),
    label: 'Git Repository',
    labelPlural: 'Git Repositories',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<GitRepo>>(
    definition,
    {
      getMetadata: ent => ({
        name: ent.entity.full_name
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateGitBranchEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: gitBranchesEntityType,
    schema: cfEntityFactory(gitBranchesEntityType),
    label: 'Git Branch',
    labelPlural: 'Git Branches',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IBasicCFMetaData, APIResource<GitBranch>>(
    definition,
    {
      getMetadata: ent => ({
        guid: ent.metadata.guid,
        name: ent.metadata.guid,
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateEventEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appEventEntityType,
    schema: cfEntityFactory(appEventEntityType),
    label: 'Application Event',
    labelPlural: 'Application Events',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IBasicCFMetaData, APIResource>(
    definition,
    {
      getMetadata: app => ({
        guid: app.metadata.guid,
        name: app.metadata.guid,
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateRouteEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: routeEntityType,
    schema: cfEntityFactory(routeEntityType),
    label: 'Route',
    labelPlural: 'Routes',
    endpoint: endpointDefinition,
    reducers: { [getCFEntityKey(routeEntityType)]: [routeReducer] }
  };
  return new StratosCatalogueEntity<IBasicCFMetaData, APIResource<IRoute>>(
    definition,
    {
      getMetadata: app => ({
        guid: app.metadata.guid,
        name: app.entity.domain_url,
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateStackEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: stackEntityType,
    schema: cfEntityFactory(stackEntityType),
    label: 'Stack',
    labelPlural: 'Stacks',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IBasicCFMetaData, APIResource<IStack>>(
    definition,
    {
      getMetadata: app => ({
        guid: app.metadata.guid,
        name: app.entity.name,
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateFeatureFlagEntity(endpointDefinition: IStratosEndpointDefinition) {
  const featureFlagDefinition = {
    type: featureFlagEntityType,
    schema: cfEntityFactory(featureFlagEntityType),
    label: 'Feature Flag',
    labelPlural: 'Feature Flags',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IBasicCFMetaData, APIResource<IFeatureFlag>>(
    featureFlagDefinition,
    {
      getMetadata: app => ({
        guid: app.metadata.guid,
        name: app.entity.name,
      }),
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateCfEndpointEntity(endpointDefinition: IStratosEndpointDefinition) {
  return new StratosCatalogueEndpointEntity(
    endpointDefinition,
    metadata => `/cloud-foundry/${metadata.guid}`,
  );
}
function generateCfApplicationEntity(endpointDefinition: IStratosEndpointDefinition) {
  const applicationDefinition = {
    type: applicationEntityType,
    schema: cfEntityFactory(applicationEntityType),
    label: 'Application',
    labelPlural: 'Applications',
    endpoint: endpointDefinition,
    reducers: {
      [getCFEntityKey(applicationEntityType)]: [
        updateApplicationRoutesReducer(),
        endpointDisconnectApplicationReducer()
      ]
    }
  };
  return new StratosCatalogueEntity<IAppFavMetadata, APIResource<IApp>>(
    applicationDefinition,
    {
      getMetadata: app => ({
        guid: app.metadata.guid,
        cfGuid: app.entity.cfGuid,
        name: app.entity.name,
      }),
      getLink: metadata => `/applications/${metadata.cfGuid}/${metadata.guid}/summary`,
      getGuid: metadata => metadata.guid,
    }
  );
}
function generateCfSpaceEntity(endpointDefinition: IStratosEndpointDefinition) {
  const spaceDefinition = {
    type: spaceEntityType,
    schema: {
      default: cfEntityFactory(spaceEntityType),
      [spaceWithOrgEntityType]: cfEntityFactory(spaceWithOrgEntityType)
    },
    label: 'Space',
    labelPlural: 'Spaces',
    endpoint: endpointDefinition,
    reducers: {
      [getCFEntityKey(spaceEntityType)]: [
        updateSpaceQuotaReducer,
        endpointDisconnectApplicationReducer(),
        applicationAddRemoveReducer(),
        userSpaceOrgReducer(true)
      ]
    }
  };
  return new StratosCatalogueEntity<ISpaceFavMetadata, APIResource<ISpace>>(
    spaceDefinition,
    {
      getMetadata: space => ({
        guid: space.metadata.guid,
        orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
        name: space.entity.name,
        cfGuid: space.entity.cfGuid,
      }),
      getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.orgGuid}/spaces/${metadata.guid}/summary`,
      getGuid: metadata => metadata.guid
    }
  );
}
function generateCfOrgEntity(endpointDefinition: IStratosEndpointDefinition) {
  const orgDefinition = {
    type: organizationEntityType,
    schema: cfEntityFactory(organizationEntityType),
    label: 'Organization',
    labelPlural: 'Organizations',
    endpoint: endpointDefinition,
    reducers: {
      [getCFEntityKey(organizationEntityType)]: [
        updateOrganizationQuotaReducer,
        updateOrganizationSpaceReducer(),
        endpointDisconnectApplicationReducer(),
        userSpaceOrgReducer(false)
      ]
    }
  };
  return new StratosCatalogueEntity<IOrgFavMetadata, APIResource<IOrganization>>(
    orgDefinition,
    {
      getMetadata: org => ({
        guid: org.metadata.guid,
        status: getOrgStatus(org),
        name: org.entity.name,
        cfGuid: org.entity.cfGuid,
      }),
      getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.guid}`,
      getGuid: metadata => metadata.guid
    }
  );
}
function getOrgStatus(org: APIResource<IOrganization>) {
  if (!org || !org.entity || !org.entity.status) {
    return 'Unknown';
  }
  return org.entity.status.charAt(0).toUpperCase() + org.entity.status.slice(1);
}
