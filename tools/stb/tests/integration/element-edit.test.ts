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
  { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title', value: { kind: 'content', text: 'A' } },
  { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn', value: { kind: 'color', oklch: { l: 0.5, c: 0.1, h: 250 } } },
] };

describe('applyEdit', () => {
  beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(model)); rootValues.value = new Map(); });

  it('content edit updates the model node', () => {
    applyEdit('auth.login.title', { kind: 'content', text: 'B' }, routing);
    expect(nodeFor('auth.login.title')?.value).toEqual({ kind: 'content', text: 'B' });
  });
  it('color edit re-projects to the bound token', () => {
    applyEdit('auth.login.sign-in', { kind: 'color', oklch: { l: 0.6, c: 0.12, h: 200 } }, routing);
    expect(rootValues.value.get('--color-brand-500')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
