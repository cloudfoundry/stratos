import { describe, it, expect } from 'vitest';
import type { BrandingModel } from '@/metadata/types';
import { isColorNode } from '@/metadata/types';

describe('branding model types', () => {
  it('isColorNode narrows by lever kind', () => {
    const model: BrandingModel = {
      scene: 'login',
      nodes: [
        { snapshotId: 'auth.login.sign-in', role: 'button', name: 'Sign in',
          description: 'sign-in button for the login page',
          value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } } },
        { snapshotId: 'auth.login.title', role: 'heading', name: 'Sign in to Stratos',
          description: 'title for the login page',
          value: { kind: 'content', text: 'Sign in to Stratos' } },
      ],
    };
    expect(model.nodes.filter(isColorNode)).toHaveLength(1);
  });
});
