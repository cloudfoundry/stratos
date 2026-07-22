import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { brandingModel, nodeFor, setNodeFacets, setNodeFacetsDark, setNodeVisibility, setNodeScopedBlock, loadBrandingModel, resetNode } from '@/state/branding';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title',
      facets: { content: { text: 'Sign in to Stratos' } } },
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
      facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } } },
  ],
};

describe('branding state', () => {
  beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(model)); });

  it('nodeFor returns the node by snapshotId', () => {
    expect(nodeFor('auth.login.title')?.facets.content?.text).toBe('Sign in to Stratos');
  });

  it('setNodeFacets replaces one node facets immutably', () => {
    const before = brandingModel.value;
    setNodeFacets('auth.login.title', { content: { text: 'Welcome' } });
    expect(nodeFor('auth.login.title')?.facets.content?.text).toBe('Welcome');
    expect(brandingModel.value).not.toBe(before); // new reference → reactivity
    // other node untouched
    expect(nodeFor('auth.login.sign-in')?.facets.text?.color).toBeDefined();
  });

  it('setNodeVisibility updates the node visibility immutably', () => {
    brandingModel.value = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.logo', role: 'img', name: 'L', description: 'logo',
          facets: { asset: { ref: 'logo.svg' } }, visibility: true },
      ],
    };
    const before = brandingModel.value;
    setNodeVisibility('auth.login.logo', false);
    expect(nodeFor('auth.login.logo')?.visibility).toBe(false);
    expect(brandingModel.value).not.toBe(before); // new reference → reactivity
  });

  it('setNodeFacetsDark stores a parallel dark bundle without touching facets', () => {
    brandingModel.value = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.page', role: 'region', name: 'P', description: 'page',
          facets: { background: { color: { literal: { l: 0.95, c: 0.02, h: 250 } } } } },
      ],
    };
    setNodeFacetsDark('auth.login.page', { background: { color: { literal: { l: 0.2, c: 0.02, h: 250 } } } });
    const n = nodeFor('auth.login.page')!;
    expect(n.facetsDark?.background?.color).toEqual({ literal: { l: 0.2, c: 0.02, h: 250 } });
    expect(n.facets.background?.color).toEqual({ literal: { l: 0.95, c: 0.02, h: 250 } }); // light untouched
  });

  it('setNodeScopedBlock sets the scoped block on one node immutably', () => {
    const before = brandingModel.value;
    setNodeScopedBlock('auth.login.title', 'font-size: 18px');
    expect(nodeFor('auth.login.title')?.scopedBlock).toBe('font-size: 18px');
    expect(brandingModel.value).not.toBe(before); // new reference → reactivity
    expect(nodeFor('auth.login.sign-in')?.scopedBlock).toBeUndefined(); // others untouched
  });
});

describe('resetNode', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('restores one node to the loaded pristine state, leaving other edits alone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(model), { headers: { 'content-type': 'application/json' } })));
    await loadBrandingModel('login');
    setNodeFacets('auth.login.title', { content: { text: 'Edited' } });
    setNodeFacetsDark('auth.login.title', { text: { color: { literal: 'transparent' } } });
    setNodeScopedBlock('auth.login.title', 'color: red');
    setNodeFacets('auth.login.sign-in', { text: {} });

    const restored = resetNode('auth.login.title');
    expect(restored?.facets.content?.text).toBe('Sign in to Stratos');
    const n = nodeFor('auth.login.title')!;
    expect(n.facets.content?.text).toBe('Sign in to Stratos');
    expect(n.facetsDark).toBeUndefined();
    expect(n.scopedBlock).toBeUndefined();
    // sibling's edit survives — reset is per-element, not per-scene
    expect(nodeFor('auth.login.sign-in')?.facets.text).toEqual({});
  });

  it('is a safe no-op when no pristine model is loaded', async () => {
    // a failed load clears the pristine copy left by any earlier test
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await loadBrandingModel('whatever');
    brandingModel.value = JSON.parse(JSON.stringify(model));
    expect(resetNode('auth.login.title')).toBeUndefined();
  });
});

describe('loadBrandingModel', () => {
  beforeEach(() => { brandingModel.value = null; });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sets the model on a valid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { ok: true, headers: { get: () => 'application/json' }, json: async () => model } as unknown as Response));
    await loadBrandingModel('login');
    expect(brandingModel.value?.scene).toBe('login');
  });

  it('sets null without throwing when the scene has no model (HTML fallback)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      { ok: true, headers: { get: () => 'text/html' },
        json: async () => { throw new Error('Unexpected token <'); } } as unknown as Response));
    await expect(loadBrandingModel('app-list')).resolves.toBeUndefined();
    expect(brandingModel.value).toBeNull();
  });

  it('sets null without throwing when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await expect(loadBrandingModel('whatever')).resolves.toBeUndefined();
    expect(brandingModel.value).toBeNull();
  });
});
