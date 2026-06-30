import { describe, it, expect } from 'vitest';
import { project, projectDark } from '@/projection/projector';
import { oklchToHex } from '@/color/oklch';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in',
      description: 'sign-in button for the login page',
      facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } } },
    { snapshotId: 'auth.login.title', role: 'heading', name: 'Sign in to Stratos',
      description: 'title for the login page',
      facets: { content: { text: 'Sign in to Stratos' } } },
    { snapshotId: 'auth.login.orphan', role: 'img', name: null,
      description: 'decorative flourish',
      facets: { asset: { ref: 'flourish.svg' } } },
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

  it('expands a scale-role color entry across the brand scale', () => {
    const m = { scene: 'login', nodes: [
      { snapshotId: 'app.shell.brand', role: 'img', name: null,
        description: 'brand color',
        facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } } },
    ] };
    const r = project(m, { elements: { 'app.shell.brand': { token: '--color-brand-500', oklchRole: 'scale' } } });
    expect(r.tokens.get('--color-brand-50')).toMatch(/^#[0-9a-f]{6}$/);
    expect(r.tokens.get('--color-brand-900')).toMatch(/^#[0-9a-f]{6}$/);
    expect(r.tokens.size).toBe(10);
  });

  it('picks the longest matching container prefix', () => {
    const m = { scene: 'x', nodes: [
      { snapshotId: 'auth.login.title', role: 'heading', name: 'T',
        description: 'title', facets: { content: { text: 'Hi' } } },
    ] };
    const r = project(m, {
      containers: { 'auth': 'a', 'auth.login': 'login' },
      elements: { 'auth.login.title': { config: 'title' } },
    });
    expect(r.companyConfig).toMatchObject({ login: { title: 'Hi' } });
  });

  it('reads color from facets (surface.background literal)', () => {
    const m = { scene: 'login', nodes: [{
      snapshotId: 'auth.login.page', role: '', name: null, description: '',
      facets: { surface: { background: { literal: { l: 0.97, c: 0.01, h: 250 } } } },
    }] };
    const r = project(m, {
      containers: { 'auth.login': 'login' },
      elements: { 'auth.login.page': { config: 'backgroundColor' } },
    });
    expect((r.companyConfig as any).login.backgroundColor).toMatch(/^#/);
  });

  it('projects element visibility into its routed show-field', () => {
    const model = { scene: 'login', nodes: [
      { snapshotId: 'auth.login.logo', role: 'img', name: null,
        description: '', facets: { asset: { ref: 'logo.svg' } }, visibility: false },
    ]};
    const routing = { containers: { 'auth.login': 'login' },
      elements: { 'auth.login.logo': { config: 'logos.main', visibilityConfig: 'showLogo' } } };
    const r = project(model, routing);
    expect(r.companyConfig).toMatchObject({ logos: { main: 'logo.svg' }, login: { showLogo: false } });
  });

  it('routes a facet property to its company-config key via nested properties', () => {
    const model = { scene: 'login', nodes: [{
      snapshotId: 'auth.login.page.card.sign-in', role: '', name: null, description: '',
      facets: { text: { color: { literal: { l: 0.5, c: 0.2, h: 250 } } } },
    }] };
    const routing = { containers: { 'auth.login': 'login' }, elements: {
      'auth.login.page.card.sign-in': { properties: { 'text.color': { config: 'theme.primary' } } },
    } };
    const out = project(model as any, routing as any);
    expect((out.companyConfig as any).theme.primary).toMatch(/^#/);
  });

  it('expands a scale-role color via the nested properties path', () => {
    // Exercises the properties[key].token + oklchRole:'scale' branch — previously uncovered.
    const m = { scene: 'login', nodes: [
      { snapshotId: 'app.shell.brand', role: 'img', name: null,
        description: 'brand color',
        facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } } },
    ] };
    const r = project(m as any, { elements: {
      'app.shell.brand': { properties: { 'text.color': { token: '--color-brand-500', oklchRole: 'scale' } } },
    } } as any);
    expect(r.tokens.get('--color-brand-50')).toMatch(/^#[0-9a-f]{6}$/);
    expect(r.tokens.get('--color-brand-900')).toMatch(/^#[0-9a-f]{6}$/);
    expect(r.tokens.size).toBe(10);
  });
});

describe('projectDark', () => {
  const oklch = { l: 0.55, c: 0.15, h: 250 };

  it('routes a facetsDark color node to the dark token map', () => {
    const m: BrandingModel = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in',
          description: 'sign-in button for the login page',
          facets: { text: { color: { literal: { l: 0.2, c: 0.05, h: 250 } } } },
          facetsDark: { text: { color: { literal: oklch } } } },
      ],
    };
    const routing = {
      elements: {
        'auth.login.sign-in': { properties: { 'text.color': { token: '--color-x' } } },
      },
    };
    const r = projectDark(m, routing as any);
    expect(r.get('--color-x')).toBe(oklchToHex(oklch));
  });

  it('contributes nothing for a node with no facetsDark', () => {
    const m: BrandingModel = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in',
          description: 'sign-in button for the login page',
          facets: { text: { color: { literal: oklch } } } },
      ],
    };
    const routing = {
      elements: {
        'auth.login.sign-in': { properties: { 'text.color': { token: '--color-x' } } },
      },
    };
    const r = projectDark(m, routing as any);
    expect(r.size).toBe(0);
  });
});
