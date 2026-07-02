import { signal } from '@preact/signals-core';

export const activeSceneId = signal<string>('login');
export const previewDark = signal<boolean>(false);
// Dual read-only compare: two panes pinned light/dark side by side. While on,
// previewDark is pinned false and its control is inert (compare owns the axis).
export const compareMode = signal<boolean>(false);
