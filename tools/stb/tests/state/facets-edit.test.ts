import { describe, it, expect } from 'vitest';
import { setFacetProp, clearFacetProp, addGroup, removeGroup, promoteToToken, detachToLiteral } from '@/state/facets-edit';

describe('facets-edit', () => {
  it('sets and clears a nested property immutably', () => {
    const a = setFacetProp({}, 'text.fontSize', { literal: '18px' });
    expect(a.text!.fontSize).toEqual({ literal: '18px' });
    const b = clearFacetProp(a, 'text.fontSize');
    expect(b.text!.fontSize).toBeUndefined();
    expect(a.text!.fontSize).toEqual({ literal: '18px' }); // original untouched
  });
  it('adds and removes a group', () => {
    expect(addGroup({}, 'surface').surface).toEqual({});
    expect(removeGroup({ surface: { background: { literal: '#fff' } } }, 'surface').surface).toBeUndefined();
  });
  it('promotes a literal to a token and detaches back', () => {
    const t = promoteToToken({ text: { color: { literal: { l:0,c:0,h:0 } } } }, 'text.color', 'fg');
    expect(t.text!.color).toEqual({ token: 'fg' });
    const d = detachToLiteral(t, 'text.color', { l:0,c:0,h:0 });
    expect(d.text!.color).toEqual({ literal: { l:0,c:0,h:0 } });
  });
});
