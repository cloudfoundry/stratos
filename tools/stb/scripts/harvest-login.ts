import { readFileSync } from 'node:fs';
import type { RoutingMap } from '../src/projection/projector';

export interface HarvestedElement { snapshotId: string; tag: string; line: number }
export interface DriftReport { phantoms: string[]; orphans: string[] }

// Matches a start tag and captures tag name + its attribute text.
const TAG_RE = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;
const SID_RE = /stb-snapshot-id\s*=\s*"([^"]*)"/;

export function harvestElements(html: string): HarvestedElement[] {
  const out: HarvestedElement[] = [];
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(html)) !== null) {
    const sid = SID_RE.exec(m[2]!);
    if (!sid) continue;
    out.push({
      snapshotId: sid[1]!,
      tag: m[1]!.toLowerCase(),
      line: html.slice(0, m.index).split('\n').length,
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
