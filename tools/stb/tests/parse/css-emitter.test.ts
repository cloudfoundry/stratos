import { describe, it, expect } from 'vitest';
import { emitCss } from '@/parse/css-emitter';
import { parseCss } from '@/parse/css-parser';

describe('emitCss', () => {
  it('emits :root block when only root values present', () => {
    const root = new Map([['--color-brand-500', '#1e88e5']]);
    const dark = new Map<string, string>();
    const out = emitCss(root, dark);
    expect(out).toContain(':root {');
    expect(out).toContain('--color-brand-500: #1e88e5;');
    expect(out).not.toContain('.dark-theme');
  });

  it('emits both blocks when both have values', () => {
    const root = new Map([['--color-brand-500', '#1e88e5']]);
    const dark = new Map([['--color-brand-500', '#42a5f5']]);
    const out = emitCss(root, dark);
    expect(out).toContain(':root {');
    expect(out).toContain('.dark-theme {');
    expect(out.indexOf(':root')).toBeLessThan(out.indexOf('.dark-theme'));
  });

  it('emits empty string when both maps are empty', () => {
    expect(emitCss(new Map(), new Map()).trim()).toBe('');
  });

  it('produces deterministic ordering (alphabetical by token name)', () => {
    const root = new Map([
      ['--color-brand-600', '#1976d2'],
      ['--color-brand-500', '#1e88e5'],
      ['--color-brand-400', '#42a5f5'],
    ]);
    const out = emitCss(root, new Map());
    const i400 = out.indexOf('--color-brand-400');
    const i500 = out.indexOf('--color-brand-500');
    const i600 = out.indexOf('--color-brand-600');
    expect(i400).toBeLessThan(i500);
    expect(i500).toBeLessThan(i600);
  });

  it('round-trip with parser preserves values', () => {
    const root = new Map([['--color-brand-500', '#1e88e5']]);
    const dark = new Map([['--color-brand-500', '#42a5f5']]);
    const emitted = emitCss(root, dark);
    const reparsed = parseCss(emitted);
    expect(reparsed.root.get('--color-brand-500')).toBe('#1e88e5');
    expect(reparsed.dark.get('--color-brand-500')).toBe('#42a5f5');
  });
});
