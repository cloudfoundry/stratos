import { describe, it, expect } from 'vitest';
import { mergeScenes } from '@/state/global-branding';
import type { BrandingModel } from '@/metadata/types';

const login: BrandingModel = { scene: 'login', nodes: [
  { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in', description: 'b', facets: {}, value: { kind: 'color', oklch: { l: 0.5, c: 0.1, h: 250 } } },
] };
const apps: BrandingModel = { scene: 'app-list', nodes: [
  { snapshotId: 'cf.applications.heading', role: 'heading', name: 'Heading', description: 'h', facets: {}, value: { kind: 'content', text: 'Applications' } },
] };

describe('mergeScenes', () => {
  it('flattens scenes into scene-tagged NavNodes', () => {
    const merged = mergeScenes([{ scene: 'login', model: login }, { scene: 'app-list', model: apps }]);
    expect(merged).toHaveLength(2);
    expect(merged.find((n) => n.snapshotId === 'cf.applications.heading')?.scene).toBe('app-list');
    expect(merged.find((n) => n.snapshotId === 'auth.login.sign-in')?.scene).toBe('login');
  });
  it('returns [] for no scenes', () => {
    expect(mergeScenes([])).toEqual([]);
  });
});
