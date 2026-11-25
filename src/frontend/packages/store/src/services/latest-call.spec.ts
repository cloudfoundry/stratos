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

  it('supersedes the calls of every matching key', () => {
    const latest = new LatestCall();
    const a = latest.begin('kube/ns-a');
    const b = latest.begin('kube');
    const c = latest.begin('other');
    latest.supersede(k => k.startsWith('kube'));
    expect(latest.isLatest(a, 'kube/ns-a')).toBe(false);
    expect(latest.isLatest(b, 'kube')).toBe(false);
    expect(latest.isLatest(c, 'other')).toBe(true);
  });
});
