import { describe, it, expect, beforeEach } from 'vitest';
import { buildVisibilityCompanion } from '@/ui/element-edit';
import { brandingModel, nodeFor } from '@/state/branding';
import type { BrandingModel } from '@/metadata/types';

const model: BrandingModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'auth.login.logo', role: 'img', name: 'L', description: 'logo',
      facets: { asset: { ref: 'logo.svg' } }, visibility: true },
  ],
};

describe('buildVisibilityCompanion', () => {
  it('returns empty object when visibility is undefined (no companion)', () => {
    expect(buildVisibilityCompanion('auth.login.title', undefined)).toEqual({});
  });

  it('returns a companion with shown:true when visibility is true', () => {
    const result = buildVisibilityCompanion('auth.login.logo', true);
    expect(result.visibilityCompanion?.shown).toBe(true);
  });

  it('returns a companion with shown:false when visibility is false', () => {
    const result = buildVisibilityCompanion('auth.login.logo', false);
    expect(result.visibilityCompanion?.shown).toBe(false);
  });

  describe('onChange', () => {
    beforeEach(() => { brandingModel.value = JSON.parse(JSON.stringify(model)); });

    it('onChange hides the element by calling setNodeVisibility', () => {
      const result = buildVisibilityCompanion('auth.login.logo', true);
      result.visibilityCompanion!.onChange(false);
      expect(nodeFor('auth.login.logo')?.visibility).toBe(false);
    });

    it('onChange shows the element by calling setNodeVisibility', () => {
      const m = JSON.parse(JSON.stringify(model)) as BrandingModel;
      m.nodes[0]!.visibility = false;
      brandingModel.value = m;
      const result = buildVisibilityCompanion('auth.login.logo', false);
      result.visibilityCompanion!.onChange(true);
      expect(nodeFor('auth.login.logo')?.visibility).toBe(true);
    });
  });
});
