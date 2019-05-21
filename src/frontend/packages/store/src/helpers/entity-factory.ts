import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource } from '../types/api.types';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../types/user.types';
import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';
import { EntitySchema } from './entity-schema';
export const applicationSchemaKey = 'application';
export const stackSchemaKey = 'stack';
export const spaceSchemaKey = 'space';
export const routeSchemaKey = 'route';
export const domainSchemaKey = 'domain';
export const organizationSchemaKey = 'organization';
export const quotaDefinitionSchemaKey = 'quota_definition';
export const appEventSchemaKey = 'event';
export const cfInfoSchemaKey = 'cloudFoundryInfo';
export const endpointSchemaKey = 'endpoint';
export const cfUserSchemaKey = 'user';
export const appSummarySchemaKey = 'summary';
export const appStatsSchemaKey = 'stats';
export const appEnvVarsSchemaKey = 'environmentVars';
export const gitBranchesSchemaKey = 'gitBranches';
export const gitRepoSchemaKey = 'gitRepo';
export const gitCommitSchemaKey = 'gitCommits';
export const serviceSchemaKey = 'service';
export const serviceBindingSchemaKey = 'serviceBinding';
export const servicePlanSchemaKey = 'servicePlan';
export const serviceInstancesSchemaKey = 'serviceInstance';
export const buildpackSchemaKey = 'buildpack';
export const securityGroupSchemaKey = 'securityGroup';
export const featureFlagSchemaKey = 'featureFlag';
export const privateDomainsSchemaKey = 'private_domains';
export const spaceQuotaSchemaKey = 'space_quota_definition';
export const metricSchemaKey = 'metrics';
export const userProfileSchemaKey = 'userProfile';
export const servicePlanVisibilitySchemaKey = 'servicePlanVisibility';
export const serviceBrokerSchemaKey = 'serviceBroker';
export const userProvidedServiceInstanceSchemaKey = 'userProvidedServiceInstance';

export const spaceWithOrgKey = 'spaceWithOrg';
export const serviceInstancesWithSpaceSchemaKey = 'serviceInstancesWithSpace';
export const serviceInstancesWithNoBindingsSchemaKey = 'serviceInstanceWithNoBindings';
export const serviceBindingNoBindingsSchemaKey = 'serviceBindingNoBindings';


// TODO This need to be split into two files, one with the CF types and another with the base stratos types.

export const entityCache: {
  [key: string]: EntitySchema
} = {};



export class CFEntitySchema extends EntitySchema {
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    entityKey: string,
    definition?: Schema,
    options?: schema.EntityOptions,
    relationKey?: string
  ) {
    super(entityKey, CF_ENDPOINT_TYPE, definition, options, relationKey);
  }
}

// Note - The cache entry is added as a secondary step. This helps keep the child entity definition's clear and easier to spot circular
// dependencies which would otherwise be hidden (if we assigned directly to entityCache and references via entityCache in other entities)

const AppSummarySchema = new CFEntitySchema(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appSummarySchemaKey] = AppSummarySchema;

const AppStatSchema = new CFEntitySchema(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appStatsSchemaKey] = AppStatSchema;

const AppEnvVarSchema = new CFEntitySchema(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEnvVarsSchemaKey] = AppEnvVarSchema;

const GithubBranchSchema = new CFEntitySchema(gitBranchesSchemaKey, {}, { idAttribute: 'entityId' });
entityCache[gitBranchesSchemaKey] = GithubBranchSchema;

const GithubRepoSchema = new CFEntitySchema(gitRepoSchemaKey);
entityCache[gitRepoSchemaKey] = GithubRepoSchema;

const GithubCommitSchema = new CFEntitySchema(gitCommitSchemaKey, {}, { idAttribute: commit => commit.sha });
entityCache[gitCommitSchemaKey] = GithubCommitSchema;

const CFInfoSchema = new CFEntitySchema(cfInfoSchemaKey);
entityCache[cfInfoSchemaKey] = CFInfoSchema;

const EventSchema = new CFEntitySchema(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEventSchemaKey] = EventSchema;

const StackSchema = new CFEntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackSchemaKey] = StackSchema;

const DomainSchema = new CFEntitySchema(domainSchemaKey, {}, {
  idAttribute: getAPIResourceGuid,
  // Work around for an issue where router_group_type can come back null from one API call but
  // for shared_domains call it is correctly populated - the null values can overwrite the
  // correct values - so remove them to avoid this
  processStrategy: (value) => {
    const newValue = {
      entity: { ...value.entity },
      metadata: { ...value.metadata }
    };
    if (newValue.entity.router_group_type === null) {
      delete newValue.entity.router_group_type;
    }
    return newValue;
  }
});
entityCache[domainSchemaKey] = DomainSchema;

const ServiceSchema = new CFEntitySchema(serviceSchemaKey, {
  entity: {
    service_plans: [new CFEntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid })]
  }
}, { idAttribute: getAPIResourceGuid });
const ServiceNoPlansSchema = new CFEntitySchema(serviceSchemaKey, {
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceSchemaKey] = ServiceSchema;

const MetricSchema = new CFEntitySchema(metricSchemaKey);
entityCache[metricSchemaKey] = MetricSchema;

const SpaceQuotaSchema = new CFEntitySchema(spaceQuotaSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[spaceQuotaSchemaKey] = SpaceQuotaSchema;

const ServicePlanSchema = new CFEntitySchema(servicePlanSchemaKey, {
  entity: {
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanSchemaKey] = ServicePlanSchema;

const ServiceBindingsSchema = new CFEntitySchema(serviceBindingSchemaKey, {
  entity: {
    app: new CFEntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new CFEntitySchema(serviceInstancesSchemaKey, {
      entity: {
        service_bindings: [new CFEntitySchema(serviceBindingSchemaKey, {
          app: new CFEntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        }, { idAttribute: getAPIResourceGuid })],
        service: new CFEntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new CFEntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingSchemaKey] = ServiceBindingsSchema;

const ServiceBindingsNoBindingsSchema = new CFEntitySchema(serviceBindingSchemaKey, {
  entity: {
    app: new CFEntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new CFEntitySchema(serviceInstancesSchemaKey, {
      entity: {
        service: new CFEntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new CFEntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingNoBindingsSchemaKey] = ServiceBindingsNoBindingsSchema;

const ServiceInstancesSchema = new CFEntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesSchemaKey] = ServiceInstancesSchema;

const BuildpackSchema = new CFEntitySchema(buildpackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[buildpackSchemaKey] = BuildpackSchema;

const RouteSchema = new CFEntitySchema(routeSchemaKey, {
  entity: {
    domain: DomainSchema,
    apps: [new CFEntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    space: new CFEntitySchema(spaceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[routeSchemaKey] = RouteSchema;

const RouteNoAppsSchema = new CFEntitySchema(routeSchemaKey, {
  entity: {
    domain: DomainSchema,
  }
}, { idAttribute: getAPIResourceGuid });
// TODO(NJ): Are we intentionally overriding the schema?
entityCache[routeSchemaKey] = RouteSchema;


const QuotaDefinitionSchema = new CFEntitySchema(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionSchemaKey] = QuotaDefinitionSchema;

const ApplicationWithoutSpaceEntitySchema = new CFEntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      routes: [RouteNoAppsSchema],
      service_bindings: [ServiceBindingsSchema]
    }
  }, { idAttribute: getAPIResourceGuid },
);

const coreSpaceSchemaParams = {
  routes: [RouteSchema],
  domains: [DomainSchema],
  space_quota_definition: SpaceQuotaSchema,
  service_instances: [ServiceInstancesSchema],
  [SpaceUserRoleNames.DEVELOPER]: [
    new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.DEVELOPER)
  ],
  [SpaceUserRoleNames.MANAGER]: [new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.MANAGER)],
  [SpaceUserRoleNames.AUDITOR]: [new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.AUDITOR)]
};
const SpaceSchema = new CFEntitySchema(spaceSchemaKey, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[spaceSchemaKey] = SpaceSchema;

const PrivateDomainsSchema = new CFEntitySchema(privateDomainsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[privateDomainsSchemaKey] = PrivateDomainsSchema;

const coreOrgSchemaParams = {
  domains: [DomainSchema],
  quota_definition: QuotaDefinitionSchema,
  private_domains: [PrivateDomainsSchema]
};
const OrganizationsWithoutSpaces = new CFEntitySchema(organizationSchemaKey, {
  entity: {
    ...coreOrgSchemaParams,
  }
}, { idAttribute: getAPIResourceGuid });

const OrganizationSchema = new CFEntitySchema(organizationSchemaKey, {
  entity: {
    ...coreOrgSchemaParams,
    spaces: [SpaceSchema],
    [OrgUserRoleNames.USER]: [new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.USER)],
    [OrgUserRoleNames.MANAGER]: [new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.MANAGER)],
    [OrgUserRoleNames.BILLING_MANAGERS]: [
      new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.BILLING_MANAGERS)
    ],
    [OrgUserRoleNames.AUDITOR]: [new CFEntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.AUDITOR)]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[organizationSchemaKey] = OrganizationSchema;

const SpaceWithOrgsEntitySchema = new CFEntitySchema(spaceSchemaKey, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema],
    organization: OrganizationsWithoutSpaces,
  }
}, { idAttribute: getAPIResourceGuid }, spaceWithOrgKey);
entityCache[spaceWithOrgKey] = SpaceWithOrgsEntitySchema;


const ServiceInstancesWithSpaceSchema = new CFEntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    space: SpaceSchema.withEmptyDefinition(),
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithSpaceSchemaKey] = ServiceInstancesWithSpaceSchema;

const ServiceInstancesWithNoBindingsSchema = new CFEntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: [new CFEntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    service: [new CFEntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    space: SpaceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithNoBindingsSchemaKey] = ServiceInstancesWithNoBindingsSchema;

const ServicePlanVisibilitySchema = new CFEntitySchema(servicePlanVisibilitySchemaKey, {
  entity: {
    organization: OrganizationSchema,
    service_plan: new CFEntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanVisibilitySchemaKey] = ServicePlanVisibilitySchema;

const ApplicationEntitySchema = new CFEntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      space: new CFEntitySchema(spaceSchemaKey, {
        entity: {
          ...coreSpaceSchemaParams,
          routes: [RouteNoAppsSchema],
          service_instances: [ServiceInstancesWithNoBindingsSchema],
          organization: OrganizationsWithoutSpaces,
        }
      }, { idAttribute: getAPIResourceGuid }),
      routes: [RouteNoAppsSchema],
      service_bindings: [ServiceBindingsSchema]
    }
  }, { idAttribute: getAPIResourceGuid });
entityCache[applicationSchemaKey] = ApplicationEntitySchema;

const EndpointSchema = new EntitySchema(endpointSchemaKey, null, {}, { idAttribute: 'guid' });
entityCache[endpointSchemaKey] = EndpointSchema;

const SecurityGroupSchema = new CFEntitySchema(securityGroupSchemaKey, {
  entity: {
    spaces: [SpaceSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[securityGroupSchemaKey] = SecurityGroupSchema;

const FeatureFlagSchema = new CFEntitySchema(featureFlagSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[featureFlagSchemaKey] = FeatureFlagSchema;

const SpaceEmptySchema = SpaceSchema.withEmptyDefinition();
const orgUserEntity = {
  entity: {
    spaces: [SpaceEmptySchema]
  }
};

const ServiceBrokerSchema = new CFEntitySchema(serviceBrokerSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBrokerSchemaKey] = ServiceBrokerSchema;

function createUserOrgSpaceSchema(schemaKey, entity, relationKey): EntitySchema {
  return new CFEntitySchema(schemaKey, entity, { idAttribute: getAPIResourceGuid }, relationKey);
}

const CFUserSchema = new CFEntitySchema(cfUserSchemaKey, {
  entity: {
    organizations: [createUserOrgSpaceSchema(organizationSchemaKey, orgUserEntity, CfUserRoleParams.ORGANIZATIONS)],
    audited_organizations: [createUserOrgSpaceSchema(organizationSchemaKey, orgUserEntity, CfUserRoleParams.AUDITED_ORGS)],
    managed_organizations: [createUserOrgSpaceSchema(organizationSchemaKey, orgUserEntity, CfUserRoleParams.MANAGED_ORGS)],
    billing_managed_organizations: [createUserOrgSpaceSchema(organizationSchemaKey, orgUserEntity, CfUserRoleParams.BILLING_MANAGER_ORGS)],
    spaces: [createUserOrgSpaceSchema(spaceSchemaKey, {}, CfUserRoleParams.SPACES)],
    managed_spaces: [createUserOrgSpaceSchema(spaceSchemaKey, {}, CfUserRoleParams.MANAGED_SPACES)],
    audited_spaces: [createUserOrgSpaceSchema(spaceSchemaKey, {}, CfUserRoleParams.AUDITED_SPACES)],
  }
}, {
    idAttribute: getAPIResourceGuid,
    processStrategy: (user: APIResource<CfUser>) => {
      if (user.entity.username) {
        return user;
      }
      const entity = {
        ...user.entity,
        username: user.metadata.guid
      };

      return user.metadata ? {
        entity,
        metadata: user.metadata
      } : {
          entity
        };
    }
  });
entityCache[cfUserSchemaKey] = CFUserSchema;


const UserProvidedServiceInstanceSchema = new CFEntitySchema(userProvidedServiceInstanceSchemaKey, {
  entity: {
    space: SpaceWithOrgsEntitySchema,
    service_bindings: [ServiceBindingsSchema],
    routes: [RouteSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[userProvidedServiceInstanceSchemaKey] = UserProvidedServiceInstanceSchema;


export function entityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}

export function addEntityToCache(entitySchema: EntitySchema, key?: string) {
  entityCache[key || entitySchema.key] = entitySchema;
}

const UserProfileInfoSchema = new CFEntitySchema(userProfileSchemaKey, {}, { idAttribute: 'id' });
entityCache[userProfileSchemaKey] = UserProfileInfoSchema;
