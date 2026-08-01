/**
 * Statistical summaries for foundation shape dimensions (GH #5702/#5703).
 *
 * This is a TS mirror of the read-only reference collector's stats, and its
 * output is the export contract (schema_version 1): the two implementations
 * must produce identical numbers for the same sample. The golden tests in
 * shape-stats.spec.ts pin that agreement on three real collected foundations.
 */

/** Summary of one shape dimension, exactly as schema_version 1 records it. */
export interface Distribution {
  n: number;
  min: number;
  median: number;
  p90: number;
  p99: number;
  max: number;
  mean: number;
  zeros: number;
  sum: number;
  /** value → count for ≤32 distinct values; "lo-hi" linear bins beyond that. */
  hist: Record<string, number>;
}

export interface TopShare {
  largest_holds: number;
  fraction: number;
}

/**
 * Nearest integer with exact .5 ties going to the even neighbour — the
 * reference implementation's rounding (Python round()). Math.round would
 * disagree on every tie (e.g. percentile rank 4.5 of a 6-value sample).
 */
const roundHalfEven = (x: number): number => {
  const up = Math.round(x);
  return up - x === 0.5 && up % 2 !== 0 ? up - 1 : up;
};

const round3 = (x: number): number => Math.round(x * 1000) / 1000;

const buildHist = (sortedVals: number[]): Record<string, number> => {
  const freq = new Map<number, number>();
  for (const v of sortedVals) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  if (freq.size <= 32) {
    return Object.fromEntries([...freq.entries()].map(([v, c]) => [String(v), c]));
  }
  const lo = sortedVals[0];
  const hi = sortedVals[sortedVals.length - 1];
  const width = Math.max(1, Math.floor((hi - lo) / 16) + 1);
  const binned = new Map<string, number>();
  for (const [v, c] of freq) {
    const bin = lo + Math.floor((v - lo) / width) * width;
    const key = `${bin}-${bin + width - 1}`;
    binned.set(key, (binned.get(key) ?? 0) + c);
  }
  return Object.fromEntries(binned);
};

/**
 * Summarize one value per population member. Members missing from `values`
 * (e.g. spaces with no apps, absent from a per-app grouping) are 0-filled by
 * passing the true population size as `nPopulation`.
 */
export const dist = (values: number[], nPopulation?: number): Distribution | null => {
  const vals = [...values];
  if (nPopulation !== undefined && vals.length < nPopulation) {
    vals.push(...new Array<number>(nPopulation - vals.length).fill(0));
  }
  if (!vals.length) {
    return null;
  }
  vals.sort((a, b) => a - b);
  const n = vals.length;
  const pct = (p: number): number =>
    vals[Math.min(n - 1, Math.max(0, roundHalfEven((p / 100) * (n - 1))))];
  const mid = n >> 1;
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return {
    n,
    min: vals[0],
    median: n % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2,
    p90: pct(90),
    p99: pct(99),
    max: vals[n - 1],
    mean: round3(sum / n),
    zeros: vals.filter(v => v === 0).length,
    sum,
    hist: buildHist(vals),
  };
};

/** Largest holder's count and its share of the total, to 4 decimals. */
export const topShare = (values: number[], totalCount: number): TopShare | null => {
  if (!values.length || !totalCount) {
    return null;
  }
  let largest = values[0];
  for (const v of values) {
    if (v > largest) {
      largest = v;
    }
  }
  return { largest_holds: largest, fraction: Math.round((largest / totalCount) * 10000) / 10000 };
};
