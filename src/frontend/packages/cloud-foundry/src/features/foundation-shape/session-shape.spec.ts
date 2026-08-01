import { describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { app, org, space } from './testing/entity-builders';

// 3 orgs (one empty), 3 spaces (2 in o1, 1 in o2, none in o3), 3 apps.
const ORGS = [org('o1'), org('o2'), org('o3')];
const SPACES = [space('s1', 'o1'), space('s2', 'o1'), space('s3', 'o2')];
const APPS = [
  app('a1', {
    spaceGuid: 's1', orgGuid: 'o1', state: 'STARTED', stackName: 'cflinuxfs4',
    memory: 256, diskQuota: 1024, instances: 1,
    routes: [{ guid: 'r1', url: 'a1.example.com' }],
  }),
  app('a2', {
    spaceGuid: 's1', orgGuid: 'o1', state: 'STOPPED', stackName: 'cflinuxfs4',
    memory: 64, instances: 2, // diskQuota deliberately absent (tristate)
  }),
  app('a3', {
    spaceGuid: 's3', orgGuid: 'o2', state: 'STARTED', stackName: 'cflinuxfs3',
    diskQuota: 512, instances: 1, // memory deliberately absent (tristate)
    routes: [{ guid: 'r2', url: 'a3.example.com' }, { guid: 'r3', url: 'a3-alt.example.com' }],
  }),
];

describe('computeSessionShape distributions', () => {
  const shape = computeSessionShape(ORGS, SPACES, APPS);

  it('groups spaces per org and zero-fills empty orgs', () => {
    expect(shape.distributions.spaces_per_org).toEqual({
      n: 3, min: 0, median: 1, p90: 2, p99: 2, max: 2,
      mean: 1.0, zeros: 1, sum: 3, hist: { '0': 1, '1': 1, '2': 1 },
    });
  });

  it('groups apps per space and zero-fills empty spaces', () => {
    expect(shape.distributions.apps_per_space).toEqual({
      n: 3, min: 0, median: 1, p90: 2, p99: 2, max: 2,
      mean: 1.0, zeros: 1, sum: 3, hist: { '0': 1, '1': 1, '2': 1 },
    });
  });

  it('groups apps per org and zero-fills empty orgs', () => {
    expect(shape.distributions.apps_per_org).toEqual({
      n: 3, min: 0, median: 1, p90: 2, p99: 2, max: 2,
      mean: 1.0, zeros: 1, sum: 3, hist: { '0': 1, '1': 1, '2': 1 },
    });
  });

  it('counts routes per app across all apps', () => {
    expect(shape.distributions.routes_per_app).toEqual({
      n: 3, min: 0, median: 1, p90: 2, p99: 2, max: 2,
      mean: 1.0, zeros: 1, sum: 3, hist: { '0': 1, '1': 1, '2': 1 },
    });
  });

  it('reports top-share concentration against full totals', () => {
    expect(shape.distributions.top_share).toEqual({
      spaces_in_largest_org: { largest_holds: 2, fraction: 0.6667 },
      apps_in_largest_space: { largest_holds: 2, fraction: 0.6667 },
      apps_in_largest_org: { largest_holds: 2, fraction: 0.6667 },
    });
  });
});

describe('computeSessionShape composition', () => {
  const shape = computeSessionShape(ORGS, SPACES, APPS);

  it('tallies app states', () => {
    expect(shape.composition.app_state).toEqual({ STARTED: 2, STOPPED: 1 });
  });

  it('tallies stacks pinned by apps', () => {
    expect(shape.composition.stacks_pinned_by_apps).toEqual({ cflinuxfs4: 2, cflinuxfs3: 1 });
  });

  it('summarizes memory over apps that report it, without zero-filling absentees', () => {
    expect(shape.composition.web_process_memory_mb).toEqual({
      n: 2, min: 64, median: 160, p90: 256, p99: 256, max: 256,
      mean: 160, zeros: 0, sum: 320, hist: { '64': 1, '256': 1 },
    });
  });

  it('summarizes disk over apps that report it, without zero-filling absentees', () => {
    expect(shape.composition.web_process_disk_mb).toEqual({
      n: 2, min: 512, median: 768, p90: 1024, p99: 1024, max: 1024,
      mean: 768, zeros: 0, sum: 1536, hist: { '512': 1, '1024': 1 },
    });
  });

  it('summarizes instance counts over all apps', () => {
    expect(shape.composition.web_process_instances).toEqual({
      n: 3, min: 1, median: 1, p90: 2, p99: 2, max: 2,
      mean: 1.333, zeros: 0, sum: 4, hist: { '1': 2, '2': 1 },
    });
  });
});

describe('computeSessionShape edge cases', () => {
  it('returns null distributions and empty tallies for an empty session', () => {
    const shape = computeSessionShape([], [], []);
    expect(shape.distributions.spaces_per_org).toBeNull();
    expect(shape.distributions.apps_per_space).toBeNull();
    expect(shape.distributions.routes_per_app).toBeNull();
    expect(shape.distributions.top_share.spaces_in_largest_org).toBeNull();
    expect(shape.composition.app_state).toEqual({});
    expect(shape.composition.web_process_memory_mb).toBeNull();
  });

  it('excludes apps without an org attribution from per-org grouping only', () => {
    const orphan = app('a4', { spaceGuid: 's2', state: 'STARTED', instances: 1 }); // no orgGuid
    const shape = computeSessionShape(ORGS, SPACES, [...APPS, orphan]);
    expect(shape.distributions.apps_per_org?.sum).toBe(3);
    expect(shape.distributions.apps_per_space?.sum).toBe(4);
  });
});
