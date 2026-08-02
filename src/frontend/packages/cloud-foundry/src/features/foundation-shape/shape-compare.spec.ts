import { describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { AgnosticExport, buildAgnosticExport } from './shape-export';
import { compareExports, parseImportedExport } from './shape-compare';
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

describe('compareExports', () => {
  it('labels the sides in order and unions totals keys, keeping one-sided keys visible', () => {
    const comparison = compareExports([
      { label: 'lab', exported: exportOf(A_APPS) },
      { label: 'aws', exported: exportOf(B_APPS, { totals: { organizations: 5, quotas: 7 } }) },
    ]);
    expect(comparison.sides.map(s => s.label)).toEqual(['lab', 'aws']);
    expect(comparison.totals.find(row => row.key === 'organizations')?.values).toEqual([2, 5]);
    // quotas was measured on the second side only: the first stays undefined, not 0
    expect(comparison.totals.find(row => row.key === 'quotas')?.values).toEqual([undefined, 7]);
  });

  it('keeps measured-but-empty (null) distinct from never-measured (absent)', () => {
    const a = exportOf([]); // apps drained, none exist: routes_per_app is null
    const b = exportOf(B_APPS);
    delete b.distributions.spaces_per_org; // never measured on b
    const comparison = compareExports([
      { label: 'a', exported: a },
      { label: 'b', exported: b },
    ]);
    const routes = comparison.distributions.find(row => row.key === 'routes_per_app');
    expect(routes?.values[0]).toBeNull();
    expect(routes?.values[1]).toMatchObject({ n: 2 });
    const spaces = comparison.distributions.find(row => row.key === 'spaces_per_org');
    expect(spaces?.values[0]).toMatchObject({ n: 2 });
    expect(spaces?.values[1]).toBeUndefined();
  });

  it('diffs categorical dimensions as counts and shares, zero-filling missing categories', () => {
    const comparison = compareExports([
      { label: 'a', exported: exportOf(A_APPS) },
      { label: 'b', exported: exportOf(B_APPS) },
    ]);
    const stacks = comparison.categorical.find(c => c.dimension === 'stacks_pinned_by_apps');
    expect(stacks?.rows).toContainEqual({ category: 'cflinuxfs3', counts: [1, 0], shares: [0.5, 0] });
    expect(stacks?.rows).toContainEqual({ category: 'cflinuxfs4', counts: [1, 2], shares: [0.5, 1] });
    const states = comparison.categorical.find(c => c.dimension === 'app_state');
    expect(states?.rows).toContainEqual({ category: 'STOPPED', counts: [1, 0], shares: [0.5, 0] });
  });

  it('marks an unmeasured dimension side undefined instead of zero-filling it', () => {
    const b = exportOf(B_APPS);
    delete b.composition.app_state;
    const comparison = compareExports([
      { label: 'a', exported: exportOf(A_APPS) },
      { label: 'b', exported: b },
    ]);
    const states = comparison.categorical.find(c => c.dimension === 'app_state');
    const started = states?.rows.find(row => row.category === 'STARTED');
    expect(started?.counts).toEqual([1, undefined]);
    expect(started?.shares).toEqual([0.5, undefined]);
  });

  it('builds a presence matrix over defined lists with multiset multiplicity', () => {
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
    const comparison = compareExports([
      { label: 'a', exported: a },
      { label: 'b', exported: b },
    ]);
    const stacks = comparison.lists.find(l => l.key === 'stacks_defined');
    expect(stacks?.measured).toEqual([true, true]);
    expect(stacks?.rows).toContainEqual({ label: 'cflinuxfs3', present: [true, false] });
    expect(stacks?.rows).toContainEqual({ label: 'cflinuxfs4', present: [true, true] });
    const buildpacks = comparison.lists.find(l => l.key === 'buildpacks_defined');
    expect(buildpacks?.rows).toContainEqual({ label: 'ruby_buildpack', present: [true, false] });
    expect(buildpacks?.rows).toContainEqual({ label: 'ruby_buildpack ×2', present: [false, true] });
    expect(buildpacks?.rows).toContainEqual({ label: 'go_buildpack', present: [true, false] });
    expect(buildpacks?.rows).toContainEqual({ label: 'java_buildpack', present: [false, true] });
  });

  it('flags a side that never measured a list instead of treating it as empty', () => {
    const comparison = compareExports([
      { label: 'a', exported: exportOf(A_APPS, { composition: { stacks_defined: ['cflinuxfs4'] } }) },
      { label: 'b', exported: exportOf(B_APPS) },
    ]);
    const stacks = comparison.lists.find(l => l.key === 'stacks_defined');
    expect(stacks?.measured).toEqual([true, false]);
  });

  it('carries top-share values through per side', () => {
    const comparison = compareExports([
      { label: 'a', exported: exportOf(A_APPS) },
      { label: 'b', exported: exportOf(B_APPS) },
    ]);
    const row = comparison.topShare.find(r => r.key === 'apps_in_largest_space');
    expect(row?.values).toEqual([
      { largest_holds: 2, fraction: 1 },
      { largest_holds: 2, fraction: 1 },
    ]);
  });

  it('compares three sides with index-aligned values', () => {
    const comparison = compareExports([
      { label: 'dev', exported: exportOf(A_APPS) },
      { label: 'staging', exported: exportOf(B_APPS) },
      { label: 'prod', exported: exportOf([]) },
    ]);
    expect(comparison.sides).toHaveLength(3);
    expect(comparison.totals.find(row => row.key === 'apps')?.values).toEqual([2, 2, 0]);
    const stacks = comparison.categorical.find(c => c.dimension === 'stacks_pinned_by_apps');
    expect(stacks?.rows.find(r => r.category === 'cflinuxfs4')?.counts).toEqual([1, 2, 0]);
  });
});

describe('parseImportedExport', () => {
  it('round-trips a real export into a comparison side', () => {
    const { exported, error } = parseImportedExport(JSON.stringify(exportOf(A_APPS)));
    expect(error).toBeUndefined();
    expect(exported?.schema_version).toBe(1);
    const comparison = compareExports([
      { label: 'file', exported: exported as AgnosticExport },
      { label: 'live', exported: exportOf(B_APPS) },
    ]);
    expect(comparison.totals.length).toBeGreaterThan(0);
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
    const comparison = compareExports([
      { label: 'file', exported: exported as AgnosticExport },
      { label: 'live', exported: exportOf(B_APPS) },
    ]);
    expect(comparison.totals.length).toBeGreaterThan(0);
  });
});
