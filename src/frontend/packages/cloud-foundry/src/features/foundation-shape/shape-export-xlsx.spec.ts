import { describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { AgnosticExportInput, buildAgnosticExport, COVERAGE_NOTE } from './shape-export';
import { buildShapeWorkbook, ShapeSheet } from './shape-export-xlsx';
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

const ALL_DRAINS = { counts: true, servicesCounts: true, orgs: true, spaces: true, apps: true };

const baseInput = (): AgnosticExportInput => ({
  shape: computeSessionShape(ORGS, SPACES, APPS),
  sessionTotals: SESSION_TOTALS,
  drains: ALL_DRAINS,
  collectedAt: new Date('2026-08-01T12:00:00Z'),
});

const sheet = (workbook: ShapeSheet[], name: string): ShapeSheet => {
  const found = workbook.find(s => s.name === name);
  expect(found, `sheet ${name}`).toBeDefined();
  return found as ShapeSheet;
};

describe('buildShapeWorkbook', () => {
  it('emits one sheet per measured data type, Totals first', () => {
    const workbook = buildShapeWorkbook(buildAgnosticExport({
      ...baseInput(),
      measuredEcosystem: { stacksDefined: ['cflinuxfs4'], buildpacksDefined: ['ruby_buildpack'], fetchedAt: new Date() },
    }));
    expect(workbook.map(s => s.name)).toEqual([
      'Totals', 'Distributions', 'Histograms', 'Top share', 'Composition', 'Ecosystem',
    ]);
  });

  it('Totals carries the export metadata block and the entity counts', () => {
    const rows = sheet(buildShapeWorkbook(buildAgnosticExport(baseInput())), 'Totals').rows;
    expect(rows).toContainEqual(['Collected at', '2026-08-01T12:00:00.000Z']);
    expect(rows).toContainEqual(['Coverage note', COVERAGE_NOTE]);
    expect(rows).toContainEqual(['entity', 'count']);
    expect(rows).toContainEqual(['organizations', 2]);
    expect(rows).toContainEqual(['service_instances', 3]);
  });

  it('Distributions rows carry every Distribution field under schema keys', () => {
    const rows = sheet(buildShapeWorkbook(buildAgnosticExport(baseInput())), 'Distributions').rows;
    expect(rows[0]).toEqual(['metric', 'n', 'min', 'median', 'p90', 'p99', 'max', 'mean', 'zeros', 'sum']);
    expect(rows).toContainEqual(['spaces_per_org', 2, 0, 0.5, 1, 1, 1, 0.5, 1, 1]);
    // composition sizing dists fold into the same sheet, like the markdown table
    expect(rows.some(r => r[0] === 'web_process_memory_mb')).toBe(true);
  });

  it('Histograms flattens each hist bucket to metric/bucket/count', () => {
    const rows = sheet(buildShapeWorkbook(buildAgnosticExport(baseInput())), 'Histograms').rows;
    expect(rows[0]).toEqual(['metric', 'bucket', 'count']);
    expect(rows).toContainEqual(['spaces_per_org', '0', 1]);
    expect(rows).toContainEqual(['spaces_per_org', '1', 1]);
  });

  it('Top share and Composition mirror the export objects', () => {
    const workbook = buildShapeWorkbook(buildAgnosticExport(baseInput()));
    expect(sheet(workbook, 'Top share').rows).toContainEqual(['apps_in_largest_space', 1, 1]);
    const composition = sheet(workbook, 'Composition').rows;
    expect(composition).toContainEqual(['app_state', 'STARTED', 1]);
    expect(composition).toContainEqual(['stacks_pinned_by_apps', 'cflinuxfs4', 1]);
  });

  it('Ecosystem appears only when definitions were measured', () => {
    expect(buildShapeWorkbook(buildAgnosticExport(baseInput())).map(s => s.name)).not.toContain('Ecosystem');
    const workbook = buildShapeWorkbook(buildAgnosticExport({
      ...baseInput(),
      measuredEcosystem: {
        stacksDefined: ['cflinuxfs4'],
        buildpacksDefined: ['ruby_buildpack', 'ruby_buildpack'],
        fetchedAt: new Date(),
      },
    }));
    const rows = sheet(workbook, 'Ecosystem').rows;
    expect(rows).toContainEqual(['stacks_defined', 'cflinuxfs4']);
    // multiplicity preserved: one row per defined buildpack, like the JSON list
    expect(rows.filter(r => r[1] === 'ruby_buildpack')).toHaveLength(2);
  });

  it('never-run drains collapse the workbook to the Totals sheet alone', () => {
    const input = baseInput();
    input.drains = { counts: true, servicesCounts: false, orgs: false, spaces: false, apps: false };
    input.sessionTotals = { ...SESSION_TOTALS, spaces: null };
    const workbook = buildShapeWorkbook(buildAgnosticExport(input));
    expect(workbook.map(s => s.name)).toEqual(['Totals']);
  });

  it('a drained-but-empty (null) distribution produces no rows', () => {
    const input = baseInput();
    input.shape = computeSessionShape(ORGS, SPACES, []);
    input.sessionTotals = { ...SESSION_TOTALS, apps: 0 };
    const rows = sheet(buildShapeWorkbook(buildAgnosticExport(input)), 'Distributions').rows;
    expect(rows.some(r => r[0] === 'routes_per_app')).toBe(false);
    expect(rows.some(r => r[0] === 'spaces_per_org')).toBe(true);
  });
});
