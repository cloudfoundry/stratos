import { describe, expect, it } from 'vitest';

import { FOUNDATION_A } from './fixtures/foundation-a.fixture';
import { FOUNDATION_B } from './fixtures/foundation-b.fixture';
import { FOUNDATION_C } from './fixtures/foundation-c.fixture';
import { dist, topShare } from './shape-stats';

/** A distribution block as the reference collector records it (schema_version 1). */
interface DistBlock {
  n: number;
  min: number;
  median: number;
  p90: number;
  p99: number;
  max: number;
  mean: number;
  zeros: number;
  sum: number;
  hist: Record<string, number>;
}

const isDistBlock = (value: unknown): value is DistBlock =>
  !!value && typeof value === 'object' && 'hist' in value && 'median' in value && 'n' in value;

/** An exact hist maps value → count; binned hists use "lo-hi" range keys instead. */
const isExactHist = (hist: Record<string, number>) => Object.keys(hist).every(key => !key.includes('-'));

/** Reconstruct the full sample from an exact hist — hist is lossless for ≤32 distinct values. */
const expandHist = (hist: Record<string, number>): number[] =>
  Object.entries(hist).flatMap(([value, count]) => Array(count).fill(Number(value)));

const collectDistBlocks = (node: unknown, path: string, out: [string, DistBlock][]): void => {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (isDistBlock(node)) {
    out.push([path, node]);
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    collectDistBlocks(child, path ? `${path}.${key}` : key, out);
  }
};

const FIXTURES: [string, object][] = [
  ['A', FOUNDATION_A],
  ['B', FOUNDATION_B],
  ['C', FOUNDATION_C],
];

describe('dist agrees with the reference collector on real foundations', () => {
  for (const [label, fixture] of FIXTURES) {
    const blocks: [string, DistBlock][] = [];
    collectDistBlocks(fixture, '', blocks);

    // Positive control: an empty walk would make every golden test vacuously pass.
    it(`foundation ${label} exposes distribution blocks to verify`, () => {
      expect(blocks.length).toBeGreaterThan(3);
    });

    for (const [path, block] of blocks.filter(([, b]) => isExactHist(b.hist))) {
      it(`foundation ${label}: ${path}`, () => {
        expect(dist(expandHist(block.hist))).toEqual(block);
      });
    }
  }
});

describe('topShare agrees with the reference collector on real foundations', () => {
  const CASES: [keyof typeof FOUNDATION_A['distributions'] & string, string][] = [
    ['spaces_per_org', 'spaces_in_largest_org'],
    ['apps_per_space', 'apps_in_largest_space'],
    ['apps_per_org', 'apps_in_largest_org'],
  ];
  for (const [label, fixture] of FIXTURES) {
    const distributions = (fixture as typeof FOUNDATION_A).distributions;
    for (const [distKey, shareKey] of CASES) {
      const block = distributions[distKey] as DistBlock | null;
      const recorded = (distributions.top_share as Record<string, unknown>)[shareKey];
      if (!block || !recorded) {
        continue;
      }
      it(`foundation ${label}: ${shareKey}`, () => {
        const values = expandHist(block.hist);
        expect(topShare(values, block.sum)).toEqual(recorded);
      });
    }
  }
});

// Edge-case expectations below are the reference implementation's actual
// outputs (captured by running its dist()/top_share() on these inputs), not
// hand-derived values.
describe('dist mirrors the reference implementation edge cases', () => {
  it('rounds percentile ranks half-to-even (index 4.5 → 4, not 5)', () => {
    expect(dist([1, 2, 3, 4, 5, 6])).toEqual({
      n: 6, min: 1, median: 3.5, p90: 5, p99: 6, max: 6,
      mean: 3.5, zeros: 0, sum: 21,
      hist: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 },
    });
  });

  it('zero-fills missing population members', () => {
    expect(dist([5], 3)).toEqual({
      n: 3, min: 0, median: 0, p90: 5, p99: 5, max: 5,
      mean: 1.667, zeros: 2, sum: 5,
      hist: { '0': 2, '5': 1 },
    });
  });

  it('returns null for an empty sample', () => {
    expect(dist([])).toBeNull();
  });

  it('averages the two middle values for an even-sized sample', () => {
    expect(dist([1, 2])).toEqual({
      n: 2, min: 1, median: 1.5, p90: 2, p99: 2, max: 2,
      mean: 1.5, zeros: 0, sum: 3,
      hist: { '1': 1, '2': 1 },
    });
  });

  it('bins wide-domain samples into linear ranges past 32 distinct values', () => {
    const values = Array.from({ length: 33 }, (_, i) => i);
    expect(dist(values)).toEqual({
      n: 33, min: 0, median: 16, p90: 29, p99: 32, max: 32,
      mean: 16.0, zeros: 1, sum: 528,
      hist: {
        '0-2': 3, '3-5': 3, '6-8': 3, '9-11': 3, '12-14': 3, '15-17': 3,
        '18-20': 3, '21-23': 3, '24-26': 3, '27-29': 3, '30-32': 3,
      },
    });
  });
});

describe('topShare mirrors the reference implementation edge cases', () => {
  it('returns null when the population or total is empty', () => {
    expect(topShare([], 0)).toBeNull();
    expect(topShare([1, 2], 0)).toBeNull();
  });

  it('reports the largest holder and its fraction to 4 decimals', () => {
    expect(topShare([5, 1, 1], 7)).toEqual({ largest_holds: 5, fraction: 0.7143 });
  });
});
