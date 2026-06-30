import type { Facets, FacetValue } from '@/metadata/types';
import type { Oklch } from '@/color/oklch';

type Group = 'text' | 'surface' | 'spacing';
const groupOf = (key: string) => key.split('.')[0] as Group;
const propOf  = (key: string) => key.split('.')[1]!;

export function setFacetProp(f: Facets, key: string, value: FacetValue): Facets {
  const g = groupOf(key);
  return { ...f, [g]: { ...(f[g] ?? {}), [propOf(key)]: value } };
}
export function clearFacetProp(f: Facets, key: string): Facets {
  const g = groupOf(key);
  if (!f[g]) return f;
  const next = { ...(f[g] as Record<string, unknown>) };
  delete next[propOf(key)];
  return { ...f, [g]: next };
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
export function promoteToToken(f: Facets, key: string, token: string): Facets {
  return setFacetProp(f, key, { token });
}
export function detachToLiteral(f: Facets, key: string, literal: Oklch | string): Facets {
  return setFacetProp(f, key, { literal });
}
