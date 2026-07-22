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

  it('carries format subset on the content patch, and omits format for plain content', () => {
    const m: BrandingModel = { scene: 's', nodes: [
      { snapshotId: 'a', role: 'paragraph', name: 'M', description: 'msg',
        facets: { content: { text: '**b**', format: 'subset' } } },
      { snapshotId: 'b', role: 'heading', name: 'T', description: 'title',
        facets: { content: { text: 'Hi' } } },
    ] };
    const patches = leverPatchesFor(m);
    expect(patches).toContainEqual({ snapshotId: 'a', kind: 'content', text: '**b**', format: 'subset' });
    // plain patch is byte-identical to the pre-format shape — no format key at all
    expect(patches.find((p) => p.snapshotId === 'b')).toEqual({ snapshotId: 'b', kind: 'content', text: 'Hi' });
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

  // background is no longer a LeverPatch — emitScopedBlocks (css-emitter.ts) is the sole
  // owner of preview backgrounds, light and dark alike (see tests/parse/css-emitter.test.ts
  // and tests/ui/preview-compare.test.ts's "pinned-dark pane" scoped-blocks coverage).
});
