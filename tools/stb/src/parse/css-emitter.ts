export function emitCss(root: Map<string, string>, dark: Map<string, string>): string {
  const parts: string[] = [];
  if (root.size > 0) parts.push(block(':root', root));
  if (dark.size > 0) parts.push(block('.dark-theme', dark));
  return parts.join('\n\n');
}

function block(selector: string, values: Map<string, string>): string {
  const keys = [...values.keys()].sort();
  const lines = keys.map((k) => `  ${k}: ${values.get(k)};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}
