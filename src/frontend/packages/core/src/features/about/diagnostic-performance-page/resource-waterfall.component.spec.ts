import { describe, it, expect } from 'vitest';

import { ResourceRow } from '../diagnostics-data/load-performance';
import {
  WATERFALL_ROW_CAP,
  axisTicks,
  basename,
  capRows,
  formatTick,
  milestoneLines,
  spanPercent,
  toPercent,
  waterfallScaleMax,
} from './resource-waterfall.component';

const row = (over: Partial<ResourceRow> = {}): ResourceRow => ({
  path: '/main.js',
  startMs: 0,
  durationMs: 10,
  transferBytes: 100,
  decodedBytes: 200,
  protocol: 'h2',
  cached: false,
  ...over,
});

describe('waterfallScaleMax', () => {
  it('uses the load event when it is past the last response end', () => {
    expect(waterfallScaleMax(500, [row({ startMs: 10, durationMs: 20 })])).toBe(500);
  });

  it('uses the last response end when a resource outlives the load event', () => {
    expect(waterfallScaleMax(500, [row({ startMs: 480, durationMs: 100 })])).toBe(580);
  });

  it('never returns zero, so percent math stays finite', () => {
    expect(waterfallScaleMax(0, [])).toBeGreaterThan(0);
  });
});

describe('toPercent', () => {
  it('maps ms linearly onto 0-100', () => {
    expect(toPercent(250, 1000)).toBe(25);
  });

  it('clamps to the 0-100 range', () => {
    expect(toPercent(1500, 1000)).toBe(100);
    expect(toPercent(-5, 1000)).toBe(0);
  });

  it('returns 0 for a non-positive scale', () => {
    expect(toPercent(50, 0)).toBe(0);
  });
});

describe('spanPercent', () => {
  it('is the width between start and end percent', () => {
    expect(spanPercent(100, 200, 1000)).toBe(20);
  });

  it('clips a span running past the scale end', () => {
    expect(spanPercent(900, 500, 1000)).toBe(10);
  });
});

describe('capRows', () => {
  it('returns rows ordered by start time', () => {
    const rows = capRows([row({ startMs: 30 }), row({ startMs: 10 }), row({ startMs: 20 })]);
    expect(rows.map(r => r.startMs)).toEqual([10, 20, 30]);
  });

  it('caps at the first N rows by start time', () => {
    const many = Array.from({ length: WATERFALL_ROW_CAP + 5 }, (_, i) => row({ startMs: i }));
    const rows = capRows(many.reverse());
    expect(rows.length).toBe(WATERFALL_ROW_CAP);
    expect(rows[0].startMs).toBe(0);
    expect(rows[rows.length - 1].startMs).toBe(WATERFALL_ROW_CAP - 1);
  });

  it('does not mutate its input', () => {
    const input = [row({ startMs: 2 }), row({ startMs: 1 })];
    capRows(input);
    expect(input[0].startMs).toBe(2);
  });
});

describe('milestoneLines', () => {
  it('includes DCL, load, FCP and LCP when all are present', () => {
    const lines = milestoneLines({
      domContentLoadedMs: 300, loadEventMs: 500, firstContentfulPaintMs: 250, lcpMs: 400,
    });
    expect(lines.map(l => l.label)).toEqual(['DCL', 'Load', 'FCP', 'LCP']);
    expect(lines.map(l => l.ms)).toEqual([300, 500, 250, 400]);
  });

  it('skips null milestones', () => {
    const lines = milestoneLines({
      domContentLoadedMs: 300, loadEventMs: 500, firstContentfulPaintMs: null, lcpMs: null,
    });
    expect(lines.map(l => l.label)).toEqual(['DCL', 'Load']);
  });
});

describe('axisTicks', () => {
  it('returns between 4 and 10 ticks for typical scales', () => {
    for (const max of [100, 530, 1000, 3210, 12000, 90000]) {
      const ticks = axisTicks(max);
      expect(ticks.length).toBeGreaterThanOrEqual(4);
      expect(ticks.length).toBeLessThanOrEqual(10);
      expect(ticks.every(t => t > 0 && t <= max)).toBe(true);
    }
  });

  it('uses 100ms steps at a ~600ms scale and 50ms steps at ~300ms', () => {
    expect(axisTicks(600)).toEqual([100, 200, 300, 400, 500, 600]);
    expect(axisTicks(300)).toEqual([50, 100, 150, 200, 250, 300]);
  });

  it('returns evenly spaced round steps', () => {
    expect(axisTicks(1000)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
  });

  it('returns no ticks for a non-positive scale', () => {
    expect(axisTicks(0)).toEqual([]);
  });
});

describe('formatTick', () => {
  it('formats sub-second ticks in ms', () => {
    expect(formatTick(200)).toBe('200 ms');
  });

  it('formats second-scale ticks in s, trimming trailing zeros', () => {
    expect(formatTick(2000)).toBe('2 s');
    expect(formatTick(2500)).toBe('2.5 s');
  });
});

describe('basename', () => {
  it('returns the last path segment', () => {
    expect(basename('/dist/assets/main-abc123.js')).toBe('main-abc123.js');
  });

  it('ignores a trailing slash', () => {
    expect(basename('/api/v1/')).toBe('v1');
  });

  it('falls back to the path itself when there is no segment', () => {
    expect(basename('/')).toBe('/');
  });
});
