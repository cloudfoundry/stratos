import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandingModel } from '@/state/branding';
import { applyEdit } from '@/ui/element-edit';
import { exportInputs } from '@/ui/export-dialog';
import { buildBundle } from '@/export/bundle-builder';
import type { BrandingModel } from '@/metadata/types';
import type { RoutingMap } from '@/projection/projector';

const dir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../public/snapshots/v1/login');
const model = JSON.parse(readFileSync(resolve(dir, 'branding-model.json'), 'utf8')) as BrandingModel;
const routing = JSON.parse(readFileSync(resolve(dir, 'routing.json'), 'utf8')) as RoutingMap;

describe('login branding end-to-end (authoring)', () => {
  it('edits flow into the exported company-config.json', () => {
    brandingModel.value = JSON.parse(JSON.stringify(model));
    applyEdit('auth.login.page.card.title', { kind: 'content', text: 'Welcome to Acme Cloud' }, routing);
    // Set logo visibility to false by modifying the node directly
    const m = brandingModel.value;
    if (m) {
      brandingModel.value = {
        ...m,
        nodes: m.nodes.map((n) => (n.snapshotId === 'auth.login.page.card.logo' ? { ...n, visibility: false } : n)),
      };
    }
    applyEdit('auth.login.page.card.sign-in', { kind: 'color', oklch: { l: 0.6, c: 0.18, h: 20 } }, routing);

    const inputs = exportInputs(brandingModel.value, routing, new Map(), new Map(), []);
    const bundle = buildBundle({ name: 'Acme', id: 'acme', description: '', ...inputs });
    const cfg = JSON.parse(bundle.files['company-config.json']!);

    expect(cfg.login.title).toBe('Welcome to Acme Cloud');
    expect(cfg.login.showLogo).toBe(false);
    expect(cfg.theme.primary).toMatch(/^#[0-9a-f]{6}$/);
  });
});
