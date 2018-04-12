import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';

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
export const githubBranchesSchemaKey = 'githubBranches';
export const githubRepoSchemaKey = 'githubRepo';
export const githubCommitSchemaKey = 'githubCommits';
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

export const spaceWithOrgKey = 'spaceWithOrg';

const entityCache: {
  [key: string]: EntitySchema
} = {};

/**
 * Mostly a wrapper around schema.Entity. Allows a lot of uniformity of types through console. Includes some minor per entity type config
 *
 * @export
 * @class EntitySchema
 * @extends {schema.Entity}
 */
export class EntitySchema extends schema.Entity {
  schema: Schema;
  /**
   * @param {string} entityKey As per schema.Entity ctor
   * @param {Schema} [definition] As per schema.Entity ctor
   * @param {schema.EntityOptions} [options] As per schema.Entity ctor
   * @param {string} [relationKey] Allows multiple children of the same type within a single parent entity
   * @memberof EntitySchema
   */
  constructor(
    private entityKey: string,
    private definition?: Schema,
    private options?: schema.EntityOptions,
    public relationKey?: string,
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

const GithubBranchSchema = new EntitySchema(githubBranchesSchemaKey, {}, { idAttribute: 'entityId' });
entityCache[githubBranchesSchemaKey] = GithubBranchSchema;

const GithubRepoSchema = new EntitySchema(githubRepoSchemaKey);
entityCache[githubRepoSchemaKey] = GithubRepoSchema;

const GithubCommitSchema = new EntitySchema(githubCommitSchemaKey);
entityCache[githubCommitSchemaKey] = GithubCommitSchema;

const CFInfoSchema = new EntitySchema(cfInfoSchemaKey);
entityCache[cfInfoSchemaKey] = CFInfoSchema;

const EventSchema = new EntitySchema(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEventSchemaKey] = EventSchema;

const StackSchema = new EntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackSchemaKey] = StackSchema;

const DomainSchema = new EntitySchema(domainSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[domainSchemaKey] = DomainSchema;

const ServiceSchema = new EntitySchema(serviceSchemaKey, {
  service_plans: [new EntitySchema(servicePlanSchemaKey, {}, { idAttribute: getAPIResourceGuid })]
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceSchemaKey] = ServiceSchema;

const MetricSchema = new EntitySchema(metricSchemaKey);
entityCache[metricSchemaKey] = MetricSchema;

const SpaceQuotaSchema = new EntitySchema(spaceQuotaSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[spaceQuotaSchemaKey] = SpaceQuotaSchema;

const ServiceBindingsSchema = new EntitySchema(serviceBindingSchemaKey, {
  entity: {
    app: new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid })
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceBindingSchemaKey] = ServiceBindingsSchema;

const ServicePlanSchema = new EntitySchema(servicePlanSchemaKey, {
  entity: {
    service: ServiceSchema
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[servicePlanSchemaKey] = ServicePlanSchema;

const ServiceInstancesSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service: ServiceSchema,
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema]
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[serviceInstancesSchemaKey] = ServiceInstancesSchema;

const BuildpackSchema = new EntitySchema(buildpackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[buildpackSchemaKey] = BuildpackSchema;

const coreRouteSchemaParams = {
  entity: {
    domain: DomainSchema
  }
};
const RouteSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    ...coreRouteSchemaParams,
    apps: [new EntitySchema(applicationSchemaKey, {}, { idAttribute: getAPIResourceGuid })],
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[routeSchemaKey] = RouteSchema;
const RouteNoAppsSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    ...coreRouteSchemaParams,
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
};
const SpaceSchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    ...coreSpaceSchemaParams,
    apps: [ApplicationWithoutSpaceEntitySchema],
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

const ApplicationEntitySchema = new EntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      space: new EntitySchema(spaceSchemaKey, {
        entity: {
          ...coreSpaceSchemaParams,
          routes: [RouteNoAppsSchema],
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
const OrganizationUserSchema = new EntitySchema(
  organizationSchemaKey, orgUserEntity, { idAttribute: getAPIResourceGuid }, 'users_organizations');
const OrganizationAuditedSchema = new EntitySchema(
  organizationSchemaKey, orgUserEntity, { idAttribute: getAPIResourceGuid }, 'audited_organizations');
const OrganizationManagedSchema = new EntitySchema(
  organizationSchemaKey, orgUserEntity, { idAttribute: getAPIResourceGuid }, 'managed_organizations');
const OrganizationBillingSchema = new EntitySchema(
  organizationSchemaKey, orgUserEntity, { idAttribute: getAPIResourceGuid }, 'billing_managed_organizations');
const SpaceUserSchema = new EntitySchema(spaceSchemaKey, {}, { idAttribute: getAPIResourceGuid }, 'users_spaces');
const SpaceManagedSchema = new EntitySchema(spaceSchemaKey, {}, { idAttribute: getAPIResourceGuid }, 'managed_spaces');
const SpaceAuditedSchema = new EntitySchema(spaceSchemaKey, {}, { idAttribute: getAPIResourceGuid }, 'audited_spaces');

const CFUserSchema = new EntitySchema(cfUserSchemaKey, {
  entity: {
    organizations: [OrganizationUserSchema],
    audited_organizations: [OrganizationAuditedSchema],
    managed_organizations: [OrganizationManagedSchema],
    billing_managed_organizations: [OrganizationBillingSchema],
    spaces: [SpaceUserSchema],
    managed_spaces: [SpaceManagedSchema],
    audited_spaces: [SpaceAuditedSchema],
  }
}, { idAttribute: getAPIResourceGuid });
entityCache[cfUserSchemaKey] = CFUserSchema;

export function entityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}
