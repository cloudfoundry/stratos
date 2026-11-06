export interface ParsedCss {
  root: Map<string, string>;
  dark: Map<string, string>;
}

export function parseCss(input: string): ParsedCss {
  const stripped = stripComments(input);
  return {
    root: extractBlock(stripped, /:root\s*\{([^}]*)\}/g),
    dark: extractBlock(stripped, /\.dark-theme\s*\{([^}]*)\}/g),
  };
}

function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractBlock(source: string, blockRe: RegExp): Map<string, string> {
  const out = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(source)) !== null) {
    const body = match[1] ?? '';
    parseDeclarations(body, out);
  }
  return out;
}

function parseDeclarations(body: string, out: Map<string, string>): void {
  // Split on semicolons that aren't inside parens
  let depth = 0;
  let buf = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      consumeDecl(buf, out);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) consumeDecl(buf, out);
}

function consumeDecl(text: string, out: Map<string, string>): void {
  const trimmed = text.trim();
  if (!trimmed.startsWith('--')) return;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx < 0) return;
  const name = trimmed.slice(0, colonIdx).trim();
  const value = trimmed.slice(colonIdx + 1).trim();
  if (!name || !value) return;
  out.set(name, value);
}
