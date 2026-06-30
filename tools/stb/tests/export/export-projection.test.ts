import { describe, it, expect } from 'vitest';
import { exportInputs } from '@/ui/export-dialog';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = { scene: 'login', nodes: [
  { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title', value: { kind: 'content', text: 'Hi' } },
  { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn', value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
] };
const routing = { containers: { 'auth.login': 'login' }, elements: {
  'auth.login.title': { config: 'title' }, 'auth.login.sign-in': { token: '--color-brand-500' },
} };

describe('exportInputs', () => {
  it('merges projected tokens over root and includes companyConfig', () => {
    const out = exportInputs(model, routing, new Map([['--color-brand-50', '#eee']]), new Map(), []);
    expect(out.companyConfig).toMatchObject({ login: { title: 'Hi' } });
    expect(out.root.get('--color-brand-500')).toMatch(/^#[0-9a-f]{6}$/); // projected
    expect(out.root.get('--color-brand-50')).toBe('#eee');               // preserved
  });

  it('null model preserves root and omits companyConfig key', () => {
    const out = exportInputs(null, routing, new Map([['--x', '#000']]), new Map(), []);
    expect(out.root.get('--x')).toBe('#000');        // preserved
    expect('companyConfig' in out).toBe(false);      // key absent, no empty company-config.json
  });

  it('keeps token-first for a color node that also carries a scopedBlock, and exports the block', () => {
    const m: BrandingModel = { scene: 'login', nodes: [
      { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
        value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } },
        scopedBlock: 'font-size: 18px' },
    ] };
    const out = exportInputs(m, routing, new Map(), new Map(), []);
    expect(out.root.get('--color-brand-500')).toMatch(/^#[0-9a-f]{6}$/); // token-first still wins
    expect(out.scopedCss).toContain('[stb-snapshot-id="auth.login.sign-in"]'); // block also exported
  });
});
