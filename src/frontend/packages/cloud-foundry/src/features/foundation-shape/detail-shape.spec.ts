import { describe, expect, it } from 'vitest';

import { buildDetailTree } from './detail-shape';
import { app, binding, org, serviceInstance, space, user } from './testing/entity-builders';

const orgs = [org('o1'), org('o2')];
const spaces = [space('s1', 'o1'), space('s2', 'o1')];
const apps = [
  app('a1', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, diskQuota: 1024, stackName: 'cflinuxfs4' }),
  app('a2', { spaceGuid: 's2', orgGuid: 'o1', state: 'STOPPED', routes: [{ guid: 'r1', url: 'a2.example.com' }] }),
];

describe('buildDetailTree', () => {
  it('nests orgs → spaces → apps with names, guids and quota links', () => {
    const tree = buildDetailTree({
      orgs: [{ ...org('o1'), quotaGuid: 'q-org', spacesCount: 2, appsCount: 2 }],
      spaces: [{ ...space('s1', 'o1'), quotaGuid: 'q-space', appCount: 1, routeCount: 3 }],
      apps: [apps[0]],
    });

    expect(tree.organizations).toHaveLength(1);
    const [organization] = tree.organizations;
    expect(organization).toMatchObject({ guid: 'o1', name: 'org-o1', quota_guid: 'q-org', spaces_count: 2, apps_count: 2 });
    expect(organization.spaces).toHaveLength(1);
    expect(organization.spaces?.[0]).toMatchObject({ guid: 's1', name: 'space-s1', quota_guid: 'q-space', app_count: 1, route_count: 3 });
    expect(organization.spaces?.[0].apps?.[0]).toMatchObject({
      guid: 'a1',
      name: 'app-a1',
      state: 'STARTED',
      instances: 1,
      stack: 'cflinuxfs4',
      memory_mb: 256,
      disk_mb: 1024,
      routes: [],
    });
  });

  it('omits a level entirely when its drain never ran', () => {
    const noSpaces = buildDetailTree({ orgs });
    expect(noSpaces.organizations[0]).not.toHaveProperty('spaces');
    expect(noSpaces.orphans).toEqual({});

    const noApps = buildDetailTree({ orgs, spaces });
    expect(noApps.organizations[0].spaces?.[0]).not.toHaveProperty('apps');
    expect(noApps.orphans).toEqual({ spaces: [] });
  });

  it('distinguishes a drained-but-empty level from one that never ran', () => {
    const tree = buildDetailTree({ orgs, spaces, apps: [] });
    expect(tree.organizations[0].spaces?.[0].apps).toEqual([]);
  });

  it('keeps a space whose org is missing, and an app whose space is missing', () => {
    const tree = buildDetailTree({
      orgs: [org('o1')],
      spaces: [space('s1', 'o1'), space('s9', 'o-gone')],
      apps: [apps[0], app('a9', { spaceGuid: 's-gone' })],
    });

    expect(tree.organizations[0].spaces?.map(s => s.guid)).toEqual(['s1']);
    expect(tree.orphans.spaces?.map(s => s.guid)).toEqual(['s9']);
    expect(tree.orphans.apps?.map(a => a.guid)).toEqual(['a9']);
  });

  it('does not call apps orphaned when the spaces drain never ran', () => {
    const tree = buildDetailTree({ orgs, apps });
    expect(tree.orphans).not.toHaveProperty('apps');
  });

  it('places an app of an orphaned space under that space, not in orphans.apps', () => {
    const tree = buildDetailTree({
      orgs: [org('o1')],
      spaces: [space('s9', 'o-gone')],
      apps: [app('a9', { spaceGuid: 's9' })],
    });

    expect(tree.orphans.spaces?.[0].apps?.map(a => a.guid)).toEqual(['a9']);
    expect(tree.orphans.apps).toEqual([]);
  });

  it('folds measured roles onto the org and space that granted them', () => {
    const tree = buildDetailTree({
      orgs,
      spaces,
      users: [
        user('alice', {
          orgRoles: [{ orgGuid: 'o1', roles: ['org_manager'] }],
          spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['space_developer'] }],
        }),
        user('bob', { orgRoles: [{ orgGuid: 'o1', roles: ['org_auditor'] }] }),
      ],
    });

    expect(tree.organizations[0].roles).toEqual({ alice: ['org_manager'], bob: ['org_auditor'] });
    expect(tree.organizations[0].spaces?.[0].roles).toEqual({ alice: ['space_developer'] });
    // o2 granted nothing — no empty roles object pretending otherwise.
    expect(tree.organizations[1]).not.toHaveProperty('roles');
    expect(tree.organizations[0].spaces?.[1]).not.toHaveProperty('roles');
  });

  it('attaches service instances to their space and bindings to their app', () => {
    const tree = buildDetailTree({
      orgs,
      spaces,
      apps,
      serviceInstances: [
        serviceInstance('si1', 's1', { servicePlan: { guid: 'p1', name: 'small', serviceOffering: { guid: 'off1', name: 'postgres' } } }),
      ],
      bindings: [binding('b1', 'a1', 'si1')],
    });

    const space1 = tree.organizations[0].spaces?.[0];
    expect(space1?.service_instances).toEqual([{ guid: 'si1', name: 'si-si1', type: 'managed', plan: 'small', offering: 'postgres' }]);
    expect(space1?.apps?.[0].service_bindings).toEqual([
      { guid: 'b1', type: 'app', service_instance: { guid: 'si1', name: 'si-si1' } },
    ]);
    expect(tree.organizations[0].spaces?.[1].apps?.[0].service_bindings).toEqual([]);
  });

  it('surfaces the fields the backend could not compose, and omits absent ones', () => {
    const tree = buildDetailTree({
      orgs: [org('o1')],
      spaces: [space('s1', 'o1')],
      apps: [app('a1', { spaceGuid: 's1', _meta: { unavailable: ['memory', 'stackName'] } })],
    });

    const detailApp = tree.organizations[0].spaces?.[0].apps?.[0];
    expect(detailApp?.unavailable).toEqual(['memory', 'stackName']);
    expect(detailApp).not.toHaveProperty('memory_mb');
    expect(detailApp).not.toHaveProperty('stack');
  });
});
