import { describe, it, expect } from 'vitest';
import { CASCADE_RULES, cascadeFor } from './cascade-registry';

describe('cascade-registry', () => {
  it('cascadeFor returns the registered entry', () => {
    expect(cascadeFor('org.delete')).toEqual(['spaces', 'apps', 'serviceInstances', 'serviceCredentialBindings']);
  });

  it('cascadeFor("org.create") returns empty (no cascade on create)', () => {
    expect(cascadeFor('org.create')).toEqual([]);
  });

  it('cascadeFor("space.delete") cascades to apps + SI + bindings (not orgs/spaces)', () => {
    const list = cascadeFor('space.delete');
    expect(list).toContain('apps');
    expect(list).toContain('serviceInstances');
    expect(list).toContain('serviceCredentialBindings');
    expect(list).not.toContain('orgs');
    expect(list).not.toContain('spaces');
  });

  it('cascadeFor("app.delete") drops only bindings (no cross-org cascade)', () => {
    expect(cascadeFor('app.delete')).toEqual(['serviceCredentialBindings']);
  });

  it('cascadeFor("serviceBinding.delete") affects apps + serviceInstances', () => {
    expect(cascadeFor('serviceBinding.delete')).toEqual(['apps', 'serviceInstances']);
  });

  it('cascadeFor("serviceBroker.delete") affects offerings + plans', () => {
    expect(cascadeFor('serviceBroker.delete')).toEqual(['serviceOfferings', 'servicePlans']);
  });

  it('every CascadeKey has an entry in CASCADE_RULES (registry is complete)', () => {
    // Compile-time exhaustiveness comes via the Record<CascadeKey, ...> type;
    // this runtime check just confirms entries are arrays.
    for (const [key, list] of Object.entries(CASCADE_RULES)) {
      expect(Array.isArray(list), `${key} should map to an array`).toBe(true);
    }
  });
});
