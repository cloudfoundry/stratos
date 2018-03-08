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

export const AppSummarySchema = new EntitySchema(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appSummarySchemaKey] = AppSummarySchema;

export const AppStatSchema = new EntitySchema(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appStatsSchemaKey] = AppStatSchema;

export const AppEnvVarSchema = new EntitySchema(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEnvVarsSchemaKey] = AppEnvVarSchema;

export const GithubBranchSchema = new EntitySchema(githubBranchesSchemaKey, {}, { idAttribute: 'entityId' });
entityCache[githubBranchesSchemaKey] = GithubBranchSchema;

export const GithubRepoSchema = new EntitySchema(githubRepoSchemaKey);
entityCache[githubRepoSchemaKey] = GithubRepoSchema;

export const GithubCommitSchema = new EntitySchema(githubCommitSchemaKey);
entityCache[githubCommitSchemaKey] = GithubCommitSchema;

export const CFInfoSchema = new EntitySchema(cfInfoSchemaKey);
entityCache[cfInfoSchemaKey] = CFInfoSchema;

export const EventSchema = new EntitySchema(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[appEventSchemaKey] = EventSchema;

export const UserSchema = new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[cfUserSchemaKey] = UserSchema;

export const StackSchema = new EntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[stackSchemaKey] = StackSchema;

export const DomainSchema = new EntitySchema(domainSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[domainSchemaKey] = DomainSchema;

export const ApplicationWithoutRoutesSchema = new EntitySchema(applicationSchemaKey, {
  entity: {
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[applicationSchemaKey] = ApplicationWithoutRoutesSchema;

export const RouteSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    apps: [ApplicationWithoutRoutesSchema],
    domain: DomainSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[routeSchemaKey] = RouteSchema;

export const QuotaDefinitionSchema = new EntitySchema(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });
entityCache[quotaDefinitionSchemaKey] = QuotaDefinitionSchema;

export const ApplicationWithoutSpaceEntitySchema = new EntitySchema(
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

export const SpaceSchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    apps: [ApplicationWithoutSpaceEntitySchema],
    routes: [RouteSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[spaceSchemaKey] = SpaceSchema;

// export const SpaceRoutesOnlySchema = new EntitySchema(spaceSchemaKey, {
//   entity: {
//     routes: [RouteSchema]
//   }
// }, {
//     idAttribute: getAPIResourceGuid
//   }, routesInSpaceKey);

export const OrganisationSchema = new EntitySchema(organisationSchemaKey, {
  entity: {
    domains: [DomainSchema],
    spaces: [SpaceSchema],
    quota_definition: QuotaDefinitionSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[organisationSchemaKey] = OrganisationSchema;

export const SpaceWithOrgsEntitySchema = new EntitySchema(spaceSchemaKey, {
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

export const OrganisationWithSpaceSchema = new EntitySchema(organisationSchemaKey, {
  entity: {
    quota_definition: QuotaDefinitionSchema,
    spaces: SpaceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });
entityCache[organisationWithSpaceKey] = OrganisationWithSpaceSchema;

export const ApplicationEntitySchema = new EntitySchema(
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

export const ServiceSchema = new EntitySchema(serviceSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
}
);
entityCache[serviceSchemaKey] = ServiceSchema;

export const ServiceBindingsSchema = new EntitySchema(serviceBindingSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
}
);
entityCache[serviceBindingSchemaKey] = ServiceBindingsSchema;

export const ServicePlanSchema = new EntitySchema(servicePlanSchemaKey, {
  entity: {
    service: ServiceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);
entityCache[servicePlanSchemaKey] = ServicePlanSchema;

export const ServiceInstancesSchema = new EntitySchema(serviceInstancesSchemaKey, {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema]
  }
}, {
    idAttribute: getAPIResourceGuid,
  }
);
entityCache[serviceInstancesSchemaKey] = ServiceInstancesSchema;

export const EndpointSchema = new EntitySchema(endpointSchemaKey, {
  users: [UserSchema]
}, {
    idAttribute: 'guid'
  });
entityCache[endpointSchemaKey] = EndpointSchema;

export function entityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}

