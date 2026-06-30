import { describe, it, expect, beforeEach } from 'vitest';
import { brandingModel, nodeFor } from '@/state/branding';
import { rootValues } from '@/state/tokens';
import { applyEdit } from '@/ui/element-edit';
import type { BrandingModel } from '@/metadata/types';

const routing = { containers: { 'auth.login': 'login' }, elements: {
  'auth.login.title': { config: 'title' },
  'auth.login.sign-in': { token: '--color-brand-500' },
} };
const model: BrandingModel = { scene: 'login', nodes: [
  { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title', facets: { content: { text: 'A' } } },
  { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn', facets: {} },
] };

describe('applyEdit', () => {
  beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(model)); rootValues.value = new Map(); });

  it('content edit updates the model node', () => {
    applyEdit('auth.login.title', { kind: 'content', text: 'B' }, routing);
    expect(nodeFor('auth.login.title')?.facets.content?.text).toBe('B');
  });
  it('color edit re-projects to the bound token', () => {
    applyEdit('auth.login.sign-in', { kind: 'color', oklch: { l: 0.6, c: 0.12, h: 200 } }, routing);
    expect(rootValues.value.get('--color-brand-500')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('applyEdit facets write-back', () => {
  const facetModel: BrandingModel = { scene: 'login', nodes: [
    { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title',
      facets: { content: { text: 'A' } } },
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
      facets: { surface: { background: { literal: { l: 0.5, c: 0.1, h: 250 } } } } },
  ] };
  beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(facetModel)); rootValues.value = new Map(); });

  it('opens the primary lever from facets and writes the edit back into facets', () => {
    applyEdit('auth.login.title', { kind: 'content', text: 'B' }, routing);
    expect(nodeFor('auth.login.title')?.facets.content?.text).toEqual('B');
  });

  it('writes a color edit back into the surface.background facet', () => {
    const newOklch = { l: 0.6, c: 0.12, h: 200 };
    applyEdit('auth.login.sign-in', { kind: 'color', oklch: newOklch }, routing);
    expect(nodeFor('auth.login.sign-in')?.facets.surface?.background).toEqual({ literal: newOklch });
  });
});
