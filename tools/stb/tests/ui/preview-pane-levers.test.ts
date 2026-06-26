import { describe, it, expect } from 'vitest';
import { leverPatchesFor } from '@/ui/preview-pane';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.title', role: 'heading', name: 'T', description: 'title',
      value: { kind: 'content', text: 'Hi' } },
    { snapshotId: 'auth.login.logo', role: 'img', name: 'L', description: 'logo',
      value: { kind: 'asset', ref: 'logo.png' } },
    { snapshotId: 'auth.login.show-logo', role: 'img', name: 'V', description: 'show logo',
      value: { kind: 'visibility', shown: false } },
    { snapshotId: 'auth.login.sign-in', role: 'button', name: 'S', description: 'btn',
      value: { kind: 'color', oklch: { l: 0.5, c: 0.1, h: 250 } } },
  ],
};

describe('leverPatchesFor', () => {
  it('maps content/asset/visibility nodes to patches and skips colors', () => {
    const patches = leverPatchesFor(model);
    expect(patches).toEqual([
      { snapshotId: 'auth.login.title', kind: 'content', text: 'Hi' },
      { snapshotId: 'auth.login.logo', kind: 'asset', ref: 'logo.png' },
      { snapshotId: 'auth.login.show-logo', kind: 'visibility', shown: false },
    ]);
  });
});
