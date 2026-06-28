import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project } from '@/projection/projector';
import { buildBundle } from '@/export/bundle-builder';
import type { BrandingModel } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';

const dir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../public/snapshots/v1/login');
const model = JSON.parse(readFileSync(resolve(dir, 'branding-model.json'), 'utf8')) as BrandingModel;
const routing = JSON.parse(readFileSync(resolve(dir, 'routing.json'), 'utf8')) as RoutingMap;

describe('login projection end-to-end', () => {
  it('projects the login model into a company-config.json with login.title', () => {
    const r = project(model, routing);
    const bundle = buildBundle({
      name: 'Login brand',
      id: 'login-brand',
      description: '',
      root: r.tokens,
      dark: new Map(),
      assets: [],
      companyConfig: r.companyConfig,
    });
    expect(bundle.files['company-config.json']).toContain('"title": "Sign in to Stratos"');
    expect(r.unmapped).toEqual([]);
  });

  it('projects the FULL login lever set into company-config + a token', () => {
    const r = project(model, routing);
    expect(r.companyConfig).toMatchObject({
      login: {
        title: 'Sign in to Stratos',
        subtitle: 'Multi-cloud management',
        customMessage: 'Authorized users only',
        showLogo: true,
        showTitle: true,
        backgroundColor: expect.stringMatching(/^#[0-9a-f]{6}$/),
        cardBackground: expect.stringMatching(/^#[0-9a-f]{6}$/),
      },
      logos: { main: 'logo.svg', loginBackground: 'login-bg.svg' },
      theme: { primary: expect.stringMatching(/^#[0-9a-f]{6}$/), danger: expect.stringMatching(/^#[0-9a-f]{6}$/) },
    });
    expect(r.unmapped).toEqual([]);
  });
});
