import { describe, expect, it } from 'vitest';

import { HeapInfo } from '../diagnostics-data/entity-footprint';
import {
  computeSegments,
  meterBudget,
  MIN_SEGMENT_PERCENT,
  thresholdPositions,
} from './heap-headroom-meter.component';

const GIB = 1024 ** 3;

const realHeap = (used: number, limit: number): HeapInfo => ({
  usedBytes: used,
  limitBytes: limit,
  source: 'performance.memory',
});

const fixedHeap = (limit: number): HeapInfo => ({
  usedBytes: null,
  limitBytes: limit,
  source: 'fixed-budget',
});

describe('heap-headroom-meter', () => {

  describe('meterBudget', () => {
    it('uses 0.8 x limit with a real heap reading (matches rateRisk)', () => {
      expect(meterBudget(realHeap(0, 4 * GIB))).toBe(0.8 * 4 * GIB);
    });

    it('uses the full limit with a fixed budget', () => {
      expect(meterBudget(fixedHeap(2 * GIB))).toBe(2 * GIB);
    });
  });

  describe('thresholdPositions', () => {
    it('places warn/high at 50% and 75% of the track with a real heap reading', () => {
      expect(thresholdPositions(realHeap(0, 4 * GIB))).toEqual([
        { percent: 50, label: 'warn' },
        { percent: 75, label: 'high' },
      ]);
    });

    it('places warn/high at 25% and 50% of the track with a fixed budget', () => {
      expect(thresholdPositions(fixedHeap(2 * GIB))).toEqual([
        { percent: 25, label: 'warn' },
        { percent: 50, label: 'high' },
      ]);
    });
  });

  describe('computeSegments', () => {
    it('sizes a segment as count x ENTITY_BYTES x 1.5 over a fixed budget', () => {
      // 48200 users * 1800 B * 1.5 = 130,140,000 B against a 4 GiB budget.
      const { segments } = computeSegments({ user: 48200 }, fixedHeap(4 * GIB));
      expect(segments).toHaveLength(1);
      expect(segments[0].key).toBe('user');
      expect(segments[0].bytes).toBe(130140000);
      expect(segments[0].percent).toBeCloseTo(3.0300579965, 6);
    });

    it('sizes the same estimate against 0.8 x limit with a real heap reading', () => {
      const { segments } = computeSegments({ user: 48200 }, realHeap(0, 4 * GIB));
      expect(segments[0].percent).toBeCloseTo(3.7875724956, 6);
    });

    it('reports current usage as a percentage of the budget', () => {
      // 1 GiB used of a 0.8 * 4 GiB budget = exactly 31.25%.
      const { usedPercent } = computeSegments({}, realHeap(GIB, 4 * GIB));
      expect(usedPercent).toBe(31.25);
    });

    it('reports null usage with a fixed budget', () => {
      expect(computeSegments({}, fixedHeap(2 * GIB)).usedPercent).toBeNull();
    });

    it('emits segments in the fixed slot order', () => {
      const { segments } = computeSegments(
        { serviceInstance: 1, route: 1, application: 1, space: 1, organization: 1, user: 1 },
        fixedHeap(2 * GIB)
      );
      expect(segments.map(s => s.key)).toEqual(
        ['user', 'organization', 'space', 'application', 'route', 'serviceInstance']
      );
    });

    it('skips zero, null, undefined, and unknown entities', () => {
      const { segments } = computeSegments(
        { user: 0, organization: null, space: undefined, mystery: 50, route: 3 },
        fixedHeap(2 * GIB)
      );
      expect(segments.map(s => s.key)).toEqual(['route']);
    });

    it('applies a gap-safe minimum width to visible slivers', () => {
      // 1 org * 600 B * 1.5 = 900 B: invisible against 2 GiB without a floor.
      const { segments } = computeSegments({ organization: 1 }, fixedHeap(2 * GIB));
      expect(segments[0].bytes).toBe(900);
      expect(segments[0].percent).toBe(MIN_SEGMENT_PERCENT);
    });

    it('does not flag overflow when the estimate fits the budget', () => {
      expect(computeSegments({ user: 48200 }, fixedHeap(4 * GIB)).overflow).toBe(false);
    });

    it('clamps segments to the track and flags overflow when the estimate exceeds it', () => {
      // 1,000,000 users * 1800 * 1.5 = 2.7e9 B > 2 GiB budget.
      const { segments, overflow } = computeSegments({ user: 1000000 }, fixedHeap(2 * GIB));
      expect(overflow).toBe(true);
      expect(segments[0].percent).toBe(100);
    });

    it('clamps cumulative width including current usage', () => {
      // Used = 90% of budget; user estimate alone would be ~125% of budget.
      const limit = 4 * GIB;
      const budget = 0.8 * limit;
      const heap = realHeap(0.9 * budget, limit);
      const { usedPercent, segments, overflow } = computeSegments({ user: 1000000 }, heap);
      expect(usedPercent).toBe(90);
      expect(overflow).toBe(true);
      const total = (usedPercent ?? 0) + segments.reduce((sum, s) => sum + s.percent, 0);
      expect(total).toBeLessThanOrEqual(100);
    });

    it('clamps usage itself to 100% when used exceeds the budget', () => {
      const limit = 4 * GIB;
      const heap = realHeap(0.9 * limit, limit); // 90% of limit > 0.8 * limit budget
      const { usedPercent, overflow } = computeSegments({}, heap);
      expect(usedPercent).toBe(100);
      expect(overflow).toBe(true);
    });

    it('keeps clamped-out segments in the list for the legend', () => {
      // Users alone overflow the budget; orgs still appear with zero width.
      const { segments } = computeSegments(
        { user: 1000000, organization: 10 },
        fixedHeap(2 * GIB)
      );
      expect(segments.map(s => s.key)).toEqual(['user', 'organization']);
      expect(segments[1].percent).toBe(0);
      expect(segments[1].bytes).toBe(9000);
    });
  });
});
