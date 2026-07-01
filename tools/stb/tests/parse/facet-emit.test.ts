import { it, expect } from 'vitest';
import { emitScopedBlocks } from '@/parse/css-emitter';
import type { ElementNode } from '@/metadata/types';

function n(snapshotId: string, facets: ElementNode['facets'], facetsDark?: ElementNode['facets']): ElementNode {
  return { snapshotId, role: '', name: null, description: '', facets, ...(facetsDark ? { facetsDark } : {}) };
}

it('emits literal facet props into the scoped rule and skips token values', () => {
  const nodes = [{
    snapshotId: 'auth.login.page.card.title',
    facets: { text: { fontSize: { literal: '20px' }, color: { token: 'login-fg' } } },
  }];
  const css = emitScopedBlocks(nodes as any);
  expect(css).toContain('font-size: 20px;');
  expect(css).not.toContain('login-fg'); // token handled by projector, not here
  expect(css).toContain('[stb-snapshot-id="auth.login.page.card.title"][stb-snapshot-id="auth.login.page.card.title"][stb-snapshot-id="auth.login.page.card.title"]');
});

it('merges facet declarations with a free-form scopedBlock', () => {
  const nodes = [{ snapshotId: 'x', facets: { surface: { borderRadius: { literal: '8px' } } }, scopedBlock: 'opacity: 0.9' }];
  const css = emitScopedBlocks(nodes as any);
  expect(css).toContain('border-radius: 8px;');
  expect(css).toContain('opacity: 0.9;');
});

it('emits a .dark-theme scoped block from facetsDark, after the light block', () => {
  const css = emitScopedBlocks([
    n('auth.login.page',
      { background: { color: { literal: { l: 0.95, c: 0.02, h: 250 } } } },
      { background: { color: { literal: { l: 0.2, c: 0.02, h: 250 } } } }),
  ]);
  const attrSel = '[stb-snapshot-id="auth.login.page"][stb-snapshot-id="auth.login.page"][stb-snapshot-id="auth.login.page"]';
  const light = `html:not(.dark-theme) ${attrSel}`;
  const dark = `.dark-theme ${attrSel}`;
  expect(css).toContain(`${light} {`);
  expect(css).toContain(`${dark} {`);
  expect(css.indexOf(`${light} {`)).toBeLessThan(css.indexOf(`${dark} {`)); // light before dark
  // light block must not bleed into dark mode; dark block must not carry html:not
  expect(css.match(/html:not/g)?.length).toBe(1); // only in the light block prefix
  expect(css.match(/\.dark-theme \[stb/g)?.length).toBe(1); // only the dark override block
});

it('skips a node with no facetsDark (no dark block)', () => {
  const css = emitScopedBlocks([
    n('auth.login.page', { background: { color: { literal: { l: 0.95, c: 0.02, h: 250 } } } }),
  ]);
  // The light selector contains :not(.dark-theme) but no standalone dark override block should appear.
  expect(css).not.toContain('.dark-theme [stb-snapshot-id');
});

it('skips a dark {token} value (literals only in this slice)', () => {
  const css = emitScopedBlocks([
    n('auth.login.page',
      { background: { color: { literal: { l: 0.95, c: 0.02, h: 250 } } } },
      { background: { color: { token: '--color-brand-900' } } }),
  ]);
  // token-dark routing is out of scope; nothing literal to emit — no standalone dark block.
  expect(css).not.toContain('.dark-theme [stb-snapshot-id');
});

it('emits background composite (color backstop + reversed image layer) in the light block', () => {
  const css = emitScopedBlocks([{
    snapshotId: 'a.card', role: 'region', name: null, description: '',
    facets: { background: { color: { literal: '#0b3d91' }, layers: [{ kind: 'image', ref: 'assets/hero.jpg' }] } },
  } as any]);
  expect(css).toContain('background-color: #0b3d91;');
  expect(css).toContain('background-image: url(assets/hero.jpg);');
});
