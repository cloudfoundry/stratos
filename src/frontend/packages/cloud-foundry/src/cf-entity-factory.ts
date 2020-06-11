import { metricEntityType } from '../../core/src/base-entity-schemas';
import { EntitySchema } from '../../store/src/helpers/entity-schema';
import { APIResource } from '../../store/src/types/api.types';
import {
  CFApplicationEntitySchema,
  CFEntitySchema,
  CFOrgEntitySchema,
  CFRouteEntitySchema,
  CFServiceBindingEntitySchema,
  CFServiceInstanceEntitySchema,
  CFSpaceEntitySchema,
  CFUserEntitySchema,
} from './cf-entity-schema-types';
import {
  appEnvVarsEntityType,
  applicationEntityType,
  appStatsEntityType,
  appSummaryEntityType,
  buildpackEntityType,
  cfEventEntityType,
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
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
  spaceWithOrgEntityType,
  stackEntityType,
  userProvidedServiceInstanceEntityType,
} from './cf-entity-types';
import { getAPIResourceGuid } from './store/selectors/api.selectors';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from './store/types/user.types';

const entityCache: {
  [key: string]: EntitySchema
} = {};

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

const GithubCommitSchema = new CFEntitySchema(gitCommitEntityType, {}, { idAttribute: commit => commit.guid });
entityCache[gitCommitEntityType] = GithubCommitSchema;

const CFInfoSchema = new CFEntitySchema(cfInfoEntityType);
entityCache[cfInfoEntityType] = CFInfoSchema;

const EventSchema = new CFEntitySchema(cfEventEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[cfEventEntityType] = EventSchema;

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

const ServiceBindingsSchema = new CFServiceBindingEntitySchema({
  entity: {
    app: new CFApplicationEntitySchema(),
    service_instance: new CFServiceInstanceEntitySchema({
      entity: {
        service_bindings: [
          new CFEntitySchema(serviceBindingEntityType, {
            app: new CFApplicationEntitySchema(),
          }, { idAttribute: getAPIResourceGuid })],
        service: new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: ServicePlanSchema,
      },
    })
  }
});
entityCache[serviceBindingEntityType] = ServiceBindingsSchema;

const ServiceBindingsNoBindingsSchema = new CFServiceBindingEntitySchema({
  entity: {
    app: new CFApplicationEntitySchema(),
    service_instance: new CFServiceInstanceEntitySchema({
      entity: {
        service: new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid }),
        service_plan: new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid }),
      },
    }),
    service: ServiceNoPlansSchema
  }
});
entityCache[serviceBindingNoBindingsEntityType] = ServiceBindingsNoBindingsSchema;

const ServiceInstancesSchema = new CFServiceInstanceEntitySchema({
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
  }
});
entityCache[serviceInstancesEntityType] = ServiceInstancesSchema;

const BuildpackSchema = new CFEntitySchema(buildpackEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[buildpackEntityType] = BuildpackSchema;

const RouteSchema = new CFRouteEntitySchema({
  entity: {
    domain: DomainSchema,
    apps: [new CFApplicationEntitySchema()],
    space: new CFSpaceEntitySchema({}),
  }
});
entityCache[routeEntityType] = RouteSchema;

const RouteNoAppsSchema = new CFRouteEntitySchema({
  entity: {
    domain: DomainSchema,
  }
});

const QuotaDefinitionSchema = new CFEntitySchema(quotaDefinitionEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionEntityType] = QuotaDefinitionSchema;

const ApplicationWithoutSpaceEntitySchema = new CFApplicationEntitySchema(
  {
    entity: {
      stack: StackSchema,
      routes: [RouteNoAppsSchema],
      service_bindings: [ServiceBindingsSchema]
    }
  }
);

const CFUserSchema = new CFUserEntitySchema({
  entity: {
    organizations: [createUserOrgSpaceSchema(organizationEntityType, {}, CfUserRoleParams.ORGANIZATIONS)],
    audited_organizations: [createUserOrgSpaceSchema(organizationEntityType, {}, CfUserRoleParams.AUDITED_ORGS)],
    managed_organizations: [createUserOrgSpaceSchema(organizationEntityType, {}, CfUserRoleParams.MANAGED_ORGS)],
    billing_managed_organizations: [createUserOrgSpaceSchema(organizationEntityType, {}, CfUserRoleParams.BILLING_MANAGER_ORGS)],
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

const coreSpaceSchemaParams = {
  routes: [RouteSchema],
  domains: [DomainSchema],
  space_quota_definition: SpaceQuotaSchema,
  service_instances: [ServiceInstancesSchema],
  [SpaceUserRoleNames.DEVELOPER]: [CFUserSchema],
  [SpaceUserRoleNames.MANAGER]: [CFUserSchema],
  [SpaceUserRoleNames.AUDITOR]: [CFUserSchema]
};
const SpaceSchema = new CFSpaceEntitySchema({
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema]
  }
});
entityCache[spaceEntityType] = SpaceSchema;

const PrivateDomainsSchema = new CFEntitySchema(privateDomainsEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[privateDomainsEntityType] = PrivateDomainsSchema;

const coreOrgSchemaParams = {
  domains: [DomainSchema],
  quota_definition: QuotaDefinitionSchema,
  private_domains: [PrivateDomainsSchema]
};

const OrganizationsWithoutSpaces = new CFOrgEntitySchema({
  entity: {
    ...coreOrgSchemaParams,
  }
});

const OrganizationSchema = new CFOrgEntitySchema({
  entity: {
    ...coreOrgSchemaParams,
    spaces: [SpaceSchema],
    [OrgUserRoleNames.USER]: [CFUserSchema],
    [OrgUserRoleNames.MANAGER]: [CFUserSchema],
    [OrgUserRoleNames.BILLING_MANAGERS]: [CFUserSchema],
    [OrgUserRoleNames.AUDITOR]: [CFUserSchema]
  }
});
entityCache[organizationEntityType] = OrganizationSchema;

const SpaceWithOrgsEntitySchema = new CFSpaceEntitySchema({
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema],
    organization: OrganizationsWithoutSpaces,
  }
}, spaceWithOrgEntityType);
entityCache[spaceWithOrgEntityType] = SpaceWithOrgsEntitySchema;


const ServiceInstancesWithSpaceSchema = new CFServiceInstanceEntitySchema({
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema],
    space: SpaceSchema.withEmptyDefinition(),
  }
});
entityCache[serviceInstancesWithSpaceEntityType] = ServiceInstancesWithSpaceSchema;

const ServiceInstancesWithNoBindingsSchema = new CFServiceInstanceEntitySchema({
  entity: {
    service_plan: [new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid })],
    service: [new CFEntitySchema(serviceEntityType, {}, { idAttribute: getAPIResourceGuid })],
    space: SpaceSchema
  }
});
entityCache[serviceInstancesWithNoBindingsEntityType] = ServiceInstancesWithNoBindingsSchema;

const ServicePlanVisibilitySchema = new CFEntitySchema(servicePlanVisibilityEntityType, {
  entity: {
    organization: OrganizationSchema,
    service_plan: new CFEntitySchema(servicePlanEntityType, {}, { idAttribute: getAPIResourceGuid }),
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanVisibilityEntityType] = ServicePlanVisibilitySchema;

const ApplicationEntitySchema = new CFApplicationEntitySchema(
  {
    entity: {
      stack: StackSchema,
      space: new CFSpaceEntitySchema({
        entity: {
          ...coreSpaceSchemaParams,
          routes: [RouteNoAppsSchema],
          service_instances: [ServiceInstancesWithNoBindingsSchema],
          organization: OrganizationsWithoutSpaces,
        }
      }),
      routes: [RouteNoAppsSchema],
      service_bindings: [ServiceBindingsSchema]
    }
  });
entityCache[applicationEntityType] = ApplicationEntitySchema;

const SecurityGroupSchema = new CFEntitySchema(securityGroupEntityType, {
  entity: {
    spaces: [SpaceSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[securityGroupEntityType] = SecurityGroupSchema;

const FeatureFlagSchema = new CFEntitySchema(featureFlagEntityType, {}, { idAttribute: 'name' });
entityCache[featureFlagEntityType] = FeatureFlagSchema;

const ServiceBrokerSchema = new CFEntitySchema(serviceBrokerEntityType, {}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBrokerEntityType] = ServiceBrokerSchema;

function createUserOrgSpaceSchema(schemaKey, entity, relationKey): EntitySchema {
  return new CFEntitySchema(schemaKey, entity, { idAttribute: getAPIResourceGuid }, relationKey);
}


const UserProvidedServiceInstanceSchema = new CFEntitySchema(userProvidedServiceInstanceEntityType, {
  entity: {
    space: SpaceWithOrgsEntitySchema,
    service_bindings: [ServiceBindingsSchema],
    routes: [RouteSchema]
  }
},
  { idAttribute: getAPIResourceGuid },
  null,
  [
    servicePlanEntityType,
    // Service bindings
    applicationEntityType,
    serviceInstancesEntityType,
    serviceEntityType,
    organizationEntityType,
    spaceEntityType
  ]
);
entityCache[userProvidedServiceInstanceEntityType] = UserProvidedServiceInstanceSchema;


export function cfEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
