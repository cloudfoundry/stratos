import { describe, it, expect, beforeEach } from 'vitest';
import { brandingModel, nodeFor, setNodeValue } from '@/state/branding';
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
});
