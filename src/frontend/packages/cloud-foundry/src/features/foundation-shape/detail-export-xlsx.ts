/**
 * Spreadsheet form of the named detail export (GH #5702): one workbook, one
 * sheet per entity type, flattened from the same DetailExport the JSON
 * download emits. The JSON stays the schema_version 1 contract; the workbook
 * is a rendering of it, so anything absent from the JSON (never-run drain)
 * is absent here too, and a sheet with no data rows is not written at all.
 *
 * Orphans — children whose parent is missing from a drain that ran — keep
 * the honesty rule from detail-shape.ts: they land in the same sheet as
 * their siblings with `(orphaned)` in the parent columns, visible rather
 * than dropped.
 */
import { DetailExport } from './detail-export';
import { DetailApp, DetailSpace } from './detail-shape';
import { ShapeSheet } from './shape-export-xlsx';

const ORPHANED = '(orphaned)';

type Cell = string | number;

/** Optional schema fields render as an empty cell, never as "undefined". */
const cell = (value: Cell | undefined): Cell => value ?? '';

/** Every space with its org's name; orphaned spaces carry the marker. */
const spaceRows = (exported: DetailExport): { org: string; orgGuid: string; space: DetailSpace }[] => [
  ...exported.organizations.flatMap(o =>
    (o.spaces ?? []).map(space => ({ org: o.name, orgGuid: o.guid, space }))),
  ...(exported.orphans.spaces ?? []).map(space => ({ org: ORPHANED, orgGuid: '', space })),
];

/** Every app with its org and space names; orphaned apps carry the marker in both. */
const appRows = (exported: DetailExport): { org: string; space: string; app: DetailApp }[] => [
  ...spaceRows(exported).flatMap(({ org, space }) =>
    (space.apps ?? []).map(app => ({ org, space: space.name, app }))),
  ...(exported.orphans.apps ?? []).map(app => ({ org: ORPHANED, space: ORPHANED, app })),
];

const overviewSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Overview',
  rows: [
    ['Endpoint', exported.endpoint.name],
    ['Endpoint GUID', exported.endpoint.guid],
    ['Collected at', exported.collected_at],
    ['Schema version', exported.schema_version],
    ['Coverage note', exported.coverage_note],
    ...(exported.truncated ? [['Truncated datasets', exported.truncated.join(', ')] as Cell[]] : []),
    [],
    ['drain', 'last run'],
    ...Object.entries(exported.drains).map(([name, stamp]): Cell[] => [name, stamp ?? 'never']),
    [],
    ['entity', 'count'],
    ...Object.entries(exported.totals),
  ],
});

const organizationsSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Organizations',
  rows: [
    ['guid', 'name', 'status', 'quota_guid', 'spaces_count', 'apps_count'],
    ...exported.organizations.map((o): Cell[] =>
      [o.guid, o.name, o.status, o.quota_guid, cell(o.spaces_count), cell(o.apps_count)]),
  ],
});

const spacesSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Spaces',
  rows: [
    ['org', 'org_guid', 'guid', 'name', 'quota_guid'],
    ...spaceRows(exported).map(({ org, orgGuid, space }): Cell[] =>
      [org, orgGuid, space.guid, space.name, cell(space.quota_guid)]),
  ],
});

const appsSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Apps',
  rows: [
    ['org', 'space', 'guid', 'name', 'state', 'instances',
      'stack', 'memory_mb', 'disk_mb', 'routes', 'last_refreshed_at', 'unavailable'],
    ...appRows(exported).map(({ org, space, app }): Cell[] => [
      org, space, app.guid, app.name, app.state, app.instances,
      cell(app.stack), cell(app.memory_mb), cell(app.disk_mb),
      app.routes.join(', '), cell(app.last_refreshed_at), (app.unavailable ?? []).join(', '),
    ]),
  ],
});

const serviceInstancesSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Service instances',
  rows: [
    ['org', 'space', 'guid', 'name', 'type', 'plan', 'offering'],
    ...spaceRows(exported).flatMap(({ org, space }) =>
      (space.service_instances ?? []).map((si): Cell[] =>
        [org, space.name, si.guid, si.name, si.type, cell(si.plan), cell(si.offering)])),
  ],
});

const serviceBindingsSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Service bindings',
  rows: [
    ['org', 'space', 'app', 'guid', 'type', 'name', 'service_instance', 'service_instance_guid'],
    ...appRows(exported).flatMap(({ org, space, app }) =>
      (app.service_bindings ?? []).map((b): Cell[] => [
        org, space, app.name, b.guid, b.type, cell(b.name),
        cell(b.service_instance.name), b.service_instance.guid,
      ])),
  ],
});

const rolesSheet = (exported: DetailExport): ShapeSheet => ({
  name: 'Roles',
  rows: [
    ['scope', 'org', 'space', 'username', 'roles'],
    ...exported.organizations.flatMap(o =>
      Object.entries(o.roles ?? {}).map(([username, roles]): Cell[] =>
        ['organization', o.name, '', username, roles.join(', ')])),
    ...spaceRows(exported).flatMap(({ org, space }) =>
      Object.entries(space.roles ?? {}).map(([username, roles]): Cell[] =>
        ['space', org, space.name, username, roles.join(', ')])),
  ],
});

/** Overview always (it carries the coverage note and drain stamps); every other sheet only when it has data rows. */
export const buildDetailWorkbook = (exported: DetailExport): ShapeSheet[] => [
  overviewSheet(exported),
  organizationsSheet(exported),
  spacesSheet(exported),
  appsSheet(exported),
  serviceInstancesSheet(exported),
  serviceBindingsSheet(exported),
  rolesSheet(exported),
].filter(sheet => sheet.name === 'Overview' || sheet.rows.length > 1);
