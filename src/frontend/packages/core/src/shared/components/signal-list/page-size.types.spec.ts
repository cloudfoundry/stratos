import { describe, it, expect } from 'vitest';

import {
  PAGE_SIZE_ALL,
  isPageSizeSentinel,
  resolvePageSize,
  getPageSizeLabel,
} from './page-size.types';

describe('page-size.types', () => {
  it('isPageSizeSentinel is true for PAGE_SIZE_ALL, false for a literal size', () => {
    expect(isPageSizeSentinel(PAGE_SIZE_ALL)).toBe(true);
    expect(isPageSizeSentinel(25)).toBe(false);
  });

  it('resolvePageSize resolves ALL to the total (min 1) and passes literals through', () => {
    expect(resolvePageSize(PAGE_SIZE_ALL, 42)).toBe(42);
    expect(resolvePageSize(PAGE_SIZE_ALL, 0)).toBe(1);
    expect(resolvePageSize(25, 42)).toBe(25);
  });

  it('getPageSizeLabel returns "All" for the sentinel and the number string otherwise', () => {
    expect(getPageSizeLabel(PAGE_SIZE_ALL)).toBe('All');
    expect(getPageSizeLabel(25)).toBe('25');
  });
});
