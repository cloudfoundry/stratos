import { describe, it, expect } from 'vitest';

import { ResourceRow } from '../diagnostics-data/load-performance';
import { BYTES_BAR_COUNT, barWidthPercent, shareOfTotal, topByTransfer } from './bytes-bar.component';

const row = (transferBytes: number, over: Partial<ResourceRow> = {}): ResourceRow => ({
  path: '/main.js',
  startMs: 0,
  durationMs: 10,
  transferBytes,
  decodedBytes: transferBytes * 2,
  protocol: 'h2',
  cached: false,
  ...over,
});

describe('topByTransfer', () => {
  it('returns rows sorted by transfer size, largest first', () => {
    const top = topByTransfer([row(10), row(300), row(200)]);
    expect(top.map(r => r.transferBytes)).toEqual([300, 200, 10]);
  });

  it('caps at the top N rows', () => {
    const many = Array.from({ length: BYTES_BAR_COUNT + 4 }, (_, i) => row(i + 1));
    const top = topByTransfer(many);
    expect(top.length).toBe(BYTES_BAR_COUNT);
    expect(top[0].transferBytes).toBe(BYTES_BAR_COUNT + 4);
  });

  it('does not mutate its input', () => {
    const input = [row(1), row(2)];
    topByTransfer(input);
    expect(input[0].transferBytes).toBe(1);
  });
});

describe('shareOfTotal', () => {
  it('returns the percentage of the total', () => {
    expect(shareOfTotal(250, 1000)).toBe(25);
  });

  it('returns 0 for a non-positive total', () => {
    expect(shareOfTotal(250, 0)).toBe(0);
  });
});

describe('barWidthPercent', () => {
  it('scales linearly against the max', () => {
    expect(barWidthPercent(50, 200)).toBe(25);
    expect(barWidthPercent(200, 200)).toBe(100);
  });

  it('returns 0 for a non-positive max', () => {
    expect(barWidthPercent(50, 0)).toBe(0);
  });
});
