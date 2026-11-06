import { describe, it, expect, afterEach } from 'vitest';

import {
  ENTITY_BYTES,
  estimateFootprint,
  formatBytes,
  rateRisk,
  readHeap,
  HeapInfo,
} from './entity-footprint';

describe('entity-footprint', () => {

  describe('ENTITY_BYTES', () => {
    it('contains the expected per-entity estimates', () => {
      expect(ENTITY_BYTES['organization']).toBe(600);
      expect(ENTITY_BYTES['space']).toBe(560);
      expect(ENTITY_BYTES['route']).toBe(800);
      expect(ENTITY_BYTES['application']).toBe(1300);
      expect(ENTITY_BYTES['user']).toBe(1800);
      expect(ENTITY_BYTES['serviceInstance']).toBe(1600);
    });
  });

  describe('estimateFootprint', () => {
    it('returns 0 for empty counts', () => {
      expect(estimateFootprint({})).toBe(0);
    });

    it('multiplies count by per-entity bytes and applies the 1.5 safety factor', () => {
      // 10 orgs * 600 = 6000; * 1.5 = 9000
      expect(estimateFootprint({ organization: 10 })).toBe(9000);
    });

    it('sums across entity types', () => {
      // (10 * 600) + (5 * 560) = 8800; * 1.5 = 13200
      expect(estimateFootprint({ organization: 10, space: 5 })).toBe(13200);
    });

    it('ignores unknown entity types', () => {
      expect(estimateFootprint({ mystery: 1000 })).toBe(0);
      expect(estimateFootprint({ organization: 10, mystery: 1000 })).toBe(9000);
    });

    it('treats zero counts as zero contribution', () => {
      expect(estimateFootprint({ application: 0 })).toBe(0);
    });
  });

  describe('rateRisk with a real heap reading', () => {
    const heap = (used: number, limit: number): HeapInfo => ({
      usedBytes: used,
      limitBytes: limit,
      source: 'performance.memory',
    });

    // ratio = (used + estimate) / (0.8 * limit)
    it('rates low when ratio < 0.5', () => {
      // (100 + 299) / (0.8 * 1000) = 0.49875
      expect(rateRisk(299, heap(100, 1000))).toBe('low');
    });

    it('rates medium at the 0.5 boundary', () => {
      // (100 + 300) / 800 = 0.5
      expect(rateRisk(300, heap(100, 1000))).toBe('medium');
    });

    it('rates medium when ratio < 0.75', () => {
      // (100 + 499) / 800 = 0.74875
      expect(rateRisk(499, heap(100, 1000))).toBe('medium');
    });

    it('rates high at the 0.75 boundary', () => {
      // (100 + 500) / 800 = 0.75
      expect(rateRisk(500, heap(100, 1000))).toBe('high');
    });

    it('rates high above the boundary', () => {
      expect(rateRisk(10_000, heap(100, 1000))).toBe('high');
    });
  });

  describe('rateRisk with the fixed budget (used unknown)', () => {
    const heap = (limit: number): HeapInfo => ({
      usedBytes: null,
      limitBytes: limit,
      source: 'fixed-budget',
    });

    // ratio = estimate / limit
    it('rates low when ratio < 0.25', () => {
      expect(rateRisk(249, heap(1000))).toBe('low');
    });

    it('rates medium at the 0.25 boundary', () => {
      expect(rateRisk(250, heap(1000))).toBe('medium');
    });

    it('rates medium when ratio < 0.5', () => {
      expect(rateRisk(499, heap(1000))).toBe('medium');
    });

    it('rates high at the 0.5 boundary', () => {
      expect(rateRisk(500, heap(1000))).toBe('high');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes below 1 kB without a decimal', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kB with one decimal', () => {
      expect(formatBytes(1024)).toBe('1.0 kB');
      expect(formatBytes(1536)).toBe('1.5 kB');
    });

    it('formats MB with one decimal', () => {
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });

    it('formats GB with one decimal', () => {
      expect(formatBytes(2 * 1024 ** 3)).toBe('2.0 GB');
    });
  });

  describe('readHeap', () => {
    afterEach(() => {
      delete (performance as any).memory;
    });

    it('falls back to a fixed 2 GiB budget when performance.memory is absent', () => {
      delete (performance as any).memory;
      const heap = readHeap();
      expect(heap.source).toBe('fixed-budget');
      expect(heap.usedBytes).toBeNull();
      expect(heap.limitBytes).toBe(2 * 1024 ** 3);
    });

    it('reads used/limit from performance.memory when present', () => {
      (performance as any).memory = {
        usedJSHeapSize: 123456,
        jsHeapSizeLimit: 4 * 1024 ** 3,
      };
      const heap = readHeap();
      expect(heap.source).toBe('performance.memory');
      expect(heap.usedBytes).toBe(123456);
      expect(heap.limitBytes).toBe(4 * 1024 ** 3);
    });
  });
});
