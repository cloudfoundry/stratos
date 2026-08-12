import { describe, expect, it } from 'vitest';

import { diffDetailExports, parseImportedDetail } from './detail-diff';
import { DetailExport } from './detail-export';
import { DetailApp, DetailOrg, DetailSpace } from './detail-shape';

const T = '2026-08-12T10:00:00.000Z';
const T2 = '2026-08-12T11:00:00.000Z';

const side = (over: Partial<DetailExport> = {}): DetailExport => ({
  schema_version: 1,
  mode: 'detail',
  endpoint: { guid: 'cf-1', name: 'lab' },
  collected_at: T,
  coverage_note: 'note',
  drains: { orgs: T, spaces: T, apps: T },
  totals: {},
  organizations: [],
  orphans: {},
  ...over,
});

const anOrg = (guid: string, name: string, over: Partial<DetailOrg> = {}): DetailOrg => ({
  guid,
  name,
  status: 'active',
  quota_guid: '',
  ...over,
});

const aSpace = (guid: string, name: string, over: Partial<DetailSpace> = {}): DetailSpace => ({
  guid,
  name,
  ...over,
});

const anApp = (guid: string, name: string, over: Partial<DetailApp> = {}): DetailApp => ({
  guid,
  name,
  state: 'STARTED',
  instances: 1,
  routes: [],
  ...over,
});

const level = (diff: ReturnType<typeof diffDetailExports>, key: string) => {
  const found = diff.levels.find(l => l.key === key);
  expect(found, `level ${key}`).toBeDefined();
  return found as NonNullable<typeof found>;
};

describe('diffDetailExports', () => {
  it('records both sides and their collection times', () => {
    const diff = diffDetailExports(side(), side({ collected_at: T2 }));
    expect(diff.sides).toEqual([
      { name: 'lab', collected_at: T },
      { name: 'lab', collected_at: T2 },
    ]);
  });

  it('reports orgs added and removed by guid, with names', () => {
    const before = side({ organizations: [anOrg('o1', 'kept'), anOrg('o2', 'zz-deltest-cascade')] });
    const after = side({ organizations: [anOrg('o1', 'kept'), anOrg('o3', 'payments-prod')] });
    const orgs = level(diffDetailExports(before, after), 'organizations');
    expect(orgs.added).toEqual([{ guid: 'o3', name: 'payments-prod' }]);
    expect(orgs.removed).toEqual([{ guid: 'o2', name: 'zz-deltest-cascade' }]);
    expect(orgs.unchanged).toBe(1);
  });

  it('reports a rename and field changes on the same guid', () => {
    const before = side({ organizations: [anOrg('o1', 'old-name', { status: 'active', quota_guid: 'q1' })] });
    const after = side({ organizations: [anOrg('o1', 'new-name', { status: 'suspended', quota_guid: 'q2' })] });
    const orgs = level(diffDetailExports(before, after), 'organizations');
    expect(orgs.changed).toEqual([
      {
        guid: 'o1',
        name: 'new-name',
        changes: [
          { field: 'name', before: 'old-name', after: 'new-name' },
          { field: 'status', before: 'active', after: 'suspended' },
          { field: 'quota', before: 'q1', after: 'q2' },
        ],
      },
    ]);
    expect(orgs.unchanged).toBe(0);
  });

  it('marks a level unmeasured when either side never ran its drain, and diffs nothing there', () => {
    const before = side({
      drains: { orgs: T, spaces: T, apps: null },
      organizations: [anOrg('o1', 'org', { spaces: [aSpace('s1', 'space')] })],
    });
    const after = side({
      drains: { orgs: T, spaces: null, apps: null },
      organizations: [anOrg('o1', 'org')],
    });
    const diff = diffDetailExports(before, after);
    const spaces = level(diff, 'spaces');
    expect(spaces.measured).toEqual([true, false]);
    expect(spaces.added).toEqual([]);
    expect(spaces.removed).toEqual([]);
    const apps = level(diff, 'apps');
    expect(apps.measured).toEqual([false, false]);
  });

  it('carries the parent path on nested entries and reports moves as a parent change', () => {
    const before = side({
      organizations: [
        anOrg('o1', 'org-a', { spaces: [aSpace('s1', 'dev', { apps: [anApp('a1', 'api')] })] }),
        anOrg('o2', 'org-b', { spaces: [] }),
      ],
    });
    const after = side({
      organizations: [
        anOrg('o1', 'org-a', { spaces: [] }),
        anOrg('o2', 'org-b', { spaces: [aSpace('s1', 'dev', { apps: [anApp('a1', 'api')] })] }),
      ],
    });
    const diff = diffDetailExports(before, after);
    expect(level(diff, 'spaces').changed).toEqual([
      { guid: 's1', name: 'dev', path: 'org-b', changes: [{ field: 'parent', before: 'org-a', after: 'org-b' }] },
    ]);
    // The app stayed in the same space — the move is the space's, not the app's.
    expect(level(diff, 'apps').changed).toEqual([]);
    expect(level(diff, 'apps').unchanged).toBe(1);
  });

  it('does not cascade a parent rename onto children that did not move', () => {
    const tree = (orgName: string): DetailOrg[] => [
      anOrg('o1', orgName, { spaces: [aSpace('s1', 'dev', { apps: [anApp('a1', 'api')] })] }),
    ];
    const diff = diffDetailExports(side({ organizations: tree('old-org') }), side({ organizations: tree('new-org') }));
    expect(level(diff, 'organizations').changed).toHaveLength(1);
    expect(level(diff, 'spaces').changed).toEqual([]);
    expect(level(diff, 'spaces').unchanged).toBe(1);
    expect(level(diff, 'apps').changed).toEqual([]);
    expect(level(diff, 'apps').unchanged).toBe(1);
  });

  it('diffs app scalar fields and routes', () => {
    const wrap = (app: DetailApp): DetailOrg[] => [
      anOrg('o1', 'org', { spaces: [aSpace('s1', 'space', { apps: [app] })] }),
    ];
    const before = side({
      organizations: wrap(anApp('a1', 'api', { state: 'STOPPED', instances: 1, memory_mb: 256, routes: ['api.old.io'] })),
    });
    const after = side({
      organizations: wrap(anApp('a1', 'api', { state: 'STARTED', instances: 3, memory_mb: 512, routes: ['api.new.io'] })),
    });
    const apps = level(diffDetailExports(before, after), 'apps');
    expect(apps.changed[0].changes).toEqual([
      { field: 'state', before: 'STOPPED', after: 'STARTED' },
      { field: 'instances', before: '1', after: '3' },
      { field: 'memory', before: '256M', after: '512M' },
      { field: 'routes', before: 'api.old.io', after: 'api.new.io' },
    ]);
  });

  it('shows a field the side did not compose as a dash, not a change to nothing', () => {
    const wrap = (app: DetailApp): DetailOrg[] => [
      anOrg('o1', 'org', { spaces: [aSpace('s1', 'space', { apps: [app] })] }),
    ];
    const before = side({ organizations: wrap(anApp('a1', 'api', {})) });
    const after = side({ organizations: wrap(anApp('a1', 'api', { memory_mb: 512 })) });
    const apps = level(diffDetailExports(before, after), 'apps');
    expect(apps.changed[0].changes).toEqual([{ field: 'memory', before: '—', after: '512M' }]);
  });

  it('diffs service instances and bindings only when the services drain ran on both sides', () => {
    const withServices = (drained: boolean, instances: boolean): DetailExport =>
      side({
        drains: { orgs: T, spaces: T, apps: T, ...(drained && { services: T }) },
        organizations: [
          anOrg('o1', 'org', {
            spaces: [
              aSpace('s1', 'space', {
                ...(drained && {
                  service_instances: instances
                    ? [{ guid: 'si1', name: 'db', type: 'managed', plan: 'small', offering: 'postgres' }]
                    : [],
                }),
                ...(drained && {
                  apps: [
                    anApp('a1', 'api', {
                      service_bindings: instances
                        ? [{ guid: 'b1', type: 'app', service_instance: { guid: 'si1', name: 'db' } }]
                        : [],
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });
    const diff = diffDetailExports(withServices(true, false), withServices(true, true));
    const instances = level(diff, 'service_instances');
    expect(instances.measured).toEqual([true, true]);
    expect(instances.added).toEqual([{ guid: 'si1', name: 'db', path: 'org / space' }]);
    const bindings = level(diff, 'service_bindings');
    expect(bindings.added).toEqual([{ guid: 'b1', name: 'db (app)', path: 'org / space / api' }]);

    const undrained = diffDetailExports(withServices(false, false), withServices(true, true));
    expect(level(undrained, 'service_instances').measured).toEqual([false, true]);
    expect(level(undrained, 'service_instances').added).toEqual([]);
  });

  it('diffs role grants per scope and user', () => {
    const before = side({
      drains: { orgs: T, spaces: T, apps: null, roles: T },
      organizations: [
        anOrg('o1', 'org', {
          roles: { alice: ['organization_manager'], bob: ['organization_user'] },
          spaces: [aSpace('s1', 'space', { roles: { alice: ['space_developer'] } })],
        }),
      ],
    });
    const after = side({
      drains: { orgs: T, spaces: T, apps: null, roles: T },
      organizations: [
        anOrg('o1', 'org', {
          roles: {
            alice: ['organization_manager', 'organization_user'],
            bob: ['organization_user'],
            carol: ['organization_user'],
          },
          spaces: [aSpace('s1', 'space')],
        }),
      ],
    });
    const roles = level(diffDetailExports(before, after), 'roles');
    expect(roles.measured).toEqual([true, true]);
    expect(roles.added).toEqual([{ guid: 'o1:carol', name: 'carol', path: 'org' }]);
    expect(roles.removed).toEqual([{ guid: 's1:alice', name: 'alice', path: 'org / space' }]);
    expect(roles.changed).toEqual([
      {
        guid: 'o1:alice',
        name: 'alice',
        path: 'org',
        changes: [
          { field: 'roles', before: 'organization_manager', after: 'organization_manager, organization_user' },
        ],
      },
    ]);
    expect(roles.unchanged).toBe(1);
  });

  it('marks roles unmeasured when the measure never ran', () => {
    const roles = level(diffDetailExports(side(), side()), 'roles');
    expect(roles.measured).toEqual([false, false]);
  });

  it('includes orphaned entries under an (orphaned) path', () => {
    const before = side();
    const after = side({ orphans: { spaces: [aSpace('s9', 'stray')] } });
    const spaces = level(diffDetailExports(before, after), 'spaces');
    expect(spaces.added).toEqual([{ guid: 's9', name: 'stray', path: '(orphaned)' }]);
  });

  it('warns when the sides come from different endpoints', () => {
    const other = side({ endpoint: { guid: 'cf-2', name: 'aws' } });
    const diff = diffDetailExports(side(), other);
    expect(diff.warnings.some(w => w.includes('different endpoints'))).toBe(true);
    expect(diffDetailExports(side(), side()).warnings).toEqual([]);
  });

  it('warns when a side carries a truncated dataset', () => {
    const truncated = side({ drains: { orgs: T, spaces: T, apps: T, services: T }, truncated: ['service_instances'] });
    const diff = diffDetailExports(truncated, side({ drains: { orgs: T, spaces: T, apps: T, services: T } }));
    expect(diff.warnings.some(w => w.includes('service_instances') && w.includes('lab'))).toBe(true);
  });

  it('sorts every bucket by path then name', () => {
    const before = side({ organizations: [] });
    const after = side({
      organizations: [anOrg('o2', 'zeta'), anOrg('o1', 'alpha')],
    });
    const orgs = level(diffDetailExports(before, after), 'organizations');
    expect(orgs.added.map(entry => entry.name)).toEqual(['alpha', 'zeta']);
  });
});

describe('parseImportedDetail', () => {
  it('accepts a detail export and defaults optional blocks', () => {
    const raw = JSON.stringify({ ...side(), orphans: undefined });
    const { exported, error } = parseImportedDetail(raw);
    expect(error).toBeUndefined();
    expect(exported?.orphans).toEqual({});
  });

  it('rejects non-JSON, non-detail and unversioned files with reasons', () => {
    expect(parseImportedDetail('nope').error).toBe('not valid JSON');
    expect(parseImportedDetail('42').error).toBe('not a detail export');
    expect(parseImportedDetail(JSON.stringify({ schema_version: 2, mode: 'detail' })).error).toContain(
      'schema_version'
    );
    expect(parseImportedDetail(JSON.stringify({ ...side(), mode: 'anonymous' })).error).toContain(
      'anonymous shape export'
    );
    expect(parseImportedDetail(JSON.stringify({ schema_version: 1, mode: 'detail' })).error).toBe(
      'missing organizations'
    );
  });
});
