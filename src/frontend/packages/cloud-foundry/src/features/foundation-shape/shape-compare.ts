/**
 * Pure N-way comparison of foundation shapes (GH #5702 follow-on): the
 * promotion-verification view. Every side is a schema_version 1 export —
 * a live section's projection or an imported file — and the comparison
 * walks what each side actually measured: an absent key means "not
 * measured" on that side (never-loaded ≠ empty), a null distribution
 * means measured-but-empty, and neither is ever presented as a zero.
 *
 * Sides are ordered; the first is the baseline. Values come back as
 * index-aligned arrays (one entry per side) — judgment against the
 * baseline (added/removed, deltas) is the view's concern, not computed
 * here, so the same comparison serves tables, bars, and matrices.
 */
import { AgnosticExport, isDist } from './shape-export';
import { Distribution, TopShare } from './shape-stats';

export interface LabelledExport {
  label: string;
  exported: AgnosticExport;
}

/** Per-key row: values[i] belongs to sides[i]; undefined = that side never measured it, null = measured, empty. */
export interface ComparedRow<T> {
  key: string;
  values: (T | null | undefined)[];
}

export interface CategoryRow {
  category: string;
  /** undefined = dimension unmeasured on that side; counts are real zeros otherwise. */
  counts: (number | undefined)[];
  /** Share of the side's dimension total, 0..1; undefined when unmeasured. */
  shares: (number | undefined)[];
}

export interface ListMatrix {
  key: string;
  /** Side-level: whether this side measured the list at all. */
  measured: boolean[];
  /** One row per union label ("name" or "name ×n"); present[i] only meaningful where measured[i]. */
  rows: { label: string; present: boolean[] }[];
}

export interface ShapeComparison {
  sides: { label: string; collectedAt: string }[];
  totals: ComparedRow<number>[];
  distributions: ComparedRow<Distribution>[];
  topShare: ComparedRow<TopShare>[];
  /** One entry per categorical dimension measured on at least one side. */
  categorical: { dimension: string; rows: CategoryRow[] }[];
  lists: ListMatrix[];
}

/** Union of every side's keys, first-seen order — comparison rows never drop a key. */
const unionKeys = (sources: Record<string, unknown>[]): string[] => {
  const keys: string[] = [];
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  }
  return keys;
};

const comparedRows = <T>(sources: Record<string, T | null | undefined>[]): ComparedRow<T>[] =>
  unionKeys(sources).map(key => ({
    key,
    values: sources.map(source => (key in source ? (source[key] as T | null) : undefined)),
  }));

const categoricalRows = (sources: (Record<string, number> | undefined)[]): CategoryRow[] => {
  const totals = sources.map(source =>
    source ? Object.values(source).reduce((acc, v) => acc + v, 0) : 0
  );
  return unionKeys(sources.filter((s): s is Record<string, number> => !!s)).map(category => ({
    category,
    counts: sources.map(source => (source ? source[category] ?? 0 : undefined)),
    shares: sources.map((source, i) =>
      source ? (totals[i] ? (source[category] ?? 0) / totals[i] : 0) : undefined
    ),
  }));
};

/** Multiset entries collapse to "name ×n" so a second stack's build of the same buildpack shows. */
const multisetLabels = (names: string[]): string[] => {
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => (count > 1 ? `${name} ×${count}` : name));
};

const listMatrix = (key: string, sources: (string[] | undefined)[]): ListMatrix => {
  const labelled = sources.map(names => (names ? multisetLabels(names) : undefined));
  const union: string[] = [];
  for (const labels of labelled) {
    for (const label of labels ?? []) {
      if (!union.includes(label)) {
        union.push(label);
      }
    }
  }
  return {
    key,
    measured: labelled.map(labels => labels !== undefined),
    rows: union.map(label => ({
      label,
      present: labelled.map(labels => !!labels?.includes(label)),
    })),
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

const CATEGORICAL_DIMENSIONS = ['app_state', 'stacks_pinned_by_apps'] as const;
const DEFINED_LISTS = ['stacks_defined', 'buildpacks_defined'] as const;

export const compareExports = (sides: LabelledExport[]): ShapeComparison => {
  const exports = sides.map(side => side.exported);
  return {
    sides: sides.map(side => ({ label: side.label, collectedAt: side.exported.collected_at })),
    totals: comparedRows(exports.map(e => e.totals)),
    distributions: comparedRows(exports.map(distEntries)),
    topShare: comparedRows(exports.map(e => e.distributions.top_share as Record<string, TopShare | null>)),
    categorical: CATEGORICAL_DIMENSIONS
      .filter(dimension => exports.some(e => e.composition[dimension]))
      .map(dimension => ({
        dimension,
        rows: categoricalRows(exports.map(e => e.composition[dimension])),
      })),
    lists: DEFINED_LISTS
      .filter(key => exports.some(e => e.composition[key]))
      .map(key => listMatrix(key, exports.map(e => e.composition[key]))),
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
  if ((candidate as { mode?: string }).mode === 'detail') {
    return { error: 'a named detail export — import it in the Named diff selector instead' };
  }
  if (typeof candidate.totals !== 'object' || typeof candidate.distributions !== 'object') {
    return { error: 'missing totals or distributions blocks' };
  }
  const exported = candidate as AgnosticExport;
  return {
    exported: {
      ...exported,
      distributions: { ...exported.distributions, top_share: exported.distributions.top_share ?? {} },
      composition: exported.composition ?? {},
    },
  };
};
