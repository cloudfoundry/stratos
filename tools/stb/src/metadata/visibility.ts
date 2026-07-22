export function nodeVisibility(node: { visibility: boolean | undefined }): boolean {
  return node.visibility ?? true;
}
