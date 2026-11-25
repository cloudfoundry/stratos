import { describe, expect, it } from 'vitest';
import { LatestCall } from './latest-call';

describe('LatestCall', () => {
  it('keeps only the newest call of each key', () => {
    const latest = new LatestCall();
    const a1 = latest.begin('a');
    const b1 = latest.begin('b');
    const a2 = latest.begin('a');
    expect(latest.isLatest(a1, 'a')).toBe(false);
    expect(latest.isLatest(a2, 'a')).toBe(true);
    expect(latest.isLatest(b1, 'b')).toBe(true);
    expect(latest.isLatest(latest.begin())).toBe(true);
  });
});
