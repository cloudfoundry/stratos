import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { APIResource } from '../types/api.types';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../types/user.types';

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
export const userFavoritesSchemaKey = 'userFavorites';
export const userProvidedServiceInstanceSchemaKey = 'userProvidedServiceInstance';
export const appAutoscalerHealthSchemaKey = 'autoscalerHealth';
export const appAutoscalerPolicySchemaKey = 'autoscalerPolicy';
export const appAutoscalerUpdatedPolicySchemaKey = 'autoscalerUpdatedPolicy';
export const appAutoscalerScalingHistorySchemaKey = 'autoscalerScalingHistory';
export const appAutoscalerAppMetricSchemaKey = 'autoscalerAppMetric';
export const appAutoscalerInsMetricSchemaKey = 'autoscalerInsMetric';

export const spaceWithOrgKey = 'spaceWithOrg';
export const serviceInstancesWithSpaceSchemaKey = 'serviceInstancesWithSpace';
export const serviceInstancesWithNoBindingsSchemaKey = 'serviceInstanceWithNoBindings';
export const serviceBindingNoBindingsSchemaKey = 'serviceBindingNoBindings';

const entityCache: {
  [key: string]: EntitySchema
} = {};

/**
 * Mostly a wrapper around schema.Entity. Allows a lot of uniformity of types through console. Includes some minor per entity type config
 *
 * @export
 * @extends {schema.Entity}
 */
export class EntitySchema extends schema.Entity {
  schema: Schema;
  public getId: (input, parent?, key?) => string;
  /**
   * @param entityKey As per schema.Entity ctor
   * @param [definition] As per schema.Entity ctor
   * @param [options] As per schema.Entity ctor
   * @param [relationKey] Allows multiple children of the same type within a single parent entity. For instance user with developer
   * spaces, manager spaces, auditor space, etc
   */
  constructor(
    private entityKey: string,
    public definition?: Schema,
    private options?: schema.EntityOptions,
    public relationKey?: string
  ) {
    super(entityKey, definition, options);
    this.schema = definition || {};
  }
  public withEmptyDefinition() {
    return new EntitySchema(
      this.entityKey,
      {},
      this.options,
      this.relationKey
    );
  }
}

// Note - The cache entry is added as a secondary step. This helps keep the child entity definition's clear and easier to spot circular
// dependencies which would otherwise be hidden (if we assigned directly to entityCache and references via entityCache in other entities)

const AppSummarySchema = new EntitySchema(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appSummarySchemaKey] = AppSummarySchema;

const AppStatSchema = new EntitySchema(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appStatsSchemaKey] = AppStatSchema;

const AppEnvVarSchema = new EntitySchema(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEnvVarsSchemaKey] = AppEnvVarSchema;

const GithubBranchSchema = new EntitySchema(gitBranchesSchemaKey, {}, { idAttribute: 'entityId' });
entityCache[gitBranchesSchemaKey] = GithubBranchSchema;

const GithubRepoSchema = new EntitySchema(gitRepoSchemaKey);
entityCache[gitRepoSchemaKey] = GithubRepoSchema;

const GithubCommitSchema = new EntitySchema(gitCommitSchemaKey, {}, { idAttribute: commit => commit.sha });
entityCache[gitCommitSchemaKey] = GithubCommitSchema;

const CFInfoSchema = new EntitySchema(cfInfoSchemaKey);
entityCache[cfInfoSchemaKey] = CFInfoSchema;

const EventSchema = new EntitySchema(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEventSchemaKey] = EventSchema;

const StackSchema = new EntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackSchemaKey] = StackSchema;

const DomainSchema = new EntitySchema(domainSchemaKey, {}, {
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

const ServiceSchema = new EntitySchema(serviceSchemaKey, {
  entity: {
    service_plans: [new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid })]
  }
}, { idAttribute: getAPIResourceGuid });
const ServiceNoPlansSchema = new EntitySchema(serviceSchemaKey, {
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceSchemaKey] = ServiceSchema;

const MetricSchema = new EntitySchema(metricSchemaKey);
entityCache[metricSchemaKey] = MetricSchema;

const SpaceQuotaSchema = new EntitySchema(spaceQuotaSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[spaceQuotaSchemaKey] = SpaceQuotaSchema;

const ServicePlanSchema = new EntitySchema(servicePlanSchemaKey, {
  entity: {
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanSchemaKey] = ServicePlanSchema;

const ServiceBindingsSchema = new EntitySchema(serviceBindingSchemaKey, {
  entity: {
    app: new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new EntitySchema(serviceInstancesSchemaKey, {
      entity: {
        service_bindings: [new EntitySchema(serviceBindingSchemaKey, {
          app: new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        }, { idAttribute: getAPIResourceGuid })],
        service: new EntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingSchemaKey] = ServiceBindingsSchema;

const ServiceBindingsNoBindingsSchema = new EntitySchema(serviceBindingSchemaKey, {
  entity: {
    app: new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
    service_instance: new EntitySchema(serviceInstancesSchemaKey, {
      entity: {
        service: new EntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
      },
    }, { idAttribute: getAPIResourceGuid }),
    service: ServiceNoPlansSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingNoBindingsSchemaKey] = ServiceBindingsNoBindingsSchema;

const ServiceInstancesSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesSchemaKey] = ServiceInstancesSchema;

const BuildpackSchema = new EntitySchema(buildpackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[buildpackSchemaKey] = BuildpackSchema;

const RouteSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    domain: DomainSchema,
    apps: [new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    space: new EntitySchema(spaceSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[routeSchemaKey] = RouteSchema;
const RouteNoAppsSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    domain: DomainSchema,
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[routeSchemaKey] = RouteSchema;


const QuotaDefinitionSchema = new EntitySchema(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionSchemaKey] = QuotaDefinitionSchema;

const ApplicationWithoutSpaceEntitySchema = new EntitySchema(
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
    new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.DEVELOPER)
  ],
  [SpaceUserRoleNames.MANAGER]: [new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.MANAGER)],
  [SpaceUserRoleNames.AUDITOR]: [new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, SpaceUserRoleNames.AUDITOR)]
};
const SpaceSchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[spaceSchemaKey] = SpaceSchema;

const PrivateDomainsSchema = new EntitySchema(privateDomainsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[privateDomainsSchemaKey] = PrivateDomainsSchema;

const coreOrgSchemaParams = {
  domains: [DomainSchema],
  quota_definition: QuotaDefinitionSchema,
  private_domains: [PrivateDomainsSchema]
};
const OrganizationsWithoutSpaces = new EntitySchema(organizationSchemaKey, {
  entity: {
    ...coreOrgSchemaParams,
  }
}, { idAttribute: getAPIResourceGuid });

const OrganizationSchema = new EntitySchema(organizationSchemaKey, {
  entity: {
    ...coreOrgSchemaParams,
    spaces: [SpaceSchema],
    [OrgUserRoleNames.USER]: [new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.USER)],
    [OrgUserRoleNames.MANAGER]: [new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.MANAGER)],
    [OrgUserRoleNames.BILLING_MANAGERS]: [
      new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.BILLING_MANAGERS)
    ],
    [OrgUserRoleNames.AUDITOR]: [new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid }, OrgUserRoleNames.AUDITOR)]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[organizationSchemaKey] = OrganizationSchema;

const SpaceWithOrgsEntitySchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema],
    organization: OrganizationsWithoutSpaces,
  }
}, { idAttribute: getAPIResourceGuid }, spaceWithOrgKey);
entityCache[spaceWithOrgKey] = SpaceWithOrgsEntitySchema;


const ServiceInstancesWithSpaceSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    space: SpaceSchema.withEmptyDefinition(),
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithSpaceSchemaKey] = ServiceInstancesWithSpaceSchema;

const ServiceInstancesWithNoBindingsSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: [new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    service: [new EntitySchema(serviceSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
    space: SpaceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesWithNoBindingsSchemaKey] = ServiceInstancesWithNoBindingsSchema;

const ServicePlanVisibilitySchema = new EntitySchema(servicePlanVisibilitySchemaKey, {
  entity: {
    organization: OrganizationSchema,
    service_plan: new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanVisibilitySchemaKey] = ServicePlanVisibilitySchema;

const UserFavoritesSchemaKey = new EntitySchema(userFavoritesSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[userFavoritesSchemaKey] = UserFavoritesSchemaKey;

const AppAutoscalerPolicySchema = new EntitySchema(appAutoscalerPolicySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerPolicySchemaKey] = AppAutoscalerPolicySchema;

const AppAutoscalerUpdatedPolicySchema = new EntitySchema(appAutoscalerUpdatedPolicySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerUpdatedPolicySchemaKey] = AppAutoscalerUpdatedPolicySchema;

const AppAutoscalerHealthSchema = new EntitySchema(appAutoscalerHealthSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerHealthSchemaKey] = AppAutoscalerHealthSchema;

const AppAutoscalerScalingHistorySchema = new EntitySchema(appAutoscalerScalingHistorySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerScalingHistorySchemaKey] = AppAutoscalerScalingHistorySchema;

const AppAutoscalerAppMetricSchema = new EntitySchema(appAutoscalerAppMetricSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerAppMetricSchemaKey] = AppAutoscalerAppMetricSchema;

const AppAutoscalerInsMetricSchema = new EntitySchema(appAutoscalerInsMetricSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appAutoscalerInsMetricSchemaKey] = AppAutoscalerInsMetricSchema;

const ApplicationEntitySchema = new EntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      space: new EntitySchema(spaceSchemaKey, {
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

const EndpointSchema = new EntitySchema(endpointSchemaKey, {}, { idAttribute: 'guid' });
entityCache[endpointSchemaKey] = EndpointSchema;

const SecurityGroupSchema = new EntitySchema(securityGroupSchemaKey, {
  entity: {
    spaces: [SpaceSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[securityGroupSchemaKey] = SecurityGroupSchema;

const FeatureFlagSchema = new EntitySchema(featureFlagSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[featureFlagSchemaKey] = FeatureFlagSchema;

const SpaceEmptySchema = SpaceSchema.withEmptyDefinition();
const orgUserEntity = {
  entity: {
    spaces: [SpaceEmptySchema]
  }
};

const ServiceBrokerSchema = new EntitySchema(serviceBrokerSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBrokerSchemaKey] = ServiceBrokerSchema;

function createUserOrgSpaceSchema(schemaKey, entity, relationKey): EntitySchema {
  return new EntitySchema(schemaKey, entity, { idAttribute: getAPIResourceGuid }, relationKey);
}

const CFUserSchema = new EntitySchema(cfUserSchemaKey, {
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


const UserProvidedServiceInstanceSchema = new EntitySchema(userProvidedServiceInstanceSchemaKey, {
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

export function addEntityToCache(entitySchema: EntitySchema) {
  entityCache[entitySchema.key] = entitySchema;
}

const UserProfileInfoSchema = new EntitySchema(userProfileSchemaKey, {}, { idAttribute: 'id' });
entityCache[userProfileSchemaKey] = UserProfileInfoSchema;
