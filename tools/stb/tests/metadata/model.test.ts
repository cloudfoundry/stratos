import { describe, it, expect } from 'vitest';
import { buildModel, type ValuesSidecar } from '../../scripts/generate-model';

describe('buildModel carries the scoped block', () => {
  const html =
    '<button stb-snapshot-id="auth.login.sign-in" stba-role="button" stba-description="sign-in button">Sign in</button>';

  it('copies scopedBlock from the values sidecar onto the node', () => {
    const values: ValuesSidecar = {
      'auth.login.sign-in': {
        name: 'Sign in',
        facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } },
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
        facets: { text: { color: { literal: { l: 0.55, c: 0.15, h: 250 } } } },
      },
    };
    const model = buildModel('login', html, values);
    expect(model.nodes[0]!).not.toHaveProperty('scopedBlock');
  });
});

describe('facets on ElementNode', () => {
  it('builds facets from the values.json facet shape', () => {
    const html = `<div stb-snapshot-id="x" stba-role="heading"></div>`;
    const values = { x: { name: 'X', facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } } } };
    const model = buildModel('s', html, values as any);
    expect(model.nodes[0]!.facets.text!.color).toEqual({ literal: { l: 0.5, c: 0.1, h: 250 } });
  });
});
