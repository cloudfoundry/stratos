export const PROTOCOL_VERSION = 1;

export type ParentToPreview =
  | { type: 'STB_HELLO'; version: number }
  | { type: 'STB_APPLY_VARS'; root: Record<string, string>; dark: Record<string, string> }
  | { type: 'STB_SET_DARK'; dark: boolean }
  | { type: 'STB_HIGHLIGHT_TOKEN'; token: string | null };

export type PreviewToParent =
  | { type: 'STB_PREVIEW_READY'; version: number }
  | { type: 'STB_ELEMENT_SELECTED'; selector: string; tokens: string[] };
