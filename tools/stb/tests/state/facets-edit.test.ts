import { describe, it, expect } from 'vitest';
import { setFacetProp, addGroup, removeGroup, darkView } from '@/state/facets-edit';

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

it('darkView mirrors the light group skeleton with dark values, drops content/asset', () => {
  const light = { text: { color: { literal: { l: 0.1, c: 0, h: 0 } }, fontSize: { literal: '14px' } }, content: { text: 'hi' } } as const;
  const dark = { text: { fontSize: { literal: '20px' } } } as const;
  const view = darkView(light, dark);
  expect(Object.keys(view)).toEqual(['text']);            // same style group present; content excluded
  expect(view.text).toEqual({ fontSize: { literal: '20px' } }); // dark values only
});
