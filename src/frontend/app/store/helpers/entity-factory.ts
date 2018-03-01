import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';

export const applicationSchemaKey = 'application';
export const stackSchemaKey = 'stack';
export const spaceSchemaKey = 'space';
export const routeSchemaKey = 'route';
export const domainSchemaKey = 'domain';
export const organisationSchemaKey = 'organization';
export const quotaDefinitionSchemaKey = 'quota_definition';
export const appEventSchemaKey = 'event';
export const cfInfoSchemaKey = 'info';
export const endpointSchemaKey = 'endpoint';
export const cfUserSchemaKey = 'user';
export const appSummarySchemaKey = 'summary';
export const appStatsSchemaKey = 'stats';
export const appEnvVarsSchemaKey = 'environmentVars';
export const githubBranchesSchemaKey = 'githubBranches';
export const githubRepoSchemaKey = 'githubRepo';
export const githubCommitSchemaKey = 'githubBranches';

export const spaceWithOrgKey = 'spaceWithOrg';
export const routesInSpaceKey = 'routesInSpace';
export const organisationWithSpaceKey = 'organization';
export const spacesKey = 'spaces';


export const AppSummarySchema = new schema.Entity(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppStatSchema = new schema.Entity(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
// export const AppStatsSchema = new schema.Array(AppStatSchema); // TODO: RC
export const AppEnvVarSchema = new schema.Entity(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
// export const AppEnvVarsSchema = new schema.Array(AppEnvVarSchema); // TODO: RC

export const GithubBranchSchema = new schema.Entity(githubBranchesSchemaKey, {}, { idAttribute: 'entityId' });
// export const BranchesSchema = new schema.Array(GithubBranchSchema); // TODO: RC

export const GithubRepoSchema = new schema.Entity(githubRepoSchemaKey);
export const GithubCommitSchema = new schema.Entity(githubCommitSchemaKey);
// export const GithubBranchSchema = new schema.Entity(GITHUB_BRANCHES_ENTITY_KEY); // TODO: RC
// export const GithubBranchesSchema = new schema.Array(GithubBranchSchema); // TODO: RC

export const EndpointSchema = new schema.Entity(endpointSchemaKey, {}, { idAttribute: 'guid' });

export const CFInfoSchema = new schema.Entity(cfInfoSchemaKey);

export const EventSchema = new schema.Entity(appEventSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const UserSchema = new schema.Entity(cfUserSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const StackSchema = new schema.Entity(stackSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const DomainSchema = new schema.Entity(domainSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const RouteSchema = new schema.Entity(routeSchemaKey, {
  entity: {
    domain: DomainSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const QuotaDefinitionSchema = new schema.Entity(quotaDefinitionSchemaKey, {}, { idAttribute: getAPIResourceGuid });

export const ApplicationWithoutSpaceEntitySchema = new schema.Entity(
  applicationSchemaKey,
  {
    entity: {
      stack: StackSchema,
      routes: [RouteSchema]
    }
  },
  {
    idAttribute: getAPIResourceGuid
  }
);

export const SpaceSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    apps: [ApplicationWithoutSpaceEntitySchema],
    routes: [RouteSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    spaces: [SpaceSchema],
    quota_definition: QuotaDefinitionSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const SpaceWithOrgsEntitySchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    apps: ApplicationWithoutSpaceEntitySchema,
    organization: OrganisationSchema,
    domains: [DomainSchema]
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const OrganisationWithSpaceSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    quota_definition: QuotaDefinitionSchema,
    spaces: SpaceSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const ApplicationEntitySchema = new schema.Entity(
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


export function entityFactory(key: string): schema.Entity {
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
    // case routesInSpaceKey:
    //   return RoutesInSpaceSchema as T;
    // case spacesKey:
    //   return SpacesSchema as T;
    default:
      throw new Error(`Unknown entity schema type: ${key}`);
  }
}

