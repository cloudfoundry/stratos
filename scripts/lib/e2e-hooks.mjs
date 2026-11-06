// Single definition of the test-hook syntax shared by the two consumers
// (scripts/lint-e2e-data-test.mjs and scripts/e2e-impact.mjs), so a new
// binding form added for one check cannot silently escape the other.

import { readdirSync } from 'node:fs'

export function files(dir, ext) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return []
    const p = `${dir}/${entry.name}`
    if (entry.isDirectory()) return files(p, ext)
    return ext.some((e) => entry.name.endsWith(e)) ? [p] : []
  })
}

// Definitions components provide: static attributes, plus every quoted
// string fragment inside a dynamic [attr.data-test] binding ('refresh' and
// 'refresh-loading' out of a ternary, prefixes like 'header-action-').
// A data-testid ref must not match a data-test definition, so the static
// data-test pattern excludes the 'id'-suffixed attribute via (?!id).
export const HOOK_DEFS = {
  'data-test': [/(?<!\[attr\.)data-test(?!id)=["']([^"']+)/g, /\[attr\.data-test\]="([^"]*)"/g],
  'data-testid': [/(?<!\[attr\.)data-testid=["']([^"']+)/g, /\[attr\.data-testid\]="([^"]*)"/g],
}

// dataTest config values (SignalListRowAction etc.) are full definitions.
export const DATA_TEST_CONFIG = /\bdataTest:\s*['"]([^'"]+)['"]/g

// Unit-test fixtures declare label:/dataTest:/data-test= literals that are
// never shipped DOM — harvesting them would let renamed-label drift hide
// behind a spec fixture. Only non-spec sources define the contract.
export function contractSources(dir) {
  return files(dir, ['.html', '.ts']).filter((f) => !f.endsWith('.spec.ts'))
}
