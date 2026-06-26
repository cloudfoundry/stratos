import { describe, it, expect } from 'vitest';
import { project } from '@/projection/projector';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in',
      description: 'sign-in button for the login page',
      value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
    { snapshotId: 'auth.login.title', role: 'heading', name: 'Sign in to Stratos',
      description: 'title for the login page',
      value: { kind: 'content', text: 'Sign in to Stratos' } },
    { snapshotId: 'auth.login.orphan', role: 'img', name: null,
      description: 'decorative flourish',
      value: { kind: 'asset', ref: 'flourish.svg' } },
  ],
};

const routing = {
  containers: { 'auth.login': 'login' },
  elements: {
    'auth.login.sign-in': { token: '--color-brand-500' },
    'auth.login.title': { config: 'title' },   // leaf field; inherits 'login' namespace
  },
};

describe('project', () => {
  it('routes a color node to a theme.css token as hex', () => {
    const r = project(model, routing);
    expect(r.tokens.get('--color-brand-500')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('routes a content leaf into the inherited config namespace', () => {
    const r = project(model, routing);
    expect(r.companyConfig).toMatchObject({ login: { title: 'Sign in to Stratos' } });
  });

  it('reports unmapped snapshot-ids instead of dropping them', () => {
    const r = project(model, routing);
    expect(r.unmapped).toContain('auth.login.orphan');
  });
});
