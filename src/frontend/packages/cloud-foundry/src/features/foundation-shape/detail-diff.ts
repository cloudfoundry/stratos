/**
 * Named diff of two detail exports (GH #5702, closes #5703's comparison leg):
 * the find-act-verify exhibit as a pure function. Both sides are schema_version
 * 1 detail files — a live section's payload or an imported export — matched by
 * guid at every level, so a rename shows as a change and a delete as a removal.
 *
 * The honesty rules carry over from the exports themselves: a level whose
 * drain never ran on either side is unmeasured there and diffs nothing —
 * never-loaded ≠ empty — and page-capped datasets warn rather than letting
 * truncation read as deletion.
 */
import { DetailExport } from './detail-export';
import { DetailApp, DetailSpace, RoleGrants } from './detail-shape';

export interface DiffEntry {
  guid: string;
  name: string;
  /** Parent path ("org / space"); absent on top-level entries. */
  path?: string;
}

export interface FieldChange {
  field: string;
  before: string;
  after: string;
}

export interface ChangedEntry extends DiffEntry {
  changes: FieldChange[];
}

export interface LevelDiff {
  key: string;
  /** Whether each side's drain ran; buckets are empty unless both did. */
  measured: [boolean, boolean];
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: ChangedEntry[];
  unchanged: number;
}

export interface DetailDiff {
  sides: { name: string; collected_at: string }[];
  levels: LevelDiff[];
  warnings: string[];
}

/** A value the side did not compose renders as a dash, not as empty. */
const DASH = '—';

const mb = (value: number | undefined): string | undefined => (value === undefined ? undefined : `${value}M`);

/** One flattened entity: identity plus its comparable fields, already stringified. */
interface FlatEntity {
  guid: string;
  name: string;
  path?: string;
  fields: Record<string, string | undefined>;
}

type FlatLevel = Map<string, FlatEntity>;

interface FlatSide {
  organizations: FlatLevel;
  spaces: FlatLevel;
  apps: FlatLevel;
  service_instances: FlatLevel;
  service_bindings: FlatLevel;
  roles: FlatLevel;
}

/** Comparable fields per level, in the order changes are reported. */
const LEVEL_FIELDS: Record<keyof FlatSide, string[]> = {
  organizations: ['name', 'status', 'quota'],
  spaces: ['name', 'quota', 'parent'],
  apps: ['name', 'state', 'instances', 'memory', 'disk', 'stack', 'routes', 'parent'],
  service_instances: ['name', 'type', 'plan', 'offering', 'parent'],
  service_bindings: ['type', 'instance', 'parent'],
  roles: ['roles'],
};

const flatten = (exported: DetailExport): FlatSide => {
  const side: FlatSide = {
    organizations: new Map(),
    spaces: new Map(),
    apps: new Map(),
    service_instances: new Map(),
    service_bindings: new Map(),
    roles: new Map(),
  };

  const addRoles = (scopeGuid: string, path: string, grants: RoleGrants | undefined): void => {
    for (const [username, roles] of Object.entries(grants ?? {})) {
      side.roles.set(`${scopeGuid}:${username}`, {
        guid: `${scopeGuid}:${username}`,
        name: username,
        path,
        fields: { roles: [...roles].sort().join(', ') },
      });
    }
  };

  // `parent` compares by guid so only a real move reports — an ancestor's
  // rename must not cascade a phantom "parent" change onto every child.
  const addApp = (app: DetailApp, path: string, parentGuid: string): void => {
    side.apps.set(app.guid, {
      guid: app.guid,
      name: app.name,
      path,
      fields: {
        name: app.name,
        state: app.state,
        instances: String(app.instances),
        memory: mb(app.memory_mb),
        disk: mb(app.disk_mb),
        stack: app.stack,
        routes: [...app.routes].sort().join(', '),
        parent: parentGuid,
      },
    });
    for (const binding of app.service_bindings ?? []) {
      const instance = binding.service_instance.name ?? binding.service_instance.guid;
      side.service_bindings.set(binding.guid, {
        guid: binding.guid,
        name: `${instance} (${binding.type})`,
        path: `${path} / ${app.name}`,
        fields: { type: binding.type, instance, parent: app.guid },
      });
    }
  };

  const addSpace = (space: DetailSpace, path: string, parentGuid: string): void => {
    side.spaces.set(space.guid, {
      guid: space.guid,
      name: space.name,
      path,
      fields: { name: space.name, quota: space.quota_guid, parent: parentGuid },
    });
    const spacePath = `${path} / ${space.name}`;
    for (const app of space.apps ?? []) {
      addApp(app, spacePath, space.guid);
    }
    for (const instance of space.service_instances ?? []) {
      side.service_instances.set(instance.guid, {
        guid: instance.guid,
        name: instance.name,
        path: spacePath,
        fields: {
          name: instance.name,
          type: instance.type,
          plan: instance.plan,
          offering: instance.offering,
          parent: space.guid,
        },
      });
    }
    addRoles(space.guid, spacePath, space.roles);
  };

  for (const org of exported.organizations) {
    side.organizations.set(org.guid, {
      guid: org.guid,
      name: org.name,
      fields: { name: org.name, status: org.status, quota: org.quota_guid || undefined },
    });
    for (const space of org.spaces ?? []) {
      addSpace(space, org.name, org.guid);
    }
    addRoles(org.guid, org.name, org.roles);
  }
  for (const space of exported.orphans.spaces ?? []) {
    addSpace(space, '(orphaned)', '(orphaned)');
  }
  for (const app of exported.orphans.apps ?? []) {
    addApp(app, '(orphaned)', '(orphaned)');
  }
  return side;
};

/** Which drain stamp gates each level; orgs are a precondition of the export itself. */
const LEVEL_DRAINS: Record<keyof FlatSide, string> = {
  organizations: 'orgs',
  spaces: 'spaces',
  apps: 'apps',
  service_instances: 'services',
  service_bindings: 'services',
  roles: 'roles',
};

const entryOf = ({ guid, name, path }: FlatEntity): DiffEntry => ({ guid, name, ...(path && { path }) });

const byPathThenName = (a: DiffEntry, b: DiffEntry): number =>
  (a.path ?? '').localeCompare(b.path ?? '') || a.name.localeCompare(b.name);

const diffLevel = (key: keyof FlatSide, before: FlatSide, after: FlatSide, measured: [boolean, boolean]): LevelDiff => {
  if (!measured[0] || !measured[1]) {
    return { key, measured, added: [], removed: [], changed: [], unchanged: 0 };
  }
  const added: DiffEntry[] = [];
  const removed: DiffEntry[] = [];
  const changed: ChangedEntry[] = [];
  let unchanged = 0;
  for (const [guid, entity] of after[key]) {
    if (!before[key].has(guid)) {
      added.push(entryOf(entity));
    }
  }
  for (const [guid, entity] of before[key]) {
    const now = after[key].get(guid);
    if (!now) {
      removed.push(entryOf(entity));
      continue;
    }
    const changes: FieldChange[] = [];
    for (const field of LEVEL_FIELDS[key]) {
      const was = entity.fields[field];
      const is = now.fields[field];
      if (was !== is) {
        // A parent move compares guids but reads as names.
        changes.push(
          field === 'parent'
            ? { field, before: entity.path ?? DASH, after: now.path ?? DASH }
            : { field, before: was ?? DASH, after: is ?? DASH }
        );
      }
    }
    if (changes.length) {
      changed.push({ ...entryOf(now), changes });
    } else {
      unchanged++;
    }
  }
  return {
    key,
    measured,
    added: added.sort(byPathThenName),
    removed: removed.sort(byPathThenName),
    changed: changed.sort(byPathThenName),
    unchanged,
  };
};

export const diffDetailExports = (before: DetailExport, after: DetailExport): DetailDiff => {
  const sides = [before, after];
  const flat: [FlatSide, FlatSide] = [flatten(before), flatten(after)];
  const warnings: string[] = [];
  if (before.endpoint.guid !== after.endpoint.guid) {
    warnings.push(
      `Sides come from different endpoints (${before.endpoint.name} vs ${after.endpoint.name}) — ` +
        'entities match by guid, so everything reads as added or removed.'
    );
  }
  for (const exported of sides) {
    for (const set of exported.truncated ?? []) {
      warnings.push(
        `${set} on ${exported.endpoint.name} (${exported.collected_at.slice(0, 10)}) is a page-capped prefix — ` +
          'added/removed there may reflect truncation, not change.'
      );
    }
  }
  return {
    sides: sides.map(exported => ({ name: exported.endpoint.name, collected_at: exported.collected_at })),
    levels: (Object.keys(LEVEL_FIELDS) as (keyof FlatSide)[]).map(key =>
      diffLevel(key, flat[0], flat[1], [
        Boolean(sides[0].drains[LEVEL_DRAINS[key]]),
        Boolean(sides[1].drains[LEVEL_DRAINS[key]]),
      ])
    ),
    warnings,
  };
};

/** Parse an imported detail-export file (the trust boundary for the file slot); never throws. */
export const parseImportedDetail = (raw: string): { exported?: DetailExport; error?: string } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'not valid JSON' };
  }
  const candidate = parsed as Partial<DetailExport> | null;
  if (!candidate || typeof candidate !== 'object') {
    return { error: 'not a detail export' };
  }
  if (candidate.schema_version !== 1) {
    return { error: `unsupported schema_version (${String(candidate.schema_version)})` };
  }
  if (candidate.mode !== 'detail') {
    return { error: 'an anonymous shape export — import it as a Compare side instead' };
  }
  if (!Array.isArray(candidate.organizations)) {
    return { error: 'missing organizations' };
  }
  const exported = candidate as DetailExport;
  return {
    exported: {
      ...exported,
      drains: exported.drains ?? {},
      orphans: exported.orphans ?? {},
      endpoint: exported.endpoint ?? { guid: '', name: 'imported' },
    },
  };
};
