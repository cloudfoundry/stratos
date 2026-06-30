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
    .map((node) => {
      // Repeat the attribute selector to reach specificity (0,3,0) so the block
      // beats the snapshot's compound rules (e.g. `.login-card h1` (0,1,1)) without
      // `!important` — keeping company-config inline styles winning.
      const selector = `[stb-snapshot-id="${node.snapshotId}"]`.repeat(3);
      const rules: string[] = [];

      // Light block: literal facet declarations first, then the free-form scopedBlock.
      const facetLines: string[] = [];
      for (const d of facetDeclarations(node.facets)) {
        const css = facetLiteralCss(d.spec, d.value);
        if (css !== null) facetLines.push(`  ${d.spec.cssProp}: ${css};`);
      }
      const scopedLines: string[] = node.scopedBlock
        ? node.scopedBlock.trim().split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => `  ${/[;{},]$/.test(l) ? l : l + ';'}`)
        : [];
      const lightBody = [...facetLines, ...scopedLines].join('\n');
      if (lightBody) rules.push(`${selector} {\n${lightBody}\n}`);

      // Dark block: literal facetsDark declarations, gated by .dark-theme. Combined
      // selector is (0,4,0) — beats the light block (0,3,0) AND the snapshot's own
      // `.dark-theme .x` (0,2,0). {token} dark values are skipped (projector territory).
      if (node.facetsDark) {
        const darkLines: string[] = [];
        for (const d of facetDeclarations(node.facetsDark)) {
          const css = facetLiteralCss(d.spec, d.value);
          if (css !== null) darkLines.push(`  ${d.spec.cssProp}: ${css};`);
        }
        if (darkLines.length) rules.push(`.dark-theme ${selector} {\n${darkLines.join('\n')}\n}`);
      }

      return rules.length ? rules.join('\n\n') : null;
    })
    .filter((r): r is string => r !== null)
    .join('\n\n');
}

function block(selector: string, values: Map<string, string>): string {
  const keys = [...values.keys()].sort();
  const lines = keys.map((k) => `  ${k}: ${values.get(k)};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}
