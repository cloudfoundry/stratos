import { describe, it, expect } from 'vitest';
import { setFacetProp, addGroup, removeGroup } from '@/state/facets-edit';

describe('facets-edit', () => {
  it('sets a nested property immutably', () => {
    const a = setFacetProp({}, 'text.fontSize', { literal: '18px' });
    expect(a.text!.fontSize).toEqual({ literal: '18px' });
  });
  it('adds and removes a group', () => {
    expect(addGroup({}, 'surface').surface).toEqual({});
    expect(removeGroup({ surface: { background: { literal: '#fff' } } }, 'surface').surface).toBeUndefined();
  });
});
