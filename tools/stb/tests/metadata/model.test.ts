import { describe, it, expect } from 'vitest';
import type { BrandingModel } from '@/metadata/types';
import { isColorNode } from '@/metadata/types';
import { buildModel, type ValuesSidecar } from '../../scripts/generate-model';

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

describe('buildModel carries the scoped block', () => {
  const html =
    '<button stb-snapshot-id="auth.login.sign-in" stba-role="button" stba-description="sign-in button">Sign in</button>';

  it('copies scopedBlock from the values sidecar onto the node', () => {
    const values: ValuesSidecar = {
      'auth.login.sign-in': {
        name: 'Sign in',
        value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } },
        scopedBlock: 'font-size: 18px;',
      },
    };
    const model = buildModel('login', html, values);
    expect(model.nodes[0]!.scopedBlock).toBe('font-size: 18px;');
  });

  it('omits scopedBlock when the sidecar entry has none', () => {
    const values: ValuesSidecar = {
      'auth.login.sign-in': {
        name: 'Sign in',
        value: { kind: 'color', oklch: { l: 0.55, c: 0.15, h: 250 } },
      },
    };
    const model = buildModel('login', html, values);
    expect(model.nodes[0]!).not.toHaveProperty('scopedBlock');
  });
});
