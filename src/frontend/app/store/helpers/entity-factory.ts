import { Schema, schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';

export const applicationSchemaKey = 'application';
export const stackSchemaKey = 'stack';
export const spaceSchemaKey = 'space';
// export const spaceWithOrgRelationKey = 'spaceWithOrg';
export const routeSchemaKey = 'route';
export const domainSchemaKey = 'domain';
export const organisationSchemaKey = 'organization';
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


export const spaceWithOrgKey = 'spaceWithOrg';
// export const routesInSpaceKey = 'routesInSpace';
export const organisationWithSpaceKey = 'organization';
export const spacesKey = 'spaces';

const entityCache: {
  [key: string]: EntitySchema
} = {};

export class EntitySchema extends schema.Entity {
  constructor(entityKey: string, definition?: Schema, options?: schema.EntityOptions, public relationKey?: string, ) {
    super(entityKey, definition, options);
    if (!relationKey) {
      this.relationKey = entityKey;
    }
  }
}

// Note - The cache entry is added as a secondary step. This helps keep the child entity definition's cleared and easier to spot circular
// dependencies

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

// TODO: RC ConsoleUser & CFUser
const UserSchema = new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[cfUserSchemaKey] = UserSchema;

const StackSchema = new EntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackSchemaKey] = StackSchema;

const DomainSchema = new EntitySchema(domainSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[domainSchemaKey] = DomainSchema;

const ApplicationWithoutRoutesSchema = new EntitySchema(applicationSchemaKey, {
  entity: {
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[applicationSchemaKey] = ApplicationWithoutRoutesSchema;

const RouteSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    apps: [ApplicationWithoutRoutesSchema],
    domain: DomainSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[routeSchemaKey] = RouteSchema;

const QuotaDefinitionSchema = new EntitySchema(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionSchemaKey] = QuotaDefinitionSchema;

const ApplicationWithoutSpaceEntitySchema = new EntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      routes: [RouteSchema]
    }
  },
  {
    idAttribute: getAPIResourceGuid
  },

);
entityCache[applicationSchemaKey] = ApplicationWithoutSpaceEntitySchema;

const SpaceSchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    apps: [ApplicationWithoutSpaceEntitySchema],
    routes: [RouteSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[spaceSchemaKey] = SpaceSchema;

// const SpaceRoutesOnlySchema = new EntitySchema(spaceSchemaKey, {
//   entity: {
//     routes: [RouteSchema]
//   }
// }, {
//     idAttribute: getAPIResourceGuid
//   }, routesInSpaceKey);

const OrganisationSchema = new EntitySchema(organisationSchemaKey, {
  entity: {
    domains: [DomainSchema],
    spaces: [SpaceSchema],
    quota_definition: QuotaDefinitionSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[organisationSchemaKey] = OrganisationSchema;

const SpaceWithOrgsEntitySchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    apps: [ApplicationWithoutSpaceEntitySchema],
    organization: OrganisationSchema,
    domains: [DomainSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  },
  spaceWithOrgKey);
entityCache[spaceWithOrgKey] = SpaceWithOrgsEntitySchema;

const OrganisationWithSpaceSchema = new EntitySchema(organisationSchemaKey, {
  entity: {
    quota_definition: QuotaDefinitionSchema,
    spaces: [SpaceSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[organisationWithSpaceKey] = OrganisationWithSpaceSchema;

const ApplicationEntitySchema = new EntitySchema(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      space: SpaceWithOrgsEntitySchema,
      routes: [RouteSchema]
    }
  },
  {
    idAttribute: getAPIResourceGuid
  }
);
entityCache[applicationSchemaKey] = ApplicationEntitySchema;

const ServiceSchema = new EntitySchema(serviceSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
}
);
entityCache[serviceSchemaKey] = ServiceSchema;

const ServiceBindingsSchema = new EntitySchema(serviceBindingSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
}
);
entityCache[serviceBindingSchemaKey] = ServiceBindingsSchema;

const ServicePlanSchema = new EntitySchema(servicePlanSchemaKey, {
  entity: {
    service: ServiceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);
entityCache[servicePlanSchemaKey] = ServicePlanSchema;

const ServiceInstancesSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema]
  }
}, {
    idAttribute: getAPIResourceGuid,
  }
);
entityCache[serviceInstancesSchemaKey] = ServiceInstancesSchema;

const BuildpackSchema = new schema.Entity(
  buildpackSchemaKey,
  {},
  {
    idAttribute: getAPIResourceGuid
  }
);
entityCache[serviceInstancesSchemaKey] = BuildpackSchema;

const EndpointSchema = new EntitySchema(endpointSchemaKey, {
  users: [UserSchema]
}, {
    idAttribute: 'guid'
  });
entityCache[endpointSchemaKey] = EndpointSchema;

const SecurityGroupSchema = new schema.Entity(securityGroupSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});
entityCache[securityGroupSchemaKey] = SecurityGroupSchema;

const FeatureFlagSchema = new schema.Entity(featureFlagSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[featureFlagSchemaKey] = FeatureFlagSchema;


export function entityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}

