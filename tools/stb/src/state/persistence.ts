import { effect } from '@preact/signals-core';
import { rootValues, darkValues } from '@/state/tokens';

const KEY = 'stb.session.v1';

interface SessionData {
  root: [string, string][];
  dark: [string, string][];
}

export function saveSession(): void {
  const data: SessionData = {
    root: [...rootValues.value.entries()],
    dark: [...darkValues.value.entries()],
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function restoreSession(): boolean {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as SessionData;
    rootValues.value = new Map(data.root);
    darkValues.value = new Map(data.dark);
    return true;
  } catch {
    return false;
  }
}

export function startAutoSave(): void {
  effect(() => { void rootValues.value; void darkValues.value; saveSession(); });
}
