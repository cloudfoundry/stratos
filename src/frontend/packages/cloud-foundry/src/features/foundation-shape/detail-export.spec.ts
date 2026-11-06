import { describe, expect, it } from 'vitest';

import { buildDetailExport, DETAIL_COVERAGE_NOTE, DetailExportInput, SERVICES_PAGE_CAP } from './detail-export';
import { app, binding, org, serviceInstance, space } from './testing/entity-builders';

const fetched = new Date('2026-08-10T10:00:00Z');

const baseInput = (overrides: Partial<DetailExportInput> = {}): DetailExportInput => ({
  endpoint: { guid: 'cf-1', name: 'My Cloud Foundry' },
  entities: {
    orgs: [org('o1')],
    spaces: [space('s1', 'o1')],
    apps: [app('a1', { spaceGuid: 's1', orgGuid: 'o1' })],
  },
  sessionTotals: {
    orgs: 1, spaces: 1, apps: 1, routes: 2,
    serviceInstances: 3, serviceOfferings: 4, servicePlans: 5, serviceBrokers: 1,
  },
  drains: { counts: true, servicesCounts: true, orgs: true, spaces: true, apps: true },
  drainStamps: { orgs: fetched, spaces: fetched, apps: null },
  collectedAt: new Date('2026-08-10T11:00:00Z'),
  ...overrides,
});

describe('buildDetailExport', () => {
  it('says in the file itself that it carries named data', () => {
    const exported = buildDetailExport(baseInput());
    expect(exported.mode).toBe('detail');
    expect(exported.schema_version).toBe(1);
    expect(exported.coverage_note).toBe(DETAIL_COVERAGE_NOTE);
    expect(exported.endpoint).toEqual({ guid: 'cf-1', name: 'My Cloud Foundry' });
    expect(exported.organizations[0].spaces?.[0].apps?.[0].name).toBe('app-a1');
  });

  it('records when each drain ran, and that an un-run one did not', () => {
    const exported = buildDetailExport(baseInput());
    expect(exported.drains).toEqual({
      orgs: '2026-08-10T10:00:00.000Z',
      spaces: '2026-08-10T10:00:00.000Z',
      apps: null,
    });
    expect(exported.drains).not.toHaveProperty('roles');
  });

  it('stamps the roles drain only when the measure ran', () => {
    const exported = buildDetailExport(baseInput({ rolesFetchedAt: fetched }));
    expect(exported.drains['roles']).toBe('2026-08-10T10:00:00.000Z');
  });

  it('names service instances as truncated when fewer arrived than the count', () => {
    const exported = buildDetailExport(
      baseInput({
        entities: { orgs: [org('o1')], spaces: [space('s1', 'o1')], serviceInstances: [serviceInstance('si1', 's1')] },
      })
    );
    // 1 loaded against a session count of 3.
    expect(exported.truncated).toEqual(['service_instances']);
  });

  it('names bindings as truncated when the drain came back a full page', () => {
    const bindings = Array.from({ length: SERVICES_PAGE_CAP }, (_, i) => binding(`b${i}`, 'a1', 'si1'));
    const exported = buildDetailExport(
      baseInput({
        entities: { orgs: [org('o1')], spaces: [space('s1', 'o1')], apps: [app('a1', { spaceGuid: 's1' })], bindings },
        sessionTotals: {
          orgs: 1, spaces: 1, apps: 1, routes: 2,
          serviceInstances: 0, serviceOfferings: 0, servicePlans: 0, serviceBrokers: 0,
        },
      })
    );
    expect(exported.truncated).toEqual(['service_bindings']);
  });

  it('omits the truncated key when nothing is capped', () => {
    const exported = buildDetailExport(baseInput());
    expect(exported).not.toHaveProperty('truncated');
  });

  it('carries the same totals the anonymous export publishes', () => {
    const exported = buildDetailExport(baseInput());
    expect(exported.totals).toEqual({
      organizations: 1,
      apps: 1,
      routes: 2,
      spaces: 1,
      service_instances: 3,
      service_offerings: 4,
      service_plans: 5,
      service_brokers: 1,
    });
  });

  it('leaves counts out entirely when their pass never ran', () => {
    const exported = buildDetailExport(
      baseInput({ drains: { counts: false, servicesCounts: false, orgs: true, spaces: true, apps: true } })
    );
    expect(exported.totals).toEqual({ spaces: 1 });
  });
});
