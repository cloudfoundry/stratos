import { describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { buildAgnosticExport, COVERAGE_NOTE, exportMarkdown } from './shape-export';
import { app, org, space } from './testing/entity-builders';

const ORGS = [org('o1'), org('o2')];
const SPACES = [space('s1', 'o1')];
const APPS = [
  app('a1', { spaceGuid: 's1', orgGuid: 'o1', memory: 256, diskQuota: 1024, stackName: 'cflinuxfs4' }),
];

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

const ALL_DRAINS = { counts: true, orgs: true, spaces: true, apps: true };

const baseInput = () => ({
  shape: computeSessionShape(ORGS, SPACES, APPS),
  sessionTotals: SESSION_TOTALS,
  drains: ALL_DRAINS,
  collectedAt: new Date('2026-08-01T12:00:00Z'),
});

describe('buildAgnosticExport', () => {
  it('emits the schema_version 1 envelope with the standing coverage note', () => {
    const exported = buildAgnosticExport(baseInput());
    expect(exported.schema_version).toBe(1);
    expect(exported.collected_at).toBe('2026-08-01T12:00:00.000Z');
    expect(exported.coverage_note).toBe(COVERAGE_NOTE);
    expect(exported.foundation_label).toBe('');
  });

  it('maps session totals to schema names, service instances stated as combined', () => {
    const exported = buildAgnosticExport(baseInput());
    expect(exported.totals).toEqual({
      organizations: 2,
      spaces: 1,
      apps: 1,
      routes: 5,
      service_instances: 3,
      service_offerings: 4,
      service_plans: 6,
      service_brokers: 1,
    });
  });

  it('carries the session distributions and top-share', () => {
    const exported = buildAgnosticExport(baseInput());
    expect(exported.distributions.spaces_per_org).toMatchObject({ n: 2, sum: 1, zeros: 1 });
    expect(exported.distributions.top_share.apps_in_largest_space).toEqual({ largest_holds: 1, fraction: 1 });
    expect(exported.composition.stacks_pinned_by_apps).toEqual({ cflinuxfs4: 1 });
    expect(exported.composition.web_process_memory_mb).toMatchObject({ n: 1, sum: 256 });
  });

  it('omits everything a never-run drain would misstate', () => {
    const input = baseInput();
    input.drains = { counts: true, orgs: true, spaces: false, apps: false };
    input.sessionTotals = { ...SESSION_TOTALS, spaces: null };
    const exported = buildAgnosticExport(input);
    // spaces total needs the spaces drain; apps/routes come from fast counts
    expect(exported.totals).not.toHaveProperty('spaces');
    expect(exported.totals.apps).toBe(1);
    expect(exported.totals.organizations).toBe(2);
    // every distribution touching an un-drained population is omitted
    expect(exported.distributions).not.toHaveProperty('spaces_per_org');
    expect(exported.distributions).not.toHaveProperty('apps_per_space');
    expect(exported.distributions).not.toHaveProperty('apps_per_org');
    expect(exported.distributions).not.toHaveProperty('routes_per_app');
    expect(exported.composition).not.toHaveProperty('app_state');
    expect(exported.composition).not.toHaveProperty('web_process_memory_mb');
  });

  it('records a drained-but-empty distribution as null, distinct from omission', () => {
    const input = baseInput();
    input.shape = computeSessionShape(ORGS, SPACES, []);
    input.sessionTotals = { ...SESSION_TOTALS, apps: 0 };
    const exported = buildAgnosticExport(input);
    expect(exported.distributions).toHaveProperty('routes_per_app');
    expect(exported.distributions.routes_per_app).toBeNull();
  });

  it('merges measured ecosystem totals, skipping failed probes', () => {
    const input = {
      ...baseInput(),
      measuredTotals: {
        counts: { buildpacks: 24, stacks: 2, security_groups: null, users: 14 },
        fetchedAt: new Date(),
      },
    };
    const exported = buildAgnosticExport(input);
    expect(exported.totals.buildpacks).toBe(24);
    expect(exported.totals.users).toBe(14);
    expect(exported.totals).not.toHaveProperty('security_groups');
  });

  it('includes definition lists only when measured', () => {
    expect(buildAgnosticExport(baseInput()).composition).not.toHaveProperty('stacks_defined');
    const input = {
      ...baseInput(),
      measuredEcosystem: {
        stacksDefined: ['cflinuxfs4', 'cflinuxfs3'],
        buildpacksDefined: ['ruby_buildpack', 'ruby_buildpack'],
        fetchedAt: new Date(),
      },
    };
    const exported = buildAgnosticExport(input);
    expect(exported.composition.stacks_defined).toEqual(['cflinuxfs4', 'cflinuxfs3']);
    expect(exported.composition.buildpacks_defined).toEqual(['ruby_buildpack', 'ruby_buildpack']);
  });
});

describe('exportMarkdown', () => {
  it('renders totals and distribution tables with the coverage note', () => {
    const markdown = exportMarkdown(buildAgnosticExport(baseInput()));
    expect(markdown).toContain('| organizations | 2 |');
    expect(markdown).toContain('| metric | min | median | p90 | p99 | max | mean | zeros | n |');
    expect(markdown).toContain('| spaces_per_org | 0 | 0.5 | 1 | 1 | 1 | 0.5 | 1 | 2 |');
    expect(markdown).toContain(COVERAGE_NOTE);
  });
});
