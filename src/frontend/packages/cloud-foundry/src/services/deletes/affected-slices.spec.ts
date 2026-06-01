import { describe, it, expect } from 'vitest';
import { indexDescriptors } from '../../entity-relations/signal/signal-relation-tree';
import type { RelationDescriptor } from '../../entity-relations/signal/signal-relation-types';
import { affectedSlices } from './affected-slices';

// ---------------------------------------------------------------------------
// Helpers — build a RelationDescriptorRegistry from an inline descriptor list.
// We use `indexDescriptors` from the substrate (same function the service
// uses internally) so the registry shape is identical to production.
// fetchChildren is a no-op stub: affectedSlices is pure/sync and never calls it.
// ---------------------------------------------------------------------------

const stub = (): never => { throw new Error('fetchChildren must not be called in affectedSlices'); };

function makeDescriptor(
  parentEntityType: string,
  childEntityType: string,
  paramName: string,
): RelationDescriptor {
  return { parentEntityType, childEntityType, paramName, isArray: true, fetchChildren: stub };
}

// ---------------------------------------------------------------------------
// Test registry: org -> spaces, space -> apps, space -> routes,
//                app -> serviceCredentialBindings
// ---------------------------------------------------------------------------

const ORG_SPACE   = makeDescriptor('organization', 'space',                     'spaces');
const SPACE_APP   = makeDescriptor('space',        'application',               'apps');
const SPACE_ROUTE = makeDescriptor('space',        'route',                     'routes');
const APP_SCB     = makeDescriptor('application',  'serviceCredentialBinding',  'serviceCredentialBindings');

const testRegistry = indexDescriptors([ORG_SPACE, SPACE_APP, SPACE_ROUTE, APP_SCB]);

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe('affectedSlices', () => {
  describe('organization root — full transitive closure', () => {
    it('contains spaces (direct child)', () => {
      expect(affectedSlices('organization', testRegistry)).toContain('spaces');
    });

    it('contains apps (org → space → app)', () => {
      expect(affectedSlices('organization', testRegistry)).toContain('apps');
    });

    it('contains routes (org → space → route)', () => {
      expect(affectedSlices('organization', testRegistry)).toContain('routes');
    });

    it('contains serviceCredentialBindings (org → space → app → scb)', () => {
      expect(affectedSlices('organization', testRegistry)).toContain('serviceCredentialBindings');
    });

    it('does not contain the root type itself (organizations)', () => {
      const result = affectedSlices('organization', testRegistry);
      expect(result).not.toContain('orgs');
    });

    it('returns no duplicate slice names', () => {
      const result = affectedSlices('organization', testRegistry);
      expect(result).toHaveLength(new Set(result).size);
    });
  });

  describe('space root — partial closure, no parent types', () => {
    it('contains apps', () => {
      expect(affectedSlices('space', testRegistry)).toContain('apps');
    });

    it('contains routes', () => {
      expect(affectedSlices('space', testRegistry)).toContain('routes');
    });

    it('contains serviceCredentialBindings (space → app → scb)', () => {
      expect(affectedSlices('space', testRegistry)).toContain('serviceCredentialBindings');
    });

    it('does NOT contain spaces (that is the root level)', () => {
      expect(affectedSlices('space', testRegistry)).not.toContain('spaces');
    });
  });

  describe('cycle safety', () => {
    it('does not infinite-loop on a cyclic registry (org → space, space → org)', () => {
      const cyclicRegistry = indexDescriptors([
        makeDescriptor('organization', 'space', 'spaces'),
        makeDescriptor('space', 'organization', 'orgs'),
      ]);
      // Must return a finite result without hanging.
      const result = affectedSlices('organization', cyclicRegistry);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns a finite, de-duplicated set from a cyclic registry', () => {
      const cyclicRegistry = indexDescriptors([
        makeDescriptor('organization', 'space', 'spaces'),
        makeDescriptor('space', 'organization', 'orgs'),
      ]);
      const result = affectedSlices('organization', cyclicRegistry);
      expect(result).toHaveLength(new Set(result).size);
      // Both reachable child types should appear.
      expect(result).toContain('spaces');
      expect(result).toContain('orgs');
    });
  });

  describe('unknown root', () => {
    it('returns [] when root has no registered descriptors', () => {
      expect(affectedSlices('unknownType', testRegistry)).toEqual([]);
    });

    it('returns [] against an empty registry', () => {
      expect(affectedSlices('organization', indexDescriptors([]))).toEqual([]);
    });
  });
});
