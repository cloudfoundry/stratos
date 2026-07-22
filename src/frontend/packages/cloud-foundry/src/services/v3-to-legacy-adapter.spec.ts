import { describe, it, expect } from 'vitest';

import { stToLegacy } from './v3-to-legacy-adapter';
import { IAppSummaryRoute } from '../cf-api.types';
import {
  StAppDetail,
  StAppStat,
  StEnvVars,
} from './endpoint-data/stratos-types';

const fullDetail: StAppDetail = {
  app: {
    guid: 'app-1',
    name: 'my-app',
    state: 'STARTED',
    spaceGuid: 'space-1',
    stackName: 'cflinuxfs4',
    instances: 3,
    memory: 256,
    diskQuota: 1024,
    routes: [{ guid: 'route-1', url: 'my-app.example.com' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    cnsiGuid: 'cnsi-1',
  },
  process: {
    guid: 'proc-1',
    type: 'web',
    instances: 3,
    memoryMb: 256,
    diskMb: 1024,
    logRateLimitInBytesPerSecond: 1048576,
    command: 'bundle exec rails s',
    healthCheckType: 'port',
    healthCheckTimeoutSeconds: 30,
    ports: [8080],
  },
  droplet: {
    guid: 'droplet-1',
    state: 'STAGED',
    lifecycleType: 'buildpack',
    stack: 'cflinuxfs4',
    buildpacks: [{ name: 'ruby_buildpack', detectOutput: 'ruby' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:01:00Z',
  },
  pkg: {
    guid: 'pkg-1',
    state: 'READY',
    type: 'bits',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:30Z',
  },
  build: {
    guid: 'build-1',
    state: 'STAGED',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:01:00Z',
  },
  sshEnabled: true,
};

describe('stToLegacy.appDetail', () => {
  it('maps base StApp fields onto IApp under entity wrapper', () => {
    const legacy = stToLegacy.appDetail(fullDetail);
    expect(legacy).not.toBeNull();
    expect(legacy!.entity.name).toBe('my-app');
    expect(legacy!.entity.guid).toBe('app-1');
    expect(legacy!.entity.cfGuid).toBe('cnsi-1');
    expect(legacy!.entity.space_guid).toBe('space-1');
    expect(legacy!.entity.state).toBe('STARTED');
    expect(legacy!.metadata.guid).toBe('app-1');
  });

  it('lifts process fields into legacy memory/disk/instances', () => {
    const legacy = stToLegacy.appDetail(fullDetail);
    expect(legacy!.entity.memory).toBe(256);
    expect(legacy!.entity.disk_quota).toBe(1024);
    expect(legacy!.entity.instances).toBe(3);
    expect(legacy!.entity.command).toBe('bundle exec rails s');
    expect(legacy!.entity.health_check_type).toBe('port');
    expect(legacy!.entity.health_check_timeout).toBe(30);
    expect(legacy!.entity.ports).toEqual([8080]);
  });

  it('synthesises stack APIResource shape so .stack.entity.name still works', () => {
    const legacy = stToLegacy.appDetail(fullDetail);
    expect((legacy!.entity.stack as any).entity.name).toBe('cflinuxfs4');
  });

  it('maps droplet fields onto buildpack/detected_buildpack', () => {
    const legacy = stToLegacy.appDetail(fullDetail);
    expect(legacy!.entity.buildpack).toBe('ruby_buildpack');
    expect(legacy!.entity.detected_buildpack).toBe('ruby');
  });

  it('maps package_updated_at and translates V3 package state to V2 vocabulary', () => {
    // fullDetail has droplet.state="STAGED" → legacy package_state="STAGED"
    const legacy = stToLegacy.appDetail(fullDetail);
    expect(legacy!.entity.package_state).toBe('STAGED');
    expect(legacy!.entity.package_updated_at).toBe('2024-01-01T00:00:30Z');
  });

  it('maps build error onto staging_failed_description', () => {
    const detailWithBuildError: StAppDetail = {
      ...fullDetail,
      build: { ...fullDetail.build!, state: 'FAILED', error: 'Build failed: out of memory' },
    };
    const legacy = stToLegacy.appDetail(detailWithBuildError);
    expect(legacy!.entity.staging_failed_description).toBe('Build failed: out of memory');
  });

  it('maps build FAILED to legacy package_state FAILED', () => {
    const detail: StAppDetail = {
      ...fullDetail,
      droplet: null,
      build: { ...fullDetail.build!, state: 'FAILED' },
    };
    expect(stToLegacy.appDetail(detail)!.entity.package_state).toBe('FAILED');
  });

  it('maps pkg FAILED/EXPIRED to legacy package_state FAILED', () => {
    const failedPkg: StAppDetail = {
      ...fullDetail,
      droplet: null,
      pkg: { ...fullDetail.pkg!, state: 'FAILED' },
    };
    expect(stToLegacy.appDetail(failedPkg)!.entity.package_state).toBe('FAILED');
    const expiredPkg: StAppDetail = {
      ...fullDetail,
      droplet: null,
      pkg: { ...fullDetail.pkg!, state: 'EXPIRED' },
    };
    expect(stToLegacy.appDetail(expiredPkg)!.entity.package_state).toBe('FAILED');
  });

  it('falls back to PENDING when no terminal droplet/build/pkg state', () => {
    const inFlight: StAppDetail = {
      ...fullDetail,
      droplet: null,
      build: { ...fullDetail.build!, state: 'STAGING' },
      pkg: { ...fullDetail.pkg!, state: 'PROCESSING_UPLOAD' },
    };
    expect(stToLegacy.appDetail(inFlight)!.entity.package_state).toBe('PENDING');
  });

  it('mirrors sshEnabled onto enable_ssh', () => {
    const legacy = stToLegacy.appDetail(fullDetail);
    expect(legacy!.entity.enable_ssh).toBe(true);
  });

  it('returns null when StAppDetail is undefined', () => {
    expect(stToLegacy.appDetail(undefined)).toBeNull();
  });

  it('leaves droplet-derived fields undefined when droplet is null (unstaged app)', () => {
    const unstagedDetail: StAppDetail = { ...fullDetail, droplet: null };
    const legacy = stToLegacy.appDetail(unstagedDetail);
    expect(legacy).not.toBeNull();
    expect(legacy!.entity.buildpack).toBeUndefined();
    expect(legacy!.entity.detected_buildpack).toBeUndefined();
  });

  it('leaves package_updated_at undefined when pkg is null but maps state from droplet', () => {
    const noPkg: StAppDetail = { ...fullDetail, pkg: null };
    const legacy = stToLegacy.appDetail(noPkg);
    // droplet.state STAGED still drives package_state — pkg-derived
    // updated_at is the only field that should fall back.
    expect(legacy!.entity.package_state).toBe('STAGED');
    expect(legacy!.entity.package_updated_at).toBeUndefined();
  });
});

describe('stToLegacy.appSummary', () => {
  it('builds IAppSummary shape from StAppDetail', () => {
    const summary = stToLegacy.appSummary(fullDetail);
    expect(summary).not.toBeNull();
    expect(summary!.guid).toBe('app-1');
    expect(summary!.name).toBe('my-app');
    expect(summary!.state).toBe('STARTED');
    expect(summary!.memory).toBe(256);
    expect(summary!.disk_quota).toBe(1024);
    expect(summary!.instances).toBe(3);
    expect(summary!.routes).toHaveLength(1);
    // The adapter stamps a runtime `url` onto each summary route (not on the
    // IAppSummaryRoute interface); read it through the actual emitted shape.
    expect((summary!.routes[0] as IAppSummaryRoute & { url: string }).url).toBe('my-app.example.com');
    expect(summary!.buildpack).toBe('ruby_buildpack');
    expect(summary!.detected_buildpack).toBe('ruby');
    // V3 droplet.state "STAGED" maps to V2 package_state "STAGED"
    expect(summary!.package_state).toBe('STAGED');
    expect(summary!.enable_ssh).toBe(true);
  });

  it('returns null when detail is undefined', () => {
    expect(stToLegacy.appSummary(undefined)).toBeNull();
  });

  it('falls back to PENDING when no droplet is staged', () => {
    const noDroplet: StAppDetail = { ...fullDetail, droplet: null, pkg: null, build: null };
    const summary = stToLegacy.appSummary(noDroplet);
    expect(summary!.package_state).toBe('PENDING');
  });
});

describe('stToLegacy.envVars', () => {
  it('renames v3-camelCase fields to v2-snake_case shape', () => {
    // applicationProvided carries CF's VCAP_APPLICATION, a nested JSON object on
    // the wire, but StEnvVars declares applicationProvided as Record<string,
    // string> — narrower than reality. The adapter passes the value straight
    // through, so the realistic nested fixture exercises the true passthrough
    // path. Type the fixture by its actual wire shape; the cast to StEnvVars
    // bridges the (overly-narrow) declared param, not a silencing widen.
    const env: Omit<StEnvVars, 'applicationProvided'> & {
      applicationProvided: Record<string, unknown>;
    } = {
      environment: { FOO: 'bar' },
      systemProvided: { VCAP_SERVICES: { db: [{ name: 'pg' }] } },
      applicationProvided: { VCAP_APPLICATION: { name: 'my-app' } },
      runningProvided: { RUN: 'yes' },
      stagingProvided: { STAGE: 'true' },
    };
    const legacy = stToLegacy.envVars(env as StEnvVars);
    expect(legacy).not.toBeNull();
    expect(legacy!.environment_json).toEqual({ FOO: 'bar' });
    expect(legacy!.system_env_json).toEqual({ VCAP_SERVICES: { db: [{ name: 'pg' }] } });
    expect(legacy!.application_env_json).toEqual({ VCAP_APPLICATION: { name: 'my-app' } });
    expect(legacy!.running_env_json).toEqual({ RUN: 'yes' });
    expect(legacy!.staging_env_json).toEqual({ STAGE: 'true' });
  });

  it('returns null on undefined', () => {
    expect(stToLegacy.envVars(undefined)).toBeNull();
  });
});

describe('stToLegacy.appStats', () => {
  it('maps full StAppStat shape onto legacy AppStat (cpu/mem/disk/uptime preserved)', () => {
    const stats: StAppStat[] = [
      {
        index: 0,
        state: 'RUNNING',
        uptime: 12345,
        memQuota: 268435456,
        diskQuota: 1073741824,
        fdsQuota: 16384,
        host: '10.0.0.1',
        usage: { time: '2026-05-03T00:00:00Z', cpu: 0.42, mem: 134217728, disk: 536870912 },
      },
    ];
    const legacy = stToLegacy.appStats(stats, 'cnsi-1', 'app-1');
    expect(legacy).toHaveLength(1);
    expect(legacy[0].cfGuid).toBe('cnsi-1');
    expect(legacy[0].guid).toBe('app-1');
    expect(legacy[0].state).toBe('RUNNING');
    expect(legacy[0].stats.uptime).toBe(12345);
    expect(legacy[0].stats.mem_quota).toBe(268435456);
    expect(legacy[0].stats.disk_quota).toBe(1073741824);
    expect(legacy[0].stats.fds_quota).toBe(16384);
    expect(legacy[0].stats.host).toBe('10.0.0.1');
    expect(legacy[0].stats.usage.cpu).toBe(0.42);
    expect(legacy[0].stats.usage.mem).toBe(134217728);
    expect(legacy[0].stats.usage.disk).toBe(536870912);
    expect(legacy[0].stats.usage.time).toBe('2026-05-03T00:00:00Z');
  });

  it('zero-fills usage for non-RUNNING instances where CF emits no usage block', () => {
    const stats: StAppStat[] = [
      { index: 0, state: 'CRASHED', uptime: 0, memQuota: 0, diskQuota: 0, fdsQuota: 0 },
    ];
    const legacy = stToLegacy.appStats(stats, 'cnsi-1', 'app-1');
    expect(legacy[0].state).toBe('CRASHED');
    expect(legacy[0].stats.usage.cpu).toBe(0);
    expect(legacy[0].stats.usage.mem).toBe(0);
  });

  it('returns [] for empty input', () => {
    expect(stToLegacy.appStats([], 'cnsi-1', 'app-1')).toEqual([]);
  });
});
