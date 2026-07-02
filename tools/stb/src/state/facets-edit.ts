import type { Facets, FacetValue, Layer } from '@/metadata/types';

type Group = 'text' | 'surface' | 'spacing';
const groupOf = (key: string) => key.split('.')[0] as Group;
const propOf  = (key: string) => key.split('.')[1]!;

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

// --- background composite: backstop color + bottom-up layer stack ---
// Layers append on top (last index = topmost); the emitter reverses this
// order so CSS sees topmost-first, per the bottom-up authoring model.
const bg = (f: Facets) => f.background ?? {};

export function setBackstop(f: Facets, color: FacetValue): Facets {
  return { ...f, background: { ...bg(f), color } };
}
export function addLayer(f: Facets, layer: Layer): Facets {
  return { ...f, background: { ...bg(f), layers: [...(bg(f).layers ?? []), layer] } };
}
export function setLayer(f: Facets, index: number, layer: Layer): Facets {
  const layers = [...(bg(f).layers ?? [])];
  layers[index] = layer;
  return { ...f, background: { ...bg(f), layers } };
}
export function removeLayer(f: Facets, index: number): Facets {
  const layers = [...(bg(f).layers ?? [])];
  layers.splice(index, 1);
  return { ...f, background: { ...bg(f), layers } };
}
export function reorderLayer(f: Facets, from: number, to: number): Facets {
  const layers = [...(bg(f).layers ?? [])];
  const [moved] = layers.splice(from, 1);
  layers.splice(to, 0, moved!);
  return { ...f, background: { ...bg(f), layers } };
}

// --- font-family composite: ordered comma-list fallback stack (same kind-1 shape as background.layers) ---
const fonts = (f: Facets) => f.text?.fontFamily ?? [];

export function addFont(f: Facets, value: FacetValue): Facets {
  return { ...f, text: { ...(f.text ?? {}), fontFamily: [...fonts(f), value] } };
}
export function setFont(f: Facets, index: number, value: FacetValue): Facets {
  const fontFamily = [...fonts(f)];
  fontFamily[index] = value;
  return { ...f, text: { ...(f.text ?? {}), fontFamily } };
}
export function removeFont(f: Facets, index: number): Facets {
  const fontFamily = [...fonts(f)];
  fontFamily.splice(index, 1);
  return { ...f, text: { ...(f.text ?? {}), fontFamily } };
}
export function reorderFont(f: Facets, from: number, to: number): Facets {
  const fontFamily = [...fonts(f)];
  const [moved] = fontFamily.splice(from, 1);
  fontFamily.splice(to, 0, moved!);
  return { ...f, text: { ...(f.text ?? {}), fontFamily } };
}
