import { it, expect } from 'vitest';
import { emitScopedBlocks } from '@/parse/css-emitter';

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
