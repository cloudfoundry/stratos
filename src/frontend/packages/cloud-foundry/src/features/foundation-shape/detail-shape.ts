/**
 * The named (detail) foundation dataset (GH #5702): orgs → spaces → apps as the
 * session registry actually holds them, identity intact. The anonymous dataset
 * (#5703) is a projection of the same drains with the names removed; this one
 * keeps them, which is why its export is admin-only and confirmed at the click.
 *
 * Nothing here is invented or fetched: every field is already on the St*
 * entities the session loaded. Two honesty rules carry over from
 * shape-export.ts:
 *
 *  - an undefined input array means "that drain never ran", and the
 *    corresponding key is absent from the tree — never an empty array;
 *  - a child whose parent is missing from a drain that DID run lands in
 *    `orphans` instead of being dropped, so a partial drain stays visible
 *    rather than quietly shrinking the foundation.
 */
import {
  StApp,
  StOrg,
  StServiceCredentialBinding,
  StServiceInstance,
  StSpace,
  StUser,
} from '../../services/endpoint-data/stratos-types';

/** username → the role names granted at that scope. */
export type RoleGrants = Record<string, string[]>;

export interface DetailBinding {
  guid: string;
  /** 'app' | 'key' — v3's binding type. */
  type: string;
  name?: string;
  service_instance: { guid: string; name?: string };
}

export interface DetailServiceInstance {
  guid: string;
  name: string;
  /** 'managed' | 'user-provided'. */
  type: string;
  plan?: string;
  offering?: string;
}

export interface DetailApp {
  guid: string;
  name: string;
  state: string;
  instances: number;
  stack?: string;
  memory_mb?: number;
  disk_mb?: number;
  routes: string[];
  last_refreshed_at?: string;
  /** Fields the backend could not compose for this app (StApp._meta.unavailable). */
  unavailable?: string[];
  service_bindings?: DetailBinding[];
}

export interface DetailSpace {
  guid: string;
  name: string;
  quota_guid?: string;
  // StSpace.appCount / routeCount are deliberately NOT exported: on the spaces
  // this page can see they are always 0. The registry drains the space list
  // with `enrich=none` (endpoint-data.service.ts) because the per-space count
  // enrichment costs ~8 filtered CAPI round-trips per page and nothing renders
  // it off that list, so getNativeSpaces skips it and the field keeps its zero
  // value. Exporting that would put a 0 next to a populated `apps` array --
  // observed across all 603 spaces of a foundation where two held apps. The
  // nested array is the count that means something, and an un-run apps drain
  // is already reported by omitting the key.
  apps?: DetailApp[];
  service_instances?: DetailServiceInstance[];
  roles?: RoleGrants;
}

export interface DetailOrg {
  guid: string;
  name: string;
  status: string;
  /** Empty when no quota is linked (StOrg.quotaGuid is always-emit). */
  quota_guid: string;
  spaces_count?: number;
  apps_count?: number;
  spaces?: DetailSpace[];
  roles?: RoleGrants;
}

/** Children whose parent is absent from a drain that ran — kept, not dropped. */
export interface DetailOrphans {
  spaces?: DetailSpace[];
  apps?: DetailApp[];
}

export interface DetailTree {
  organizations: DetailOrg[];
  orphans: DetailOrphans;
}

/** Undefined = that drain never ran; present-but-empty = it ran and found nothing. */
export interface DetailTreeInput {
  orgs: StOrg[];
  spaces?: StSpace[];
  apps?: StApp[];
  users?: StUser[];
  serviceInstances?: StServiceInstance[];
  bindings?: StServiceCredentialBinding[];
}

const groupBy = <T>(items: T[], key: (item: T) => string | undefined): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) {
      continue;
    }
    const bucket = groups.get(k);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(k, [item]);
    }
  }
  return groups;
};

/** Adds a scope's grants under the user, merging repeat rows for the same scope. */
const grant = (byScope: Map<string, RoleGrants>, scope: string, username: string, roles: string[]): void => {
  const grants = byScope.get(scope) ?? {};
  grants[username] = [...(grants[username] ?? []), ...roles];
  byScope.set(scope, grants);
};

const roleGrants = (users: StUser[]): { orgs: Map<string, RoleGrants>; spaces: Map<string, RoleGrants> } => {
  const orgs = new Map<string, RoleGrants>();
  const spaces = new Map<string, RoleGrants>();
  for (const user of users) {
    for (const role of user.orgRoles) {
      grant(orgs, role.orgGuid, user.username, role.roles);
    }
    for (const role of user.spaceRoles) {
      grant(spaces, role.spaceGuid, user.username, role.roles);
    }
  }
  return { orgs, spaces };
};

const toDetailApp = (app: StApp, bindings?: Map<string, StServiceCredentialBinding[]>): DetailApp => ({
  guid: app.guid,
  name: app.name,
  state: app.state,
  instances: app.instances,
  ...(app.stackName !== undefined && { stack: app.stackName }),
  ...(app.memory !== undefined && { memory_mb: app.memory }),
  ...(app.diskQuota !== undefined && { disk_mb: app.diskQuota }),
  routes: app.routes.map(route => route.url),
  ...(app.lastRefreshedAt !== undefined && { last_refreshed_at: app.lastRefreshedAt }),
  ...(app._meta?.unavailable?.length && { unavailable: app._meta.unavailable }),
  ...(bindings && {
    service_bindings: (bindings.get(app.guid) ?? []).map(binding => ({
      guid: binding.guid,
      type: binding.type,
      ...(binding.name !== undefined && { name: binding.name }),
      service_instance: {
        guid: binding.serviceInstance.guid,
        ...(binding.serviceInstance.name !== undefined && { name: binding.serviceInstance.name }),
      },
    })),
  }),
});

const toDetailServiceInstance = (instance: StServiceInstance): DetailServiceInstance => ({
  guid: instance.guid,
  name: instance.name,
  type: instance.type,
  ...(instance.servicePlan?.name !== undefined && { plan: instance.servicePlan.name }),
  ...(instance.servicePlan?.serviceOffering?.name !== undefined && {
    offering: instance.servicePlan.serviceOffering.name,
  }),
});

export const buildDetailTree = (input: DetailTreeInput): DetailTree => {
  const { orgs, spaces, apps, users, serviceInstances, bindings } = input;

  const roles = users ? roleGrants(users) : null;
  const bindingsByApp = bindings ? groupBy(bindings, binding => binding.app?.guid) : undefined;
  const instancesBySpace = serviceInstances ? groupBy(serviceInstances, si => si.space.guid) : undefined;
  const appsBySpace = apps ? groupBy(apps, app => app.spaceGuid) : undefined;
  const spacesByOrg = spaces ? groupBy(spaces, space => space.orgGuid) : undefined;

  const toDetailSpace = (space: StSpace): DetailSpace => ({
    guid: space.guid,
    name: space.name,
    ...(space.quotaGuid !== undefined && { quota_guid: space.quotaGuid }),
    ...(appsBySpace && {
      apps: (appsBySpace.get(space.guid) ?? []).map(app => toDetailApp(app, bindingsByApp)),
    }),
    ...(instancesBySpace && {
      service_instances: (instancesBySpace.get(space.guid) ?? []).map(toDetailServiceInstance),
    }),
    ...(roles?.spaces.has(space.guid) && { roles: roles.spaces.get(space.guid) }),
  });

  const organizations = orgs.map(org => ({
    guid: org.guid,
    name: org.name,
    status: org.status,
    quota_guid: org.quotaGuid,
    ...(org.spacesCount !== undefined && { spaces_count: org.spacesCount }),
    ...(org.appsCount !== undefined && { apps_count: org.appsCount }),
    ...(spacesByOrg && { spaces: (spacesByOrg.get(org.guid) ?? []).map(toDetailSpace) }),
    ...(roles?.orgs.has(org.guid) && { roles: roles.orgs.get(org.guid) }),
  }));

  const orgGuids = new Set(orgs.map(org => org.guid));
  const spaceGuids = new Set((spaces ?? []).map(space => space.guid));
  const orphans: DetailOrphans = {
    ...(spaces && { spaces: spaces.filter(space => !orgGuids.has(space.orgGuid)).map(toDetailSpace) }),
    // Orphan apps can only be named when the spaces drain ran; without it every
    // app would look orphaned, which says nothing about the foundation.
    ...(apps &&
      spaces && {
        apps: apps.filter(app => !spaceGuids.has(app.spaceGuid)).map(app => toDetailApp(app, bindingsByApp)),
      }),
  };

  return { organizations, orphans };
};
