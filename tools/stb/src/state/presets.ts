import { parseCss } from '@/parse/css-parser';
import { emitCss } from '@/parse/css-emitter';
import { rootValues, darkValues } from '@/state/tokens';

export interface PresetMeta {
  id: string;
  name: string;
  description: string;
  thumbnail?: string | null;
}

export interface SavedPreset extends PresetMeta {
  themeCss: string;
}

const STORAGE_KEY = 'stb.saved-presets.v1';

export function loadPresetFromCss(css: string): void {
  const parsed = parseCss(css);
  rootValues.value = parsed.root;
  darkValues.value = parsed.dark;
}

export async function loadBuiltInPreset(id: string): Promise<void> {
  const res = await fetch(`/data/presets/${id}/theme.css`);
  const css = await res.text();
  loadPresetFromCss(css);
}

export function savePreset(meta: PresetMeta): void {
  const css = emitCss(rootValues.value, darkValues.value);
  const all = listSavedPresets().filter((p) => p.id !== meta.id);
  all.push({ ...meta, themeCss: css });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function listSavedPresets(): SavedPreset[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedPreset[];
  } catch {
    return [];
  }
}

export function loadSavedPreset(id: string): boolean {
  const preset = listSavedPresets().find((p) => p.id === id);
  if (!preset) return false;
  loadPresetFromCss(preset.themeCss);
  return true;
}

export function deleteSavedPreset(id: string): void {
  const next = listSavedPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
