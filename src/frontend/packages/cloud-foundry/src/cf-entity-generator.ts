import {
  IStratosEndpointDefinition,
} from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import {
  applicationSchemaKey,
  entityFactory,
  spaceSchemaKey,
  organizationSchemaKey,
  featureFlagSchemaKey,
  stackSchemaKey,
  routeSchemaKey,
  appEventSchemaKey,
  gitBranchesSchemaKey,
  gitRepoSchemaKey,
  gitCommitSchemaKey,
  domainSchemaKey,
  cfUserSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceBindingSchemaKey,
  securityGroupSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceBrokerSchemaKey,
  buildpackSchemaKey,
  appStatsSchemaKey,
  userProvidedServiceInstanceSchemaKey,
  cfInfoSchemaKey,
  privateDomainsSchemaKey,
  spaceQuotaSchemaKey,
  serviceSchemaKey,
  serviceBindingNoBindingsSchemaKey,
  spaceWithOrgKey,
  serviceInstancesWithSpaceSchemaKey,
  serviceInstancesWithNoBindingsSchemaKey,
  appSummarySchemaKey,
  appEnvVarsSchemaKey,
  quotaDefinitionSchemaKey
} from '../../store/src/helpers/entity-factory';
import { APIResource } from '../../store/src/types/api.types';
import {
  IApp,
  ISpace,
  IOrganization,
  IFeatureFlag,
  IStack,
  IRoute,
  IDomain,
  ISecurityGroup,
  IBuildpack
} from '../../core/src/core/cf-api.types';
import { BaseEndpointAuth } from '../../core/src/features/endpoints/endpoint-auth';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { IBasicCFMetaData, IAppFavMetadata, ISpaceFavMetadata, IOrgFavMetadata } from './cf-metadata-types';
import { GitBranch, GitRepo, GitCommit } from '../../store/src/types/git.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
import { CfUser } from '../../store/src/types/user.types';
import {
  IServiceInstance,
  IServicePlan,
  IService,
  IServiceBinding,
  IServiceBroker,
  IUserProvidedServiceInstance,
} from '../../core/src/core/cf-api-svc.types';
import { AppStats } from '../../store/src/types/app-metadata.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import {
  StratosCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosBaseCatalogueEntity
} from '../../core/src/core/entity-catalogue/entity-catalogue-entity';

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
    type: quotaDefinitionSchemaKey,
    schema: entityFactory(quotaDefinitionSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFAppEnvVarEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appEnvVarsSchemaKey,
    schema: entityFactory(appEnvVarsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFAppSummaryEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: appSummarySchemaKey,
    schema: entityFactory(appSummarySchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFSpaceQuotaEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: spaceQuotaSchemaKey,
    schema: entityFactory(spaceQuotaSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFPrivateDomainEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: privateDomainsSchemaKey,
    schema: entityFactory(privateDomainsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFInfoEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: cfInfoSchemaKey,
    schema: entityFactory(cfInfoSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource>(definition);
}

function generateCFUserProvidedServiceInstanceEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: userProvidedServiceInstanceSchemaKey,
    schema: entityFactory(userProvidedServiceInstanceSchemaKey),
    label: 'User Provided Service Instance',
    labelPlural: 'User Provided Service Instances',
    endpoint: endpointDefinition
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
    type: appStatsSchemaKey,
    schema: entityFactory(appStatsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<AppStats>>(definition);
}

function generateCFBuildPackEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: buildpackSchemaKey,
    schema: entityFactory(buildpackSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IBuildpack>>(definition);
}
function generateCFServiceBrokerEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceBrokerSchemaKey,
    schema: entityFactory(serviceBrokerSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<IServiceBroker>>(definition);
}

function generateCFServicePlanVisibilityEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: servicePlanVisibilitySchemaKey,
    schema: entityFactory(servicePlanVisibilitySchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition);
}

function generateCFSecurityGroupEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: securityGroupSchemaKey,
    schema: entityFactory(securityGroupSchemaKey),
    label: 'Security Group',
    labelPlural: 'Security Groups',
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition);
}

function generateCFServiceBindingEntity(endpointDefinition: IStratosEndpointDefinition) {
  const definition = {
    type: serviceBindingSchemaKey,
    schema: {
      default: entityFactory(serviceBindingSchemaKey),
      [serviceBindingNoBindingsSchemaKey]: entityFactory(serviceBindingNoBindingsSchemaKey)
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
    type: serviceSchemaKey,
    schema: entityFactory(serviceSchemaKey),
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
    type: servicePlanSchemaKey,
    schema: entityFactory(servicePlanSchemaKey),
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
    type: serviceInstancesSchemaKey,
    schema: {
      default: entityFactory(serviceInstancesSchemaKey),
      [serviceInstancesWithSpaceSchemaKey]: entityFactory(serviceInstancesWithSpaceSchemaKey),
      [serviceInstancesWithNoBindingsSchemaKey]: entityFactory(serviceInstancesWithNoBindingsSchemaKey),
    },
    label: 'Marketplace Service Instance',
    labelPlural: 'Marketplace Service Instances',
    endpoint: endpointDefinition
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
    type: cfUserSchemaKey,
    schema: entityFactory(cfUserSchemaKey),
    label: 'User',
    labelPlural: 'Users',
    endpoint: endpointDefinition
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
    type: domainSchemaKey,
    schema: entityFactory(domainSchemaKey),
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
    type: gitCommitSchemaKey,
    schema: entityFactory(gitCommitSchemaKey),
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
    type: gitRepoSchemaKey,
    schema: entityFactory(gitRepoSchemaKey),
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
    type: gitBranchesSchemaKey,
    schema: entityFactory(gitBranchesSchemaKey),
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
    type: appEventSchemaKey,
    schema: entityFactory(appEventSchemaKey),
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
    type: routeSchemaKey,
    schema: entityFactory(routeSchemaKey),
    label: 'Route',
    labelPlural: 'Routes',
    endpoint: endpointDefinition
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
    type: stackSchemaKey,
    schema: entityFactory(stackSchemaKey),
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
    type: featureFlagSchemaKey,
    schema: entityFactory(featureFlagSchemaKey),
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
    type: applicationSchemaKey,
    schema: entityFactory(applicationSchemaKey),
    label: 'Application',
    labelPlural: 'Applications',
    endpoint: endpointDefinition
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
    type: spaceSchemaKey,
    schema: {
      default: entityFactory(spaceSchemaKey),
      [spaceWithOrgKey]: entityFactory(spaceWithOrgKey)
    },
    label: 'Space',
    labelPlural: 'Spaces',
    endpoint: endpointDefinition
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
    type: organizationSchemaKey,
    schema: entityFactory(organizationSchemaKey),
    label: 'Organization',
    labelPlural: 'Organizations',
    endpoint: endpointDefinition
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
