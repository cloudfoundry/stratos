import { describe, it, expect } from 'vitest';
import { leverPatchesFor } from '@/ui/preview-pane';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title',
      facets: { content: { text: 'Hi' } } },
    { snapshotId: 'auth.login.logo', role: 'img', name: 'L', description: 'logo',
      facets: { asset: { ref: 'logo.png' } }, visibility: false },
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
      facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } } },
  ],
};

describe('leverPatchesFor', () => {
  it('maps content and asset nodes to patches and skips colors', () => {
    const patches = leverPatchesFor(model);
    expect(patches).toContainEqual({ snapshotId: 'auth.login.title', kind: 'content', text: 'Hi' });
    expect(patches).toContainEqual({ snapshotId: 'auth.login.logo', kind: 'asset', ref: 'logo.png' });
    // color node (sign-in) produces no patch; total patches = 3 (title content, logo asset, logo visibility)
    expect(patches.filter((p) => p.snapshotId === 'auth.login.sign-in')).toHaveLength(0);
  });

  it('emits a visibility patch from the node visibility field', () => {
    const patches = leverPatchesFor(model);
    expect(patches).toContainEqual({ snapshotId: 'auth.login.logo', kind: 'visibility', shown: false });
  });

  it('emits both asset and visibility patches for a node with both', () => {
    const patches = leverPatchesFor(model);
    const logo = patches.filter((p) => p.snapshotId === 'auth.login.logo');
    expect(logo).toContainEqual({ snapshotId: 'auth.login.logo', kind: 'asset', ref: 'logo.png' });
    expect(logo).toContainEqual({ snapshotId: 'auth.login.logo', kind: 'visibility', shown: false });
  });

  it('omits a visibility patch for a node without the visibility field', () => {
    const patches = leverPatchesFor(model);
    const vis = patches.filter((p) => p.kind === 'visibility');
    expect(vis.every((p) => p.snapshotId === 'auth.login.logo')).toBe(true);
  });

  it('emits content/asset preview patches from facets', () => {
    const nodes = [
      { snapshotId: 'a', role: 'heading', name: 'A', description: '',
        facets: { content: { text: 'Hi' } } },
      { snapshotId: 'b', role: 'img', name: 'B', description: '',
        facets: { asset: { ref: 'logo.svg' } } },
    ];
    const patches = leverPatchesFor({ scene: 's', nodes } as any);
    expect(patches).toContainEqual({ snapshotId: 'a', kind: 'content', text: 'Hi' });
    expect(patches).toContainEqual({ snapshotId: 'b', kind: 'asset', ref: 'logo.svg' });
  });

  it('emits a composed background patch (raw color + reversed-layer image) for a node with a background facet', () => {
    const nodes = [
      { snapshotId: 'a.card', role: 'region', name: 'Card', description: '',
        facets: { background: {
          color: { literal: '#0b3d91' },
          layers: [{ kind: 'image', ref: 'assets/hero.jpg' }],
        } } },
    ];
    const patches = leverPatchesFor({ scene: 's', nodes } as any);
    expect(patches).toContainEqual({
      snapshotId: 'a.card', kind: 'background',
      backgroundColor: '#0b3d91', backgroundImage: 'url(assets/hero.jpg)',
    });
  });
});

describe('leverPatchesFor dark-aware background', () => {
  const bgModel = {
    scene: 's',
    nodes: [
      { snapshotId: 'a.card', role: 'region', name: 'C', description: '',
        facets: { background: { color: { literal: '#eeeeee' } } } },
      { snapshotId: 'a.hero', role: 'region', name: 'H', description: '',
        facets: { background: { color: { literal: '#dddddd' } } },
        facetsDark: { background: { color: { literal: '#111111' } } } },
    ],
  } as any;

  it('light mode composes the background patch from facets.background', () => {
    const patches = leverPatchesFor(bgModel, false);
    expect(patches).toContainEqual({ snapshotId: 'a.card', kind: 'background', backgroundColor: '#eeeeee' });
    expect(patches).toContainEqual({ snapshotId: 'a.hero', kind: 'background', backgroundColor: '#dddddd' });
  });

  it('dark mode with no facetsDark.background emits NO background patch (dark CSS owns it)', () => {
    const patches = leverPatchesFor(bgModel, true);
    expect(patches.filter((p) => p.snapshotId === 'a.card' && p.kind === 'background')).toHaveLength(0);
  });

  it('dark mode composes the background patch from facetsDark.background when present', () => {
    const patches = leverPatchesFor(bgModel, true);
    expect(patches).toContainEqual({ snapshotId: 'a.hero', kind: 'background', backgroundColor: '#111111' });
    // and never from the light bundle
    expect(patches.filter((p) => p.kind === 'background' && (p as any).backgroundColor === '#dddddd')).toHaveLength(0);
  });
});
