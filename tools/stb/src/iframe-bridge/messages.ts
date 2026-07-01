import type { LeverPatch } from '@/iframe-bridge/apply-levers';

export const PROTOCOL_VERSION = 1;

export type ParentToPreview =
  | { type: 'STB_HELLO'; version: number }
  | { type: 'STB_APPLY_VARS'; root: Record<string, string>; dark: Record<string, string> }
  | { type: 'STB_SET_DARK'; dark: boolean }
  | { type: 'STB_HIGHLIGHT_TOKEN'; token: string | null }
  | { type: 'STB_HIGHLIGHT_ELEMENT'; snapshotId: string | null }
  | { type: 'STB_REVEAL'; snapshotId: string | null }
  | { type: 'STB_APPLY_LEVERS'; levers: LeverPatch[] }
  | { type: 'STB_APPLY_BLOCKS'; css: string }
  | { type: 'STB_SET_LEVERS'; ids: string[] }
  | { type: 'STB_SET_LEVER_OUTLINE'; on: boolean };

export type PreviewToParent =
  | { type: 'STB_PREVIEW_READY'; version: number }
  | { type: 'STB_ELEMENT_SELECTED'; selector: string; tokens: string[]; snapshotId: string | null };
