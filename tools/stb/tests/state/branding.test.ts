import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { brandingModel, nodeFor, setNodeValue, setNodeVisibility, loadBrandingModel } from '@/state/branding';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title',
      value: { kind: 'content', text: 'Sign in to Stratos' } },
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
      value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
  ],
};

describe('branding state', () => {
  beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(model)); });

  it('nodeFor returns the node by snapshotId', () => {
    expect(nodeFor('auth.login.title')?.value).toEqual({ kind: 'content', text: 'Sign in to Stratos' });
  });

  it('setNodeValue replaces one node value immutably', () => {
    const before = brandingModel.value;
    setNodeValue('auth.login.title', { kind: 'content', text: 'Welcome' });
    expect(nodeFor('auth.login.title')?.value).toEqual({ kind: 'content', text: 'Welcome' });
    expect(brandingModel.value).not.toBe(before); // new reference → reactivity
    expect(nodeFor('auth.login.sign-in')?.value).toEqual({ kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } });
  });

  it('setNodeVisibility updates the node visibility immutably', () => {
    brandingModel.value = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.logo', role: 'img', name: 'L', description: 'logo',
          value: { kind: 'asset', ref: 'logo.svg' }, visibility: true },
      ],
    };
    const before = brandingModel.value;
    setNodeVisibility('auth.login.logo', false);
    expect(nodeFor('auth.login.logo')?.visibility).toBe(false);
    expect(brandingModel.value).not.toBe(before); // new reference → reactivity
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
