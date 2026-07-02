import { describe, it, expect } from 'vitest';
import { emitCss, emitScopedBlocks } from '@/parse/css-emitter';
import { parseCss } from '@/parse/css-parser';
import type { ElementNode } from '@/metadata/types';

function node(snapshotId: string, scopedBlock?: string): ElementNode {
  return {
    snapshotId,
    role: '',
    name: null,
    description: '',
    facets: {},
    ...(scopedBlock !== undefined ? { scopedBlock } : {}),
  };
}

// The scoped rule repeats the attribute selector 3× and adds a mode prefix:
// light `html:not(.dark-theme) [attr]×3` (0,4,1), dark `.dark-theme [attr]×3` (0,4,0).
// Either beats the snapshot's compound selectors (e.g. `.login-card h1` (0,1,1),
// `.dark-theme .login-card h1` (0,2,1)) without `!important` — company-config
// inline still wins. Empirically verified against the login snapshot.
const sel = (id: string) => `[stb-snapshot-id="${id}"]`.repeat(3);
// Light blocks are gated to :not(.dark-theme) so dark mode falls through to the snapshot's built-in rules.
const lightSel = (id: string) => `html:not(.dark-theme) ${sel(id)}`;

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

describe('emitScopedBlocks', () => {
  it('emits a snapshot-id-scoped rule for a node with a scoped block', () => {
    const out = emitScopedBlocks([node('auth.login.page.card.title', 'font-size: 18px')]);
    expect(out).toBe(`${lightSel('auth.login.page.card.title')} {\n  font-size: 18px;\n}`);
  });

  it('repeats the attribute selector to out-specify compound stylesheet rules', () => {
    const out = emitScopedBlocks([node('a.b', 'color: red')]);
    expect(out.match(/\[stb-snapshot-id="a\.b"\]/g)).toHaveLength(3); // (0,3,0)
  });

  it('terminates each declaration line so newline-separated declarations stay valid', () => {
    // a user naturally types one declaration per line without trailing semicolons
    const out = emitScopedBlocks([node('a.b', 'color: crimson\nfont-size: 60px')]);
    expect(out).toBe(`${lightSel('a.b')} {\n  color: crimson;\n  font-size: 60px;\n}`);
  });

  it('does not double-terminate lines that already end in a semicolon', () => {
    const out = emitScopedBlocks([node('a.b', 'color: red;\nfont-size: 12px;')]);
    expect(out).toBe(`${lightSel('a.b')} {\n  color: red;\n  font-size: 12px;\n}`);
  });

  it('skips nodes with no or blank scoped block', () => {
    expect(emitScopedBlocks([node('a.b'), node('a.c', '   ')])).toBe('');
  });

  it('returns empty string for no nodes', () => {
    expect(emitScopedBlocks([])).toBe('');
  });

  it('orders rules deterministically by snapshotId', () => {
    const out = emitScopedBlocks([node('z.last', 'color: red'), node('a.first', 'color: blue')]);
    expect(out.indexOf('a.first')).toBeLessThan(out.indexOf('z.last'));
  });

  it('joins multiple rules with a blank line', () => {
    const out = emitScopedBlocks([node('a.one', 'color: red'), node('a.two', 'color: blue')]);
    expect(out).toBe(
      `${lightSel('a.one')} {\n  color: red;\n}\n\n${lightSel('a.two')} {\n  color: blue;\n}`,
    );
  });

  it('emits a dark gradient layer stack in the .dark-theme block for a node with facetsDark.background', () => {
    const n: ElementNode = {
      snapshotId: 'a.hero',
      role: '',
      name: null,
      description: '',
      facets: {},
      facetsDark: {
        background: {
          layers: [{ kind: 'gradient', gradient: {
            type: 'linear', angle: '90deg',
            stops: [{ color: { literal: '#111111' } }, { color: { literal: '#222222' } }],
          } }],
        },
      },
    };
    const out = emitScopedBlocks([n]);
    const darkSel = `.dark-theme ${sel('a.hero')}`;
    expect(out).toContain(`${darkSel} {`);
    expect(out).toContain('background-image: linear-gradient(90deg, #111111, #222222);');
    expect(out).not.toContain('html:not(.dark-theme)'); // no light block: facets is empty
  });
});
