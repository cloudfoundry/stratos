import { describe, it, expect } from 'vitest';
import { CASCADE_RULES, cascadeFor } from './cascade-registry';

describe('cascade-registry', () => {
  // Entity-delete cascades moved to EntityDeleteController (relation-graph
  // derived), so org/space/app/serviceInstance/serviceBinding `.delete` keys
  // were removed. What remains: create/update cascades + route.delete (fired by
  // route *unmap*) + the dormant serviceBroker.* pair.

  it('cascadeFor("org.create") returns empty (no cascade on create)', () => {
    expect(cascadeFor('org.create')).toEqual([]);
  });

  it('cascadeFor("space.create") cascades to orgs (parent spacesCount on org rows)', () => {
    expect(cascadeFor('space.create')).toEqual(['orgs']);
  });

  it('update cascades reconcile their own slice (post-patch quota relationship calls)', () => {
    expect(cascadeFor('org.update')).toEqual(['orgs']);
    expect(cascadeFor('space.update')).toEqual(['spaces']);
  });

  it('cascadeFor("route.delete") still cascades to apps (route unmap path)', () => {
    expect(cascadeFor('route.delete')).toEqual(['apps']);
  });

  it('cascadeFor("serviceBinding.create") affects apps + serviceInstances', () => {
    expect(cascadeFor('serviceBinding.create')).toEqual(['apps', 'serviceInstances']);
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
