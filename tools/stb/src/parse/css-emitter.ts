import type { ElementNode } from '@/metadata/types';
import { facetDeclarations, facetLiteralCss } from '@/metadata/facets';

export function emitCss(root: Map<string, string>, dark: Map<string, string>): string {
  const parts: string[] = [];
  if (root.size > 0) parts.push(block(':root', root));
  if (dark.size > 0) parts.push(block('.dark-theme', dark));
  return parts.join('\n\n');
}

// R1 facet escape hatch: one `[stb-snapshot-id="…"] { … }` rule per element
// carrying literal facet declarations and/or a free-form scoped block, ordered
// by snapshotId so output is deterministic.
// {token} facet values are NOT emitted here — the projector handles those.
// These do NOT round-trip through parseCss (it reads only :root/.dark-theme).
export function emitScopedBlocks(nodes: ElementNode[]): string {
  return nodes
    .sort((a, b) => a.snapshotId.localeCompare(b.snapshotId))
    .map((n) => {
      // Collect literal facet declarations first (token values are skipped).
      const facetLines: string[] = [];
      if (n.facets) {
        for (const d of facetDeclarations(n.facets)) {
          const css = facetLiteralCss(d.spec, d.value);
          if (css !== null) facetLines.push(`  ${d.spec.cssProp}: ${css};`);
        }
      }

      // Terminate each scopedBlock declaration line so a user who types one
      // declaration per line (no trailing ';') still produces valid CSS instead
      // of one invalid run-on declaration. Forgiving, not validating.
      const scopedLines: string[] = n.scopedBlock
        ? n.scopedBlock.trim().split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => `  ${/[;{},]$/.test(l) ? l : l + ';'}`)
        : [];

      // Emit the rule only when the combined body is non-empty.
      const body = [...facetLines, ...scopedLines].join('\n');
      if (!body) return null;

      // Repeat the attribute selector to reach specificity (0,3,0) so the block
      // beats the snapshot's compound rules (e.g. `.login-card h1` (0,1,1),
      // `.dark-theme .login-card h1` (0,2,1)) without `!important` — keeping
      // company-config inline styles (the higher, runtime-faithful path) winning.
      const selector = `[stb-snapshot-id="${n.snapshotId}"]`.repeat(3);
      return `${selector} {\n${body}\n}`;
    })
    .filter((r): r is string => r !== null)
    .join('\n\n');
}

function block(selector: string, values: Map<string, string>): string {
  const keys = [...values.keys()].sort();
  const lines = keys.map((k) => `  ${k}: ${values.get(k)};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}
