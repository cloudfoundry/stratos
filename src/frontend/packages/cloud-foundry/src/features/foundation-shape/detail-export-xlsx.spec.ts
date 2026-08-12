import { describe, expect, it } from 'vitest';

import { buildDetailExport, DETAIL_COVERAGE_NOTE, DetailExportInput } from './detail-export';
import { buildDetailWorkbook } from './detail-export-xlsx';
import { ShapeSheet } from './shape-export-xlsx';
import { app, binding, org, serviceInstance, space, user } from './testing/entity-builders';

const fetched = new Date('2026-08-10T10:00:00Z');

const baseInput = (overrides: Partial<DetailExportInput> = {}): DetailExportInput => ({
  endpoint: { guid: 'cf-1', name: 'My Cloud Foundry' },
  entities: {
    orgs: [org('o1')],
    spaces: [space('s1', 'o1')],
    apps: [
      app('a1', {
        spaceGuid: 's1',
        orgGuid: 'o1',
        memory: 256,
        diskQuota: 1024,
        stackName: 'cflinuxfs4',
        routes: [
          { guid: 'r1', url: 'a1.example.com' },
          { guid: 'r2', url: 'a1.internal' },
        ],
      }),
    ],
    serviceInstances: [serviceInstance('si1', 's1', { servicePlan: { guid: 'p1', name: 'small', serviceOffering: { guid: 'off1', name: 'postgres' } } })],
    bindings: [binding('b1', 'a1', 'si1')],
    users: [
      user('alice', {
        orgRoles: [{ orgGuid: 'o1', roles: ['organization_manager'] }],
        spaceRoles: [{ spaceGuid: 's1', orgGuid: 'o1', roles: ['space_developer'] }],
      }),
    ],
  },
  sessionTotals: {
    orgs: 1, spaces: 1, apps: 1, routes: 2,
    serviceInstances: 1, serviceOfferings: 4, servicePlans: 5, serviceBrokers: 1,
  },
  drains: { counts: true, servicesCounts: true, orgs: true, spaces: true, apps: true },
  drainStamps: { orgs: fetched, spaces: fetched, apps: fetched, services: fetched },
  collectedAt: new Date('2026-08-10T11:00:00Z'),
  rolesFetchedAt: fetched,
  ...overrides,
});

const workbook = (overrides: Partial<DetailExportInput> = {}): ShapeSheet[] =>
  buildDetailWorkbook(buildDetailExport(baseInput(overrides)));

const sheet = (sheets: ShapeSheet[], name: string): ShapeSheet => {
  const found = sheets.find(s => s.name === name);
  expect(found, `sheet ${name}`).toBeDefined();
  return found as ShapeSheet;
};

describe('buildDetailWorkbook', () => {
  it('emits one sheet per named data type, Overview first', () => {
    expect(workbook().map(s => s.name)).toEqual([
      'Overview', 'Organizations', 'Spaces', 'Apps', 'Service instances', 'Service bindings', 'Roles',
    ]);
  });

  it('Overview carries the endpoint identity, metadata block, drain stamps and totals', () => {
    const rows = sheet(workbook(), 'Overview').rows;
    expect(rows).toContainEqual(['Endpoint', 'My Cloud Foundry']);
    expect(rows).toContainEqual(['Endpoint GUID', 'cf-1']);
    expect(rows).toContainEqual(['Collected at', '2026-08-10T11:00:00.000Z']);
    expect(rows).toContainEqual(['Coverage note', DETAIL_COVERAGE_NOTE]);
    expect(rows).toContainEqual(['orgs', '2026-08-10T10:00:00.000Z']);
    expect(rows).toContainEqual(['roles', '2026-08-10T10:00:00.000Z']);
    expect(rows).toContainEqual(['entity', 'count']);
    expect(rows).toContainEqual(['organizations', 1]);
  });

  it('Overview marks a never-run drain as never, and omits the truncated row when nothing is capped', () => {
    const rows = sheet(workbook({ drainStamps: { orgs: fetched, spaces: fetched, apps: null, services: fetched } }), 'Overview').rows;
    expect(rows).toContainEqual(['apps', 'never']);
    expect(rows.some(r => r[0] === 'Truncated datasets')).toBe(false);
  });

  it('Overview names the page-capped datasets when there are any', () => {
    const rows = sheet(workbook({
      entities: { orgs: [org('o1')], spaces: [space('s1', 'o1')], serviceInstances: [serviceInstance('si1', 's1')] },
      sessionTotals: {
        orgs: 1, spaces: 1, apps: 1, routes: 2,
        serviceInstances: 3, serviceOfferings: 4, servicePlans: 5, serviceBrokers: 1,
      },
    }), 'Overview').rows;
    expect(rows).toContainEqual(['Truncated datasets', 'service_instances']);
  });

  it('Organizations rows carry identity and the always-emit quota link', () => {
    const rows = sheet(workbook(), 'Organizations').rows;
    expect(rows[0]).toEqual(['guid', 'name', 'status', 'quota_guid', 'spaces_count', 'apps_count']);
    expect(rows).toContainEqual(['o1', 'org-o1', 'active', '', '', '']);
  });

  it('Spaces rows name their org; an orphaned space is kept and marked', () => {
    const rows = sheet(workbook({
      entities: { orgs: [org('o1')], spaces: [space('s1', 'o1'), space('s-lost', 'o-gone')] },
    }), 'Spaces').rows;
    expect(rows[0]).toEqual(['org', 'org_guid', 'guid', 'name', 'quota_guid']);
    expect(rows).toContainEqual(['org-o1', 'o1', 's1', 'space-s1', '']);
    expect(rows).toContainEqual(['(orphaned)', '', 's-lost', 'space-s-lost', '']);
  });

  it('Apps rows keep numbers as numbers and join routes; an orphaned app is kept and marked', () => {
    const rows = sheet(workbook({
      entities: {
        orgs: [org('o1')],
        spaces: [space('s1', 'o1')],
        apps: [
          app('a1', {
            spaceGuid: 's1', memory: 256, diskQuota: 1024, stackName: 'cflinuxfs4',
            routes: [{ guid: 'r1', url: 'a1.example.com' }, { guid: 'r2', url: 'a1.internal' }],
          }),
          app('a-lost', { spaceGuid: 's-gone' }),
        ],
      },
    }), 'Apps').rows;
    expect(rows[0]).toEqual([
      'org', 'space', 'guid', 'name', 'state', 'instances',
      'stack', 'memory_mb', 'disk_mb', 'routes', 'last_refreshed_at', 'unavailable',
    ]);
    expect(rows).toContainEqual([
      'org-o1', 'space-s1', 'a1', 'app-a1', 'STARTED', 1,
      'cflinuxfs4', 256, 1024, 'a1.example.com, a1.internal', '', '',
    ]);
    expect(rows).toContainEqual([
      '(orphaned)', '(orphaned)', 'a-lost', 'app-a-lost', 'STARTED', 1, '', '', '', '', '', '',
    ]);
  });

  it('Service instances and bindings flatten with their plan, offering and target names', () => {
    const sheets = workbook();
    expect(sheet(sheets, 'Service instances').rows).toContainEqual([
      'org-o1', 'space-s1', 'si1', 'si-si1', 'managed', 'small', 'postgres',
    ]);
    expect(sheet(sheets, 'Service bindings').rows).toContainEqual([
      'org-o1', 'space-s1', 'app-a1', 'b1', 'app', '', 'si-si1', 'si1',
    ]);
  });

  it('Roles flattens both scopes to one row per user and scope', () => {
    const rows = sheet(workbook(), 'Roles').rows;
    expect(rows[0]).toEqual(['scope', 'org', 'space', 'username', 'roles']);
    expect(rows).toContainEqual(['organization', 'org-o1', '', 'alice', 'organization_manager']);
    expect(rows).toContainEqual(['space', 'org-o1', 'space-s1', 'alice', 'space_developer']);
  });

  it('never-run drains collapse the workbook to Overview and Organizations alone', () => {
    const sheets = workbook({
      entities: { orgs: [org('o1')] },
      drainStamps: { orgs: fetched, spaces: null, apps: null, services: null },
      rolesFetchedAt: undefined,
    });
    expect(sheets.map(s => s.name)).toEqual(['Overview', 'Organizations']);
  });

  it('a drain that ran and found nothing produces no sheet either', () => {
    const sheets = workbook({
      entities: { orgs: [org('o1')], spaces: [] },
    });
    expect(sheets.map(s => s.name)).not.toContain('Spaces');
  });
});
