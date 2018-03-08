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

export const spaceWithOrgKey = 'spaceWithOrg';
// export const routesInSpaceKey = 'routesInSpace';
export const organisationWithSpaceKey = 'organization';
export const spacesKey = 'spaces';

export class EntitySchema extends schema.Entity {
  constructor(entityKey: string, definition?: Schema, options?: schema.EntityOptions, public relationKey?: string, ) {
    super(entityKey, definition, options);
    if (!relationKey) {
      this.relationKey = entityKey;
    }
  }
}

export const AppSummarySchema = new EntitySchema(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppStatSchema = new EntitySchema(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppEnvVarSchema = new EntitySchema(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const GithubBranchSchema = new EntitySchema(githubBranchesSchemaKey, {}, { idAttribute: 'entityId' });

export const GithubRepoSchema = new EntitySchema(githubRepoSchemaKey);
export const GithubCommitSchema = new EntitySchema(githubCommitSchemaKey);

export const EndpointSchema = new EntitySchema(endpointSchemaKey, {}, { idAttribute: 'guid' });

export const CFInfoSchema = new EntitySchema(cfInfoSchemaKey);

export const EventSchema = new EntitySchema(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const UserSchema = new EntitySchema(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const StackSchema = new EntitySchema(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const DomainSchema = new EntitySchema(domainSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const ApplicationWithoutRoutesSchema = new EntitySchema(applicationSchemaKey, {
  entity: {
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const RouteSchema = new EntitySchema(routeSchemaKey, {
  entity: {
    apps: [ApplicationWithoutRoutesSchema],
    domain: DomainSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const QuotaDefinitionSchema = new EntitySchema(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });

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

export const SpaceSchema = new EntitySchema(spaceSchemaKey, {
  entity: {
    apps: [ApplicationWithoutSpaceEntitySchema],
    routes: [RouteSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

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

export const OrganisationWithSpaceSchema = new EntitySchema(organisationSchemaKey, {
  entity: {
    quota_definition: QuotaDefinitionSchema,
    spaces: SpaceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

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

export const OrganisationWithSpaceSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    spaces: [SpaceSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });


export const ServiceSchema = new schema.Entity('service', {}, {
  idAttribute: getAPIResourceGuid
}
);

export const ServiceBindingsSchema = new schema.Entity('serviceBinding', {}, {
  idAttribute: getAPIResourceGuid
}
);

export const ServicePlanSchema = new schema.Entity('servicePlan', {
  entity: {
    service: ServiceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);

export const ServiceInstancesSchema = new schema.Entity('serviceInstance', {
  entity: {
    service_plan: ServicePlanSchema,
    service_bindings: [ServiceBindingsSchema]
  }
}, {
    idAttribute: getAPIResourceGuid,
  }
);

export const ServiceInstanceSchemaWithServiceBinding = new schema.Entity('serviceInstance', {
  entity: {
    service_bindings: ServiceBindingsSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  }
);

export function entityFactory(key: string): EntitySchema {
  switch (key) {
    case applicationSchemaKey:
      return ApplicationEntitySchema;
    case stackSchemaKey:
      return StackSchema;
    case spaceWithOrgKey:
      return SpaceWithOrgsEntitySchema;
    case routeSchemaKey:
      return RouteSchema;
    case domainSchemaKey:
      return DomainSchema;
    case organisationSchemaKey:
      return OrganisationSchema;
    case quotaDefinitionSchemaKey:
      return QuotaDefinitionSchema;
    case appEventSchemaKey:
      return EventSchema;
    case endpointSchemaKey:
      return EndpointSchema;
    case organisationWithSpaceKey:
      return OrganisationWithSpaceSchema;
    case spaceSchemaKey:
      return SpaceSchema;
    case cfUserSchemaKey:
      return UserSchema;
    case appSummarySchemaKey:
      return AppSummarySchema;
    case appStatsSchemaKey:
      return AppStatSchema;
    case appEnvVarsSchemaKey:
      return AppEnvVarSchema;
    case githubBranchesSchemaKey:
      return GithubBranchSchema;
    case githubRepoSchemaKey:
      return GithubRepoSchema;
    case githubCommitSchemaKey:
      return GithubCommitSchema;
    case quotaDefinitionSchemaKey:
      return QuotaDefinitionSchema;
    case cfInfoSchemaKey:
      return CFInfoSchema;
    // case routesInSpaceKey:
    //   return SpaceRoutesOnlySchema;
    default:
      throw new Error(`Unknown entity schema type: ${key}`);
  }
}

