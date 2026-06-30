import type { Facets, FacetValue } from '@/metadata/types';

type Group = 'text' | 'surface' | 'spacing';
const groupOf = (key: string) => key.split('.')[0] as Group;
const propOf  = (key: string) => key.split('.')[1]!;

const STYLE_GROUPS = ['text', 'surface', 'spacing'] as const;

/** Dark editing view: same style-group keys as the light bundle (so the same
 *  property leaves render in the tree), values taken from the dark bundle.
 *  content/asset are mode-invariant and excluded. */
export function darkView(light: Facets, dark: Facets): Facets {
  const out: Facets = {};
  for (const g of STYLE_GROUPS) {
    if (light[g]) out[g] = dark[g] ?? {};
  }
  return out;
}

export function setFacetProp(f: Facets, key: string, value: FacetValue): Facets {
  const g = groupOf(key);
  return { ...f, [g]: { ...(f[g] ?? {}), [propOf(key)]: value } };
}
export function addGroup(f: Facets, group: Group): Facets {
  return f[group] ? f : { ...f, [group]: {} };
}
export function removeGroup(f: Facets, group: Group): Facets {
  if (!f[group]) return f;
  const next = { ...f };
  delete next[group];
  return next;
}
