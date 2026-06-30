import { readFileSync } from 'node:fs';
import type { RoutingMap } from '../src/projection/projector';

export interface HarvestedElement {
  snapshotId: string;
  tag: string;
  line: number;
  role?: string;            // stba-role or real `role` (stba wins)
  roledescription?: string; // stba-roledescription or real `aria-roledescription`; the navigator "kind"
  description?: string;     // stba-description or real `aria-description`
}
export interface DriftReport { phantoms: string[]; orphans: string[] }

// Matches a start tag and captures tag name + its attribute text.
const TAG_RE = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;
const SID_RE = /stb-snapshot-id\s*=\s*"([^"]*)"/;
const ROLE_RE = /stba-role\s*=\s*"([^"]*)"/;
const ROLEDESC_RE = /stba-roledescription\s*=\s*"([^"]*)"/;
const DESC_RE = /stba-description\s*=\s*"([^"]*)"/;
// Real-ARIA fallbacks. stba-* is a strict 1-1 mirror of ARIA; the tool reads
// either, with stba winning (stba-X ?? aria-X). The leading (?:^|\s) on role
// is load-bearing: it stops `role=` matching inside `stba-role=`.
const ARIA_ROLE_RE = /(?:^|\s)role\s*=\s*"([^"]*)"/;
const ARIA_ROLEDESC_RE = /aria-roledescription\s*=\s*"([^"]*)"/;
const ARIA_DESC_RE = /aria-description\s*=\s*"([^"]*)"/;

const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export function harvestElements(html: string): HarvestedElement[] {
  const out: HarvestedElement[] = [];
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(html)) !== null) {
    const attrs = m[2]!;
    const sid = SID_RE.exec(attrs);
    if (!sid) continue;
    const role = ROLE_RE.exec(attrs) ?? ARIA_ROLE_RE.exec(attrs);
    const roledesc = ROLEDESC_RE.exec(attrs) ?? ARIA_ROLEDESC_RE.exec(attrs);
    const desc = DESC_RE.exec(attrs) ?? ARIA_DESC_RE.exec(attrs);
    out.push({
      snapshotId: sid[1]!,
      tag: m[1]!.toLowerCase(),
      line: html.slice(0, m.index).split('\n').length,
      ...(role ? { role: role[1]! } : {}),
      ...(roledesc ? { roledescription: unescape(roledesc[1]!) } : {}),
      ...(desc ? { description: unescape(desc[1]!) } : {}),
    });
  }
  return out;
}

export function lintRouting(els: HarvestedElement[], routing: RoutingMap): DriftReport {
  const elementIds = new Set(els.map((e) => e.snapshotId));
  const routingIds = new Set(Object.keys(routing.elements));
  return {
    phantoms: [...routingIds].filter((id) => !elementIds.has(id)),
    orphans: [...elementIds].filter((id) => !routingIds.has(id)),
  };
}

// NOTE: CLI entry point for template + routing validation
if (import.meta.url === `file://${process.argv[1]}`) {
  const [htmlPath, routingPath] = process.argv.slice(2);
  if (!htmlPath || !routingPath) {
    console.error('usage: harvest-login <template.component.html> <routing.json>');
    process.exit(2);
  }
  const els = harvestElements(readFileSync(htmlPath, 'utf8'));
  const routing = JSON.parse(readFileSync(routingPath, 'utf8')) as RoutingMap;
  const report = lintRouting(els, routing);
  for (const e of els) console.log(`  found  ${e.snapshotId}\t<${e.tag}> :${e.line}`);
  for (const p of report.phantoms) console.log(`  PHANTOM routing entry, no element: ${p}`);
  for (const o of report.orphans) console.log(`  ORPHAN element, no routing entry: ${o}`);
  const drift = report.phantoms.length + report.orphans.length;
  console.log(`\n${els.length} element(s); ${drift} drift issue(s).`);
  process.exit(drift > 0 ? 1 : 0);
}
