import { describe, it, expect } from 'vitest';
import { findMissing } from '@/parse/completeness';

describe('findMissing', () => {
  it('returns empty when all required tokens present in both blocks', () => {
    const required = new Set(['--color-brand-500', '--color-primary']);
    const root = new Map([
      ['--color-brand-500', '#aaa'],
      ['--color-primary', '#bbb'],
    ]);
    const dark = new Map([
      ['--color-brand-500', '#ccc'],
      ['--color-primary', '#ddd'],
    ]);
    expect(findMissing(required, root, dark)).toEqual({ root: [], dark: [] });
  });

  it('reports missing root tokens', () => {
    const required = new Set(['--color-brand-500', '--color-primary']);
    const root = new Map([['--color-brand-500', '#aaa']]);
    const dark = new Map([['--color-brand-500', '#ccc'], ['--color-primary', '#ddd']]);
    expect(findMissing(required, root, dark)).toEqual({
      root: ['--color-primary'],
      dark: [],
    });
  });

  it('reports missing dark tokens', () => {
    const required = new Set(['--color-brand-500']);
    const root = new Map([['--color-brand-500', '#aaa']]);
    const dark = new Map<string, string>();
    expect(findMissing(required, root, dark)).toEqual({
      root: [],
      dark: ['--color-brand-500'],
    });
  });

  it('result lists are alphabetized', () => {
    const required = new Set(['--color-z', '--color-a', '--color-m']);
    const root = new Map<string, string>();
    const dark = new Map<string, string>();
    expect(findMissing(required, root, dark).root).toEqual(['--color-a', '--color-m', '--color-z']);
  });
});
