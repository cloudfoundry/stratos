import { readFileSync } from 'node:fs';

interface WorklistRow {
  file: string;
  line: number;
  dataTest: string;
  suggestedId: string;
  suggestedConfig: string;
}

// area from a *.component.html filename: 'cf-users.component.html' -> 'cf.users'
function areaFromFile(file: string): string {
  const base = file.replace(/\.component\.html$/, '').split('/').pop() || file;
  return base.replace(/-/g, '.');
}

const TAG_RE = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;
const DATA_TEST_RE = /data-test\s*=\s*"([^"]*)"/;
const HAS_SID_RE = /data-stratos-snapshot-id\s*=/;

export function buildWorklist(html: string, file: string): WorklistRow[] {
  const area = areaFromFile(file);
  const rows: WorklistRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(html)) !== null) {
    const attrs = m[2]!;
    const dt = DATA_TEST_RE.exec(attrs);
    if (!dt || HAS_SID_RE.test(attrs)) continue;
    const line = html.slice(0, m.index).split('\n').length;
    const leaf = dt[1]!.split('-').pop() || dt[1]!;
    rows.push({
      file,
      line,
      dataTest: dt[1]!,
      suggestedId: `${area}.${dt[1]!}`,
      suggestedConfig: leaf,
    });
  }
  return rows;
}

// CLI: node seed-worklist.mjs <file...>
if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  const rows = files.flatMap((f) => buildWorklist(readFileSync(f, 'utf8'), f));
  for (const r of rows)
    console.log(`${r.file}:${r.line}\t${r.dataTest}\t-> ${r.suggestedId}\t[config: ${r.suggestedConfig}]`);
  console.log(`\n${rows.length} element(s) to instrument.`);
}
