import { signal } from '@preact/signals-core';

export const activeSceneId = signal<string>('login');
export const previewDark = signal<boolean>(false);
