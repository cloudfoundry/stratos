import { describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { AgnosticExport, buildAgnosticExport } from './shape-export';
import { compareExports, parseImportedExport, ShapeComparison } from './shape-compare';
import { app, org, space } from './testing/entity-builders';

const SESSION_TOTALS = {
  orgs: 2,
  spaces: 1 as number | null,
  apps: 1,
  routes: 5,
  serviceInstances: 3,
  serviceOfferings: 4,
  servicePlans: 6,
  serviceBrokers: 1,
};

const ALL_DRAINS = { counts: true, servicesCounts: true, orgs: true, spaces: true, apps: true };

const exportOf = (apps: ReturnType<typeof app>[], overrides: Partial<AgnosticExport> = {}): AgnosticExport => ({
  ...buildAgnosticExport({
    shape: computeSessionShape([org('o1'), org('o2')], [space('s1', 'o1')], apps),
    sessionTotals: { ...SESSION_TOTALS, apps: apps.length },
    drains: ALL_DRAINS,
    collectedAt: new Date('2026-08-01T12:00:00Z'),
  }),
  ...overrides,
});

const A_APPS = [
  app('a1', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, stackName: 'cflinuxfs3' }),
  app('a2', { spaceGuid: 's1', orgGuid: 'o1', memory: 512, stackName: 'cflinuxfs4', state: 'STOPPED' }),
];
const B_APPS = [
  app('b1', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, stackName: 'cflinuxfs4' }),
  app('b2', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, stackName: 'cflinuxfs4' }),
];

const compare = (a: AgnosticExport, b: AgnosticExport): ShapeComparison =>
  compareExports({ label: 'lab', exported: a }, { label: 'aws', exported: b });

describe('compareExports', () => {
  it('labels both sides and unions totals keys, keeping one-sided keys visible', () => {
    const a = exportOf(A_APPS);
    const b = exportOf(B_APPS, { totals: { organizations: 5, quotas: 7 } });
    const comparison = compare(a, b);
    expect(comparison.a).toEqual({ label: 'lab', collectedAt: '2026-08-01T12:00:00.000Z' });
    const orgsRow = comparison.totals.find(row => row.key === 'organizations');
    expect(orgsRow).toEqual({ key: 'organizations', a: 2, b: 5 });
    // quotas was measured on b only: the a side stays undefined, not 0
    const quotasRow = comparison.totals.find(row => row.key === 'quotas');
    expect(quotasRow).toEqual({ key: 'quotas', b: 7 });
    expect(quotasRow && 'a' in quotasRow).toBe(false);
  });

  it('keeps measured-but-empty (null) distinct from never-measured (absent)', () => {
    const a = exportOf([]); // apps drained, none exist: routes_per_app is null
    const b = exportOf(B_APPS);
    delete b.distributions.spaces_per_org; // never measured on b
    const comparison = compare(a, b);
    const routes = comparison.distributions.find(row => row.key === 'routes_per_app');
    expect(routes?.a).toBeNull();
    expect(routes?.b).toMatchObject({ n: 2 });
    const spaces = comparison.distributions.find(row => row.key === 'spaces_per_org');
    expect(spaces && 'b' in spaces).toBe(false);
    expect(spaces?.a).toMatchObject({ n: 2 });
  });

  it('diffs categorical dimensions as counts and shares, zero-filling missing categories', () => {
    const comparison = compare(exportOf(A_APPS), exportOf(B_APPS));
    const stacks = comparison.categorical.find(c => c.dimension === 'stacks_pinned_by_apps');
    expect(stacks?.rows).toContainEqual({ category: 'cflinuxfs3', a: 1, aShare: 0.5, b: 0, bShare: 0 });
    expect(stacks?.rows).toContainEqual({ category: 'cflinuxfs4', a: 1, aShare: 0.5, b: 2, bShare: 1 });
    const states = comparison.categorical.find(c => c.dimension === 'app_state');
    expect(states?.rows).toContainEqual({ category: 'STOPPED', a: 1, aShare: 0.5, b: 0, bShare: 0 });
  });

  it('diffs defined lists as added/removed/unchanged with multiset multiplicity', () => {
    const a = exportOf(A_APPS, {
      composition: {
        stacks_defined: ['cflinuxfs3', 'cflinuxfs4'],
        buildpacks_defined: ['ruby_buildpack', 'go_buildpack'],
      },
    });
    const b = exportOf(B_APPS, {
      composition: {
        stacks_defined: ['cflinuxfs4'],
        buildpacks_defined: ['ruby_buildpack', 'ruby_buildpack', 'java_buildpack'],
      },
    });
    const comparison = compare(a, b);
    expect(comparison.lists).toContainEqual({
      key: 'stacks_defined', added: [], removed: ['cflinuxfs3'], unchanged: ['cflinuxfs4'],
    });
    expect(comparison.lists).toContainEqual({
      key: 'buildpacks_defined',
      added: ['ruby_buildpack ×2', 'java_buildpack'],
      removed: ['ruby_buildpack', 'go_buildpack'],
      unchanged: [],
    });
  });

  it('carries top-share pairs through', () => {
    const comparison = compare(exportOf(A_APPS), exportOf(B_APPS));
    const row = comparison.topShare.find(r => r.key === 'apps_in_largest_space');
    expect(row?.a).toEqual({ largest_holds: 2, fraction: 1 });
    expect(row?.b).toEqual({ largest_holds: 2, fraction: 1 });
  });
});

describe('parseImportedExport', () => {
  it('round-trips a real export', () => {
    const { exported, error } = parseImportedExport(JSON.stringify(exportOf(A_APPS)));
    expect(error).toBeUndefined();
    expect(exported?.schema_version).toBe(1);
    expect(compare(exported as AgnosticExport, exportOf(B_APPS)).totals.length).toBeGreaterThan(0);
  });

  it('rejects non-JSON, wrong schema versions, and non-export JSON with reasons', () => {
    expect(parseImportedExport('nope{').error).toBe('not valid JSON');
    expect(parseImportedExport('{"schema_version":2}').error).toContain('schema_version');
    expect(parseImportedExport('{"schema_version":1}').error).toContain('missing totals');
    expect(parseImportedExport('null').error).toBe('not a shape export');
  });

  it('defaults missing top_share and composition so comparison never trips', () => {
    const raw = JSON.stringify({ schema_version: 1, collected_at: 'x', totals: { apps: 1 }, distributions: {} });
    const { exported } = parseImportedExport(raw);
    expect(exported?.distributions.top_share).toEqual({});
    expect(exported?.composition).toEqual({});
    expect(compare(exported as AgnosticExport, exportOf(B_APPS)).totals.length).toBeGreaterThan(0);
  });
});
