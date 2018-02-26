import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import * as relations from './entity-relations';
import { EntityInlineChild } from './entity-relations.helpers';

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
export const routesInAppKey = 'routesInApp';
export const routesInSpaceKey = 'routesInSpace';
export const organisationWithSpaceKey = 'organization';
export const spacesKey = 'spaces';


export const AppSummarySchema = new schema.Entity(appSummarySchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppStatSchema = new schema.Entity(appStatsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppStatsSchema = new schema.Array(AppStatSchema); // TODO: RC
export const AppEnvVarSchema = new schema.Entity(appEnvVarsSchemaKey, {}, { idAttribute: getAPIResourceGuid });
export const AppEnvVarsSchema = new schema.Array(AppEnvVarSchema); // TODO: RC

export const GithubBranchSchema = new schema.Entity(githubBranchesSchemaKey, {}, { idAttribute: 'entityId' });
// export const BranchesSchema = new schema.Array(GithubBranchSchema); // TODO: RC

export const GithubRepoSchema = new schema.Entity(githubRepoSchemaKey);
export const GithubCommitSchema = new schema.Entity(githubCommitSchemaKey);
// export const GithubBranchSchema = new schema.Entity(GITHUB_BRANCHES_ENTITY_KEY); // TODO: RC
// export const GithubBranchesSchema = new schema.Array(GithubBranchSchema); // TODO: RC

export const UserSchema = new schema.Entity(cfUserSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
}
);

export const SpaceSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    apps: entityFactory(applicationSchemaKey),
    routes: entityFactory<EntityInlineChild>(routesInSpaceKey)
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const OrganisationWithSpaceSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    quota_definition: entityFactory(quotaDefinitionSchemaKey),
    spaces: entityFactory(spaceSchemaKey)
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const EndpointSchema = new schema.Entity(endpointSchemaKey, {}, {
  idAttribute: 'guid'
});

export const CFInfoSchema = new schema.Entity(cfInfoSchemaKey);

export const EventSchema = new schema.Entity(appEventSchemaKey, {
  entity: {
  }
}, {
    idAttribute: getAPIResourceGuid
  });


export const DomainSchema = new schema.Entity(
  domainSchemaKey,
  {},
  {
    idAttribute: getAPIResourceGuid
  }
);

export const RouteSchema = new schema.Entity(routeSchemaKey, {
  entity: {
    domain: entityFactory(domainSchemaKey)
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const RoutesInAppSchema = new EntityInlineChild(
  [relations.entityRelationFactory(relations.appRouteRelationKey)],
  entityFactory(routeSchemaKey)
);

export const RoutesInSpaceSchema = new EntityInlineChild(
  [relations.entityRelationFactory(relations.spaceRouteRelationKey)],
  entityFactory<EntityInlineChild>(routesInAppKey));

export const SpacesSchema = new EntityInlineChild(
  [relations.entityRelationFactory(relations.orgSpaceRelationKey)],
  entityFactory(spaceSchemaKey)
);

export const applicationEntitySchema = new schema.Entity(
  applicationSchemaKey,
  {
    entity: {
      stack: entityFactory(stackSchemaKey),
      space: entityFactory(spaceWithOrgKey),
      routes: entityFactory<EntityInlineChild>(routesInAppKey)
    }
  },
  {
    idAttribute: getAPIResourceGuid
  }
);

export const stackSchema = new schema.Entity(stackSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});

export const QuotaDefinitionSchema = new schema.Entity(quotaDefinitionSchemaKey, {}, {
  idAttribute: getAPIResourceGuid
});


export const OrganisationSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    quota_definition: entityFactory(quotaDefinitionSchemaKey)
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const spaceWithOrgsEntitySchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    apps: entityFactory(applicationSchemaKey),
    organization: entityFactory(organisationSchemaKey)
  }
}, {
    idAttribute: getAPIResourceGuid
  });


export function entityFactory<T extends schema.Entity | EntityInlineChild = schema.Entity>(key: string): T {
  switch (key) {
    case applicationSchemaKey:
      return applicationEntitySchema as T;
    case stackSchemaKey:
      return stackSchema as T;
    case spaceWithOrgKey:
      return spaceWithOrgsEntitySchema as T;
    case routesInAppKey:
      return RoutesInAppSchema as T;
    case routeSchemaKey:
      return RouteSchema as T;
    case domainSchemaKey:
      return DomainSchema as T;
    case organisationSchemaKey:
      return OrganisationSchema as T;
    case domainSchemaKey:
      return QuotaDefinitionSchema as T;
    case appEventSchemaKey:
      return EventSchema as T;
    case endpointSchemaKey:
      return EndpointSchema as T;
    case organisationWithSpaceKey:
      return OrganisationWithSpaceSchema as T;
    case spaceSchemaKey:
      return SpaceSchema as T;
    case cfUserSchemaKey:
      return UserSchema as T;
    case appSummarySchemaKey:
      return AppSummarySchema as T;
    case appStatsSchemaKey:
      return AppStatSchema as T;
    case appEnvVarsSchemaKey:
      return AppEnvVarSchema as T;
    case githubBranchesSchemaKey:
      return GithubBranchSchema as T;
    case githubRepoSchemaKey:
      return GithubRepoSchema as T;
    case githubCommitSchemaKey:
      return GithubCommitSchema as T;
    case routesInSpaceKey:
      return RoutesInSpaceSchema as T;
    case spacesKey:
      return SpacesSchema as T;
    default:
      throw new Error(`Unknown entity schema type: ${key}`);
  }
}

