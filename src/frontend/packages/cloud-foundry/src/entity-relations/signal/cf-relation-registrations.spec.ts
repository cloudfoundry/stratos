import { describe, it, expect, vi } from 'vitest';

import { affectedSlices } from '../../services/deletes/affected-slices';
import { indexDescriptors } from './signal-relation-tree';
import {
  CF_RELATION_DESCRIPTORS,
  registerCfRelationDescriptors,
} from './cf-relation-registrations';

// ---------------------------------------------------------------------------
// These specs prove that the REAL CF relation descriptors, once registered,
// derive a delete-invalidation closure that covers `routes` — the slice the
// legacy hand-curated cascade-registry (org.delete) silently dropped.
//
// affectedSlices is pure, so we build the registry straight from the exported
// descriptor list (the same `indexDescriptors` the fetcher uses internally).
// ---------------------------------------------------------------------------

const registry = indexDescriptors(CF_RELATION_DESCRIPTORS);

describe('CF relation registrations — delete-invalidation closure', () => {
  describe('organization root (the reproduced bug)', () => {
    const slices = affectedSlices('organization', registry);

    it('covers every server-side cascade of an org delete', () => {
      expect(slices).toEqual(
        expect.arrayContaining([
          'spaces',
          'apps',
          'routes',
          'serviceInstances',
          'serviceCredentialBindings',
        ]),
      );
    });

    it('covers routes — the gap the old cascade-registry had', () => {
      // cascade-registry org.delete was ['spaces','apps','serviceInstances',
      // 'serviceCredentialBindings'] — routes was never invalidated, leaving
      // stale per-space/app route lists after an org delete.
      expect(slices).toContain('routes');
    });

    it('does not invalidate the org slice itself', () => {
      expect(slices).not.toContain('orgs');
    });

    it('returns a de-duplicated set', () => {
      expect(slices).toHaveLength(new Set(slices).size);
    });
  });

  describe('space root', () => {
    const slices = affectedSlices('space', registry);

    it('covers apps, routes, serviceInstances, serviceCredentialBindings', () => {
      expect(slices).toEqual(
        expect.arrayContaining(['apps', 'routes', 'serviceInstances', 'serviceCredentialBindings']),
      );
    });

    it('does not invalidate the space slice itself', () => {
      expect(slices).not.toContain('spaces');
    });
  });

  describe('application root', () => {
    const slices = affectedSlices('application', registry);

    it('covers routes and serviceCredentialBindings', () => {
      expect(slices).toEqual(expect.arrayContaining(['routes', 'serviceCredentialBindings']));
    });
  });

  describe('serviceInstance root', () => {
    it('covers serviceCredentialBindings', () => {
      expect(affectedSlices('serviceInstance', registry)).toContain('serviceCredentialBindings');
    });
  });
});

describe('registerCfRelationDescriptors', () => {
  it('bulk-registers the descriptor set into a fetcher', () => {
    const fetcher = { registerAll: vi.fn() };
    registerCfRelationDescriptors(fetcher as any);
    expect(fetcher.registerAll).toHaveBeenCalledWith(CF_RELATION_DESCRIPTORS);
  });
});
