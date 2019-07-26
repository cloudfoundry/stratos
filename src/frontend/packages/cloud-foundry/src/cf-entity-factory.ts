import { Schema, schema } from 'normalizr';

import { EntitySchema } from '../../store/src/helpers/entity-schema';
import { APIResource } from '../../store/src/types/api.types';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from './store/types/user.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { getAPIResourceGuid } from './store/selectors/api.selectors';

export const applicationEntityType = 'application';
export const stackEntityType = 'stack';
export const spaceEntityType = 'space';
export const routeEntityType = 'route';
export const domainEntityType = 'domain';
export const organizationEntityType = 'organization';
export const quotaDefinitionEntityType = 'quota_definition';
export const appEventEntityType = 'applicationEvent';
export const cfInfoEntityType = 'cloudFoundryInfo';
export const cfUserEntityType = 'user';
export const appSummaryEntityType = 'applicationSummary';
export const appStatsEntityType = 'applicationStats';
export const appEnvVarsEntityType = 'environmentVars';
export const gitBranchesEntityType = 'gitBranches';
export const gitRepoEntityType = 'gitRepo';
export const gitCommitEntityType = 'gitCommits';
export const serviceEntityType = 'service';
export const serviceBindingEntityType = 'serviceBinding';
export const servicePlanEntityType = 'servicePlan';
export const serviceInstancesEntityType = 'serviceInstance';
export const buildpackEntityType = 'buildpack';
export const securityGroupEntityType = 'securityGroup';
export const featureFlagEntityType = 'featureFlag';
export const privateDomainsEntityType = 'private_domains';
export const spaceQuotaEntityType = 'space_quota_definition';
export const metricEntityType = 'metrics';
export const servicePlanVisibilityEntityType = 'servicePlanVisibility';
export const serviceBrokerEntityType = 'serviceBroker';
export const userProvidedServiceInstanceEntityType = 'userProvidedServiceInstance';

export const spaceWithOrgEntityType = 'spaceWithOrg';
export const serviceInstancesWithSpaceEntityType = 'serviceInstancesWithSpace';
export const serviceInstancesWithNoBindingsEntityType = 'serviceInstanceWithNoBindings';
export const serviceBindingNoBindingsEntityType = 'serviceBindingNoBindings';


const entityCache: {
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

const AppSummarySchema = new CFEntitySchema(appSummaryEntityType, {}, { idAttribute: 'guid' });
entityCache[appSummaryEntityType] = AppSummarySchema;

const AppStatSchema = new CFEntitySchema(appStatsEntityType, {}, { idAttribute: 'guid' });
entityCache[appStatsEntityType] = AppStatSchema;

const AppEnvVarSchema = new CFEntitySchema(appEnvVarsEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEnvVarsEntityType] = AppEnvVarSchema;

const GithubBranchSchema = new CFEntitySchema(gitBranchesEntityType, {}, { idAttribute: 'entityId' });
entityCache[gitBranchesEntityType] = GithubBranchSchema;

const GithubRepoSchema = new CFEntitySchema(gitRepoEntityType);
entityCache[gitRepoEntityType] = GithubRepoSchema;

const GithubCommitSchema = new CFEntitySchema(gitCommitEntityType, {}, { idAttribute: commit => commit.sha });
entityCache[gitCommitEntityType] = GithubCommitSchema;

const CFInfoSchema = new CFEntitySchema(cfInfoEntityType);
entityCache[cfInfoEntityType] = CFInfoSchema;

const EventSchema = new CFEntitySchema(appEventEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEventEntityType] = EventSchema;

const StackSchema = new CFEntitySchema(stackEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackEntityType] = StackSchema;

const DomainSchema = new CFEntitySchema(domainEntityType, {}, {
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
entityCache[domainEntityType] = DomainSchema;

const ServiceSchema = new CFEntitySchema(serviceEntityType, {
  entity: {
    service_plans: [new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid })]
  }
}, { idAttribute: getAPIResourceGuid });
const ServiceNoPlansSchema = new CFEntitySchema(serviceEntityType, {
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceEntityType] = ServiceSchema;

const MetricSchema = new CFEntitySchema(metricEntityType);
entityCache[metricEntityType] = MetricSchema;

const SpaceQuotaSchema = new CFEntitySchema(spaceQuotaEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[spaceQuotaEntityType] = SpaceQuotaSchema;

const ServicePlanSchema = new CFEntitySchema(servicePlanEntityType, {
  entity: {
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanEntityType] = ServicePlanSchema;

const ServiceBindingsSchema = new CFEntitySchema(serviceBindingEntityType, {
  entity: {
    app: new CFEntitySchema(applicationEntityType, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new CFEntitySchema(serviceInstancesEntityType, {
      entity: {
        service_bindings: [new CFEntitySchema(serviceBindingEntityType, {
          app: new CFEntitySchema(applicationEntityType, {}, { idAttribute: getAPIResourceGuid }),
        }, { idAttribute: getAPIResourceGuid })],
        service: new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingEntityType] = ServiceBindingsSchema;

const ServiceBindingsNoBindingsSchema = new CFEntitySchema(serviceBindingEntityType, {
  entity: {
    app: new CFEntitySchema(applicationEntityType, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new CFEntitySchema(serviceInstancesEntityType, {
      entity: {
        service: new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingNoBindingsEntityType] = ServiceBindingsNoBindingsSchema;

const ServiceInstancesSchema = new CFEntitySchema(serviceInstancesEntityType, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesEntityType] = ServiceInstancesSchema;

const BuildpackSchema = new CFEntitySchema(buildpackEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[buildpackEntityType] = BuildpackSchema;

const RouteSchema = new CFEntitySchema(routeEntityType, {
  entity: {
    domain: DomainSchema,
    apps: [new CFEntitySchema(applicationEntityType, {}, { idAttribute: getAPIResourceGuid })],
    space: new CFEntitySchema(spaceEntityType, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[routeEntityType] = RouteSchema;

const RouteNoAppsSchema = new CFEntitySchema(routeEntityType, {
  entity: {
    domain: DomainSchema,
  }
}, { idAttribute: getAPIResourceGuid });

const QuotaDefinitionSchema = new CFEntitySchema(quotaDefinitionEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionEntityType] = QuotaDefinitionSchema;

const ApplicationWithoutSpaceEntitySchema = new CFEntitySchema(
  applicationEntityType,
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
    new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.DEVELOPER)
  ],
  [SpaceUserRoleNames.MANAGER]: [new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.MANAGER)],
  [SpaceUserRoleNames.AUDITOR]: [new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.AUDITOR)]
};
const SpaceSchema = new CFEntitySchema(spaceEntityType, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[spaceEntityType] = SpaceSchema;

const PrivateDomainsSchema = new CFEntitySchema(privateDomainsEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[privateDomainsEntityType] = PrivateDomainsSchema;

const coreOrgSchemaParams = {
  domains: [DomainSchema],
  quota_definition: QuotaDefinitionSchema,
  private_domains: [PrivateDomainsSchema]
};
const OrganizationsWithoutSpaces = new CFEntitySchema(organizationEntityType, {
  entity: {
    ...coreOrgSchemaParams,
  }
}, { idAttribute: getAPIResourceGuid });

const OrganizationSchema = new CFEntitySchema(organizationEntityType, {
  entity: {
    ...coreOrgSchemaParams,
    spaces: [SpaceSchema],
    [OrgUserRoleNames.USER]: [new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.USER)],
    [OrgUserRoleNames.MANAGER]: [new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.MANAGER)],
    [OrgUserRoleNames.BILLING_MANAGERS]: [
      new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.BILLING_MANAGERS)
    ],
    [OrgUserRoleNames.AUDITOR]: [new CFEntitySchema(cfUserEntityType, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.AUDITOR)]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[organizationEntityType] = OrganizationSchema;

const SpaceWithOrgsEntitySchema = new CFEntitySchema(spaceEntityType, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema],
    organization: OrganizationsWithoutSpaces,
  }
}, { idAttribute: getAPIResourceGuid }, spaceWithOrgEntityType);
entityCache[spaceWithOrgEntityType] = SpaceWithOrgsEntitySchema;


const ServiceInstancesWithSpaceSchema = new CFEntitySchema(serviceInstancesEntityType, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    space: SpaceSchema.withEmptyDefinition(),
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithSpaceEntityType] = ServiceInstancesWithSpaceSchema;

const ServiceInstancesWithNoBindingsSchema = new CFEntitySchema(serviceInstancesEntityType, {
  entity: {
    service_plan: [new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid })],
    service: [new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid })],
    space: SpaceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithNoBindingsEntityType] = ServiceInstancesWithNoBindingsSchema;

const ServicePlanVisibilitySchema = new CFEntitySchema(servicePlanVisibilityEntityType, {
  entity: {
    organization: OrganizationSchema,
    service_plan: new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanVisibilityEntityType] = ServicePlanVisibilitySchema;

const ApplicationEntitySchema = new CFEntitySchema(
  applicationEntityType,
  {
    entity: {
      stack: StackSchema,
      space: new CFEntitySchema(spaceEntityType, {
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
entityCache[applicationEntityType] = ApplicationEntitySchema;

const SecurityGroupSchema = new CFEntitySchema(securityGroupEntityType, {
  entity: {
    spaces: [SpaceSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[securityGroupEntityType] = SecurityGroupSchema;

const FeatureFlagSchema = new CFEntitySchema(featureFlagEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[featureFlagEntityType] = FeatureFlagSchema;

const SpaceEmptySchema = SpaceSchema.withEmptyDefinition();
const orgUserEntity = {
  entity: {
    spaces: [SpaceEmptySchema]
  }
};

const ServiceBrokerSchema = new CFEntitySchema(serviceBrokerEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBrokerEntityType] = ServiceBrokerSchema;

function createUserOrgSpaceSchema(schemaKey, entity, relationKey): EntitySchema {
  return new CFEntitySchema(schemaKey, entity, { idAttribute: getAPIResourceGuid }, relationKey);
}

const CFUserSchema = new CFEntitySchema(cfUserEntityType, {
  entity: {
    organizations: [createUserOrgSpaceSchema(organizationEntityType, orgUserEntity, CfUserRoleParams.ORGANIZATIONS)],
    audited_organizations: [createUserOrgSpaceSchema(organizationEntityType, orgUserEntity, CfUserRoleParams.AUDITED_ORGS)],
    managed_organizations: [createUserOrgSpaceSchema(organizationEntityType, orgUserEntity, CfUserRoleParams.MANAGED_ORGS)],
    billing_managed_organizations: [createUserOrgSpaceSchema(organizationEntityType, orgUserEntity, CfUserRoleParams.BILLING_MANAGER_ORGS)],
    spaces: [createUserOrgSpaceSchema(spaceEntityType, {}, CfUserRoleParams.SPACES)],
    managed_spaces: [createUserOrgSpaceSchema(spaceEntityType, {}, CfUserRoleParams.MANAGED_SPACES)],
    audited_spaces: [createUserOrgSpaceSchema(spaceEntityType, {}, CfUserRoleParams.AUDITED_SPACES)],
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
entityCache[cfUserEntityType] = CFUserSchema;


const UserProvidedServiceInstanceSchema = new CFEntitySchema(userProvidedServiceInstanceEntityType, {
  entity: {
    space: SpaceWithOrgsEntitySchema,
    service_bindings: [ServiceBindingsSchema],
    routes: [RouteSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[userProvidedServiceInstanceEntityType] = UserProvidedServiceInstanceSchema;


export function cfEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
