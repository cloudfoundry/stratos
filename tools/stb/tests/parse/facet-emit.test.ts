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
  const nodes = [{ snapshotId: 'x', facets: { spacing: { padding: { literal: '8px' } } }, scopedBlock: 'opacity: 0.9' }];
  const css = emitScopedBlocks(nodes as any);
  expect(css).toContain('padding: 8px;');
  expect(css).toContain('opacity: 0.9;');
});

it('emits a .dark-theme scoped block from facetsDark, after the light block', () => {
  const css = emitScopedBlocks([
    n('auth.login.page',
      { surface: { background: { literal: { l: 0.95, c: 0.02, h: 250 } } } },
      { surface: { background: { literal: { l: 0.2, c: 0.02, h: 250 } } } }),
  ]);
  const light = '[stb-snapshot-id="auth.login.page"][stb-snapshot-id="auth.login.page"][stb-snapshot-id="auth.login.page"]';
  const dark = '.dark-theme ' + light;
  expect(css).toContain(`${light} {`);
  expect(css).toContain(`${dark} {`);
  expect(css.indexOf(`${light} {`)).toBeLessThan(css.indexOf(`${dark} {`)); // light before dark
});

it('skips a node with no facetsDark (no dark block)', () => {
  const css = emitScopedBlocks([
    n('auth.login.page', { surface: { background: { literal: { l: 0.95, c: 0.02, h: 250 } } } }),
  ]);
  expect(css).not.toContain('.dark-theme');
});

it('skips a dark {token} value (literals only in this slice)', () => {
  const css = emitScopedBlocks([
    n('auth.login.page',
      { surface: { background: { literal: { l: 0.95, c: 0.02, h: 250 } } } },
      { surface: { background: { token: '--color-brand-900' } } }),
  ]);
  expect(css).not.toContain('.dark-theme'); // token-dark routing is out of scope; nothing literal to emit
});
