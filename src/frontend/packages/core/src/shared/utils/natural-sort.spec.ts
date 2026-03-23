import { describe, it, expect } from 'vitest';

import { naturalCompare, naturalCollator } from './natural-sort';

describe('naturalCompare', () => {
  it('sorts numeric segments naturally', () => {
    const input = ['app-1', 'app-10', 'app-2', 'app-20', 'app-3'];
    const sorted = [...input].sort(naturalCompare);
    expect(sorted).toEqual(['app-1', 'app-2', 'app-3', 'app-10', 'app-20']);
  });

  it('handles multiple numeric groups', () => {
    const input = ['v1.10.1', 'v1.2.10', 'v1.2.3', 'v2.1.0'];
    const sorted = [...input].sort(naturalCompare);
    expect(sorted).toEqual(['v1.2.3', 'v1.2.10', 'v1.10.1', 'v2.1.0']);
  });

  it('is case-insensitive', () => {
    expect(naturalCompare('App-2', 'app-2')).toBe(0);
    const input = ['App-10', 'app-1', 'APP-2'];
    const sorted = [...input].sort(naturalCompare);
    expect(sorted).toEqual(['app-1', 'APP-2', 'App-10']);
  });

  it('sorts pure alpha strings alphabetically', () => {
    const input = ['cherry', 'apple', 'banana'];
    const sorted = [...input].sort(naturalCompare);
    expect(sorted).toEqual(['apple', 'banana', 'cherry']);
  });

  it('sorts numeric-only strings numerically', () => {
    const input = ['3', '1', '20', '10'];
    const sorted = [...input].sort(naturalCompare);
    expect(sorted).toEqual(['1', '3', '10', '20']);
  });

  it('handles null values without throwing', () => {
    expect(() => naturalCompare(null as any, 'a')).not.toThrow();
    expect(() => naturalCompare('a', null as any)).not.toThrow();
    expect(() => naturalCompare(null as any, null as any)).not.toThrow();
  });

  it('handles empty strings', () => {
    expect(naturalCompare('', '')).toBe(0);
    expect(naturalCompare('', 'a')).toBeLessThan(0);
  });
});

describe('naturalCollator', () => {
  it('is an Intl.Collator instance', () => {
    expect(naturalCollator).toBeInstanceOf(Intl.Collator);
  });
});
