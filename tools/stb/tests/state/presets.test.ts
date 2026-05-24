import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPresetFromCss, savePreset, listSavedPresets, deleteSavedPreset } from '@/state/presets';
import { rootValues, darkValues, resetTokens } from '@/state/tokens';

describe('preset load/save', () => {
  beforeEach(() => {
    resetTokens();
    localStorage.clear();
  });

  it('loadPresetFromCss populates root and dark signals', () => {
    const css = `:root { --color-brand-500: #aaa; }\n.dark-theme { --color-brand-500: #bbb; }`;
    loadPresetFromCss(css);
    expect(rootValues.value.get('--color-brand-500')).toBe('#aaa');
    expect(darkValues.value.get('--color-brand-500')).toBe('#bbb');
  });

  it('savePreset stores in localStorage', () => {
    rootValues.value = new Map([['--color-brand-500', '#aaa']]);
    darkValues.value = new Map();
    savePreset({ id: 'mine', name: 'My theme', description: '' });
    const list = listSavedPresets();
    expect(list.find((p) => p.id === 'mine')?.name).toBe('My theme');
  });

  it('deleteSavedPreset removes from localStorage', () => {
    rootValues.value = new Map([['--color-brand-500', '#aaa']]);
    savePreset({ id: 'mine', name: 'My theme', description: '' });
    deleteSavedPreset('mine');
    expect(listSavedPresets().find((p) => p.id === 'mine')).toBeUndefined();
  });
});
