import { signal } from '@preact/signals-core';
import metadata from '@/data/token-metadata.json';

export interface TokenSpec {
  name: string;
  default: string;
  category: string;
  required: boolean;
}

export interface TokenGroup {
  name: string;
  description: string;
  tokens: TokenSpec[];
}

export interface TokenMetadata {
  version: number;
  groups: TokenGroup[];
}

export const tokenMetadata: TokenMetadata = metadata as TokenMetadata;

export const rootValues = signal<Map<string, string>>(new Map());
export const darkValues = signal<Map<string, string>>(new Map());

export function setRootValue(token: string, value: string): void {
  const next = new Map(rootValues.value);
  next.set(token, value);
  rootValues.value = next;
}

export function setDarkValue(token: string, value: string): void {
  const next = new Map(darkValues.value);
  next.set(token, value);
  darkValues.value = next;
}

export function clearRootValue(token: string): void {
  const next = new Map(rootValues.value);
  next.delete(token);
  rootValues.value = next;
}

export function clearDarkValue(token: string): void {
  const next = new Map(darkValues.value);
  next.delete(token);
  darkValues.value = next;
}

export function resetTokens(): void {
  rootValues.value = new Map();
  darkValues.value = new Map();
}

export function effectiveValue(token: string, dark: boolean): string {
  if (dark) {
    const v = darkValues.value.get(token);
    if (v !== undefined) return v;
    return defaultFor(token);
  }
  const r = rootValues.value.get(token);
  if (r !== undefined) return r;
  return defaultFor(token);
}

const defaultMap = (() => {
  const m = new Map<string, string>();
  for (const g of tokenMetadata.groups) for (const t of g.tokens) m.set(t.name, t.default);
  return m;
})();

export function defaultFor(token: string): string {
  return defaultMap.get(token) ?? '';
}

export function requiredTokens(): Set<string> {
  const s = new Set<string>();
  for (const g of tokenMetadata.groups) {
    for (const t of g.tokens) if (t.required) s.add(t.name);
  }
  return s;
}
