import type { ElementNode } from './types';

export function nodeVisibility(node: { visibility: boolean | undefined }): boolean {
  return node.visibility ?? true;
}
