/**
 * Spreadsheet form of the anonymous shape export (GH #5703): one workbook,
 * one sheet per data type, flattened from the same AgnosticExport the JSON
 * download emits. The JSON stays the schema_version 1 contract; the workbook
 * is a rendering of it, so anything absent from the JSON (never-run drain)
 * is absent here too, and a sheet with no data rows is not written at all.
 */
import { AgnosticExport, isDist } from './shape-export';
import { Distribution, TopShare } from './shape-stats';

/** First row is the header; cells land in the sheet exactly as given. */
export interface ShapeSheet {
  name: string;
  rows: (string | number)[][];
}

/** Every measured distribution, schema keys intact: relationship dists first, then process sizing. */
const namedDists = (exported: AgnosticExport): [string, Distribution][] => {
  const found: [string, Distribution][] = [];
  for (const source of [exported.distributions, exported.composition]) {
    for (const [key, value] of Object.entries(source)) {
      if (isDist(value)) {
        found.push([key, value]);
      }
    }
  }
  return found;
};

const totalsSheet = (exported: AgnosticExport): ShapeSheet => ({
  name: 'Totals',
  rows: [
    ['Collected at', exported.collected_at],
    ['Schema version', exported.schema_version],
    ['Coverage note', exported.coverage_note],
    [],
    ['entity', 'count'],
    ...Object.entries(exported.totals),
  ],
});

const distributionsSheet = (dists: [string, Distribution][]): ShapeSheet => ({
  name: 'Distributions',
  rows: [
    ['metric', 'n', 'min', 'median', 'p90', 'p99', 'max', 'mean', 'zeros', 'sum'],
    ...dists.map(([key, d]): (string | number)[] =>
      [key, d.n, d.min, d.median, d.p90, d.p99, d.max, d.mean, d.zeros, d.sum]),
  ],
});

const histogramsSheet = (dists: [string, Distribution][]): ShapeSheet => ({
  name: 'Histograms',
  rows: [
    ['metric', 'bucket', 'count'],
    ...dists.flatMap(([key, d]) =>
      Object.entries(d.hist).map(([bucket, count]): (string | number)[] => [key, bucket, count])),
  ],
});

const topShareSheet = (exported: AgnosticExport): ShapeSheet => ({
  name: 'Top share',
  rows: [
    ['metric', 'largest_holds', 'fraction'],
    ...Object.entries(exported.distributions.top_share)
      .filter((entry): entry is [string, TopShare] => !!entry[1])
      .map(([key, share]): (string | number)[] => [key, share.largest_holds, share.fraction]),
  ],
});

const compositionSheet = (exported: AgnosticExport): ShapeSheet => {
  const dimensions: [string, Record<string, number> | undefined][] = [
    ['app_state', exported.composition.app_state],
    ['stacks_pinned_by_apps', exported.composition.stacks_pinned_by_apps],
  ];
  return {
    name: 'Composition',
    rows: [
      ['dimension', 'category', 'count'],
      ...dimensions.flatMap(([dimension, categories]) =>
        Object.entries(categories ?? {}).map(([category, count]): (string | number)[] =>
          [dimension, category, count])),
    ],
  };
};

const ecosystemSheet = (exported: AgnosticExport): ShapeSheet => {
  const kinds: [string, string[] | undefined][] = [
    ['stacks_defined', exported.composition.stacks_defined],
    ['buildpacks_defined', exported.composition.buildpacks_defined],
  ];
  return {
    name: 'Ecosystem',
    rows: [
      ['kind', 'name'],
      ...kinds.flatMap(([kind, names]) => (names ?? []).map((name): (string | number)[] => [kind, name])),
    ],
  };
};

/** Totals always (it carries the coverage note); every other sheet only when it has data rows. */
export const buildShapeWorkbook = (exported: AgnosticExport): ShapeSheet[] => {
  const dists = namedDists(exported);
  return [
    totalsSheet(exported),
    distributionsSheet(dists),
    histogramsSheet(dists),
    topShareSheet(exported),
    compositionSheet(exported),
    ecosystemSheet(exported),
  ].filter(sheet => sheet.name === 'Totals' || sheet.rows.length > 1);
};
