/**
 * Pure comparison of two foundation shapes (GH #5702 follow-on): the
 * promotion-verification view. Both sides are schema_version 1 exports —
 * a live section's projection or an imported file — and the comparison
 * walks what each side actually measured: an absent key means "not
 * measured" on that side (never-loaded ≠ empty), a null distribution
 * means measured-but-empty, and neither is ever presented as a zero.
 *
 * Emphasis follows the promotion question — did a stack migration,
 * buildpack update, or app rollout propagate — so ecosystem lists diff as
 * added/removed and categorical compositions diff as share deltas, with
 * totals and distribution key-stats as the secondary table.
 */
import { AgnosticExport, isDist } from './shape-export';
import { Distribution, TopShare } from './shape-stats';

/** undefined = that side never measured this; null = measured, empty. */
export interface ComparedValue<T> {
  key: string;
  a?: T | null;
  b?: T | null;
}

export interface CategoryRow {
  category: string;
  /** undefined = dimension unmeasured on that side; counts are real zeros otherwise. */
  a?: number;
  b?: number;
  /** Share of the side's dimension total, 0..1; undefined when unmeasured. */
  aShare?: number;
  bShare?: number;
}

export interface ListDiff {
  key: string;
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface ShapeComparison {
  a: { label: string; collectedAt: string };
  b: { label: string; collectedAt: string };
  totals: ComparedValue<number>[];
  distributions: ComparedValue<Distribution>[];
  topShare: ComparedValue<TopShare>[];
  /** One entry per categorical dimension measured on at least one side. */
  categorical: { dimension: string; rows: CategoryRow[] }[];
  /** Defined-list diffs; multiset entries render as "name ×n". */
  lists: ListDiff[];
}

/** Union of both sides' keys, a-side order first — comparison rows never drop a key. */
const unionKeys = (a: Record<string, unknown>, b: Record<string, unknown>): string[] => {
  const keys = Object.keys(a);
  for (const key of Object.keys(b)) {
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys;
};

const comparedValues = <T>(
  a: Record<string, T | null | undefined>,
  b: Record<string, T | null | undefined>
): ComparedValue<T>[] =>
  unionKeys(a, b).map(key => {
    const row: ComparedValue<T> = { key };
    if (key in a) {
      row.a = a[key] as T | null;
    }
    if (key in b) {
      row.b = b[key] as T | null;
    }
    return row;
  });

const categoricalRows = (
  a: Record<string, number> | undefined,
  b: Record<string, number> | undefined
): CategoryRow[] => {
  const aTotal = Object.values(a ?? {}).reduce((acc, v) => acc + v, 0);
  const bTotal = Object.values(b ?? {}).reduce((acc, v) => acc + v, 0);
  return unionKeys(a ?? {}, b ?? {}).map(category => {
    const row: CategoryRow = { category };
    if (a) {
      row.a = a[category] ?? 0;
      row.aShare = aTotal ? row.a / aTotal : 0;
    }
    if (b) {
      row.b = b[category] ?? 0;
      row.bShare = bTotal ? row.b / bTotal : 0;
    }
    return row;
  });
};

/** Multiset entries collapse to "name ×n" so a second stack's build of the same buildpack shows. */
const multisetLabels = (names: string[]): string[] => {
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => (count > 1 ? `${name} ×${count}` : name));
};

const listDiff = (key: string, a: string[] | undefined, b: string[] | undefined): ListDiff => {
  const aLabels = multisetLabels(a ?? []);
  const bLabels = multisetLabels(b ?? []);
  return {
    key,
    added: bLabels.filter(label => !aLabels.includes(label)),
    removed: aLabels.filter(label => !bLabels.includes(label)),
    unchanged: aLabels.filter(label => bLabels.includes(label)),
  };
};

const distEntries = (exported: AgnosticExport): Record<string, Distribution | null> => {
  const entries: Record<string, Distribution | null> = {};
  for (const source of [exported.distributions, exported.composition]) {
    for (const [key, value] of Object.entries(source)) {
      if (isDist(value) || value === null) {
        entries[key] = value as Distribution | null;
      }
    }
  }
  return entries;
};

export interface LabelledExport {
  label: string;
  exported: AgnosticExport;
}

export const compareExports = (a: LabelledExport, b: LabelledExport): ShapeComparison => {
  const dimensions = ['app_state', 'stacks_pinned_by_apps'] as const;
  const lists = ['stacks_defined', 'buildpacks_defined'] as const;
  return {
    a: { label: a.label, collectedAt: a.exported.collected_at },
    b: { label: b.label, collectedAt: b.exported.collected_at },
    totals: comparedValues(a.exported.totals, b.exported.totals),
    distributions: comparedValues(distEntries(a.exported), distEntries(b.exported)),
    topShare: comparedValues(
      a.exported.distributions.top_share as Record<string, TopShare | null>,
      b.exported.distributions.top_share as Record<string, TopShare | null>
    ),
    categorical: dimensions
      .filter(dimension => a.exported.composition[dimension] || b.exported.composition[dimension])
      .map(dimension => ({
        dimension,
        rows: categoricalRows(a.exported.composition[dimension], b.exported.composition[dimension]),
      })),
    lists: lists
      .filter(key => a.exported.composition[key] || b.exported.composition[key])
      .map(key => listDiff(key, a.exported.composition[key], b.exported.composition[key])),
  };
};

/**
 * Parse an imported export file (the trust boundary for the file slot).
 * Returns the export or a reason it was rejected — never throws.
 */
export const parseImportedExport = (raw: string): { exported?: AgnosticExport; error?: string } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'not valid JSON' };
  }
  const candidate = parsed as Partial<AgnosticExport> | null;
  if (!candidate || typeof candidate !== 'object') {
    return { error: 'not a shape export' };
  }
  if (candidate.schema_version !== 1) {
    return { error: `unsupported schema_version (${String(candidate.schema_version)})` };
  }
  if (typeof candidate.totals !== 'object' || typeof candidate.distributions !== 'object') {
    return { error: 'missing totals or distributions blocks' };
  }
  const exported = candidate as AgnosticExport;
  return {
    exported: {
      ...exported,
      distributions: { top_share: {}, ...exported.distributions },
      composition: exported.composition ?? {},
    },
  };
};
